# python_backend/app/sandbox/executor.py
"""
Docker container executor for the sandbox.

Security model:
  - network_mode="none"            — no outbound or inbound networking
  - user="nobody"                  — non-root execution
  - cap_drop=["ALL"]               — all Linux capabilities dropped
  - security_opt=["no-new-privileges:true"]
  - cpu_period / cpu_quota         — limited to 1 CPU
  - mem_limit / memswap_limit      — 256 MB RAM, no swap
  - timeout                        — SIGKILL after SANDBOX_TIMEOUT_SECONDS
  - auto_remove=True               — container removed automatically on exit
  - cleanup on exception           — container killed/removed if we crash

All Docker images and commands come from the server-side LanguageSpec,
never from user input.
"""

from __future__ import annotations

import asyncio
import io
import logging
import os
import tarfile
import time
import uuid
from typing import Optional, Tuple

import docker
from docker.errors import ContainerError, ImageNotFound, NotFound, DockerException

from .config import sandbox_settings
from .languages import LanguageSpec
from .schemas import Verdict

logger = logging.getLogger(__name__)


def _get_docker_client() -> docker.DockerClient:
    """Return a Docker client connected to the local daemon."""
    return docker.from_env()


def _build_tar_bytes(files: dict[str, str]) -> bytes:
    """Pack files into an in-memory tar archive for docker cp."""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode="w") as tf:
        for name, content in files.items():
            encoded = content.encode("utf-8")
            info = tarfile.TarInfo(name=name)
            info.size = len(encoded)
            info.mode = 0o666
            tf.addfile(info, io.BytesIO(encoded))
    return buf.getvalue()



class ExecutionResult:
    """Raw output from a single container execution."""

    def __init__(
        self,
        verdict: Verdict,
        stdout: str = "",
        stderr: str = "",
        exit_code: int = 0,
        execution_time_ms: float = 0.0,
        compile_error: Optional[str] = None,
        runtime_error: Optional[str] = None,
    ):
        self.verdict = verdict
        self.stdout = stdout
        self.stderr = stderr
        self.exit_code = exit_code
        self.execution_time_ms = execution_time_ms
        self.compile_error = compile_error
        self.runtime_error = runtime_error


def _run_container_sync(
    client: docker.DockerClient,
    spec: LanguageSpec,
    source_code: str,
    stdin: str,
) -> ExecutionResult:
    """
    Execute code inside a Docker container synchronously.

    Steps:
    1. If the language needs compilation, run a compile container first.
    2. Run the program container with stdin piped, capturing stdout/stderr.
    3. If the container runs over SANDBOX_TIMEOUT_SECONDS, kill it and return TLE.
    4. Cleanup the container regardless of outcome.
    """
    timeout = sandbox_settings.SANDBOX_TIMEOUT_SECONDS

    # ── Helper: common container kwargs ──────────────────────────────────────
    def _container_kwargs(cmd: list[str], extra_volumes: dict | None = None) -> dict:
        return dict(
            image=spec.image,
            command=cmd,
            stdin_open=True,
            detach=True,
            network_mode="none",
            user="nobody",
            cap_drop=["ALL"],
            security_opt=["no-new-privileges:true"],
            cpu_period=sandbox_settings.SANDBOX_CPU_PERIOD,
            cpu_quota=sandbox_settings.SANDBOX_CPU_QUOTA,
            mem_limit=sandbox_settings.SANDBOX_MEMORY_LIMIT,
            memswap_limit=sandbox_settings.SANDBOX_MEMORY_LIMIT,
            # /tmp is writable by nobody; we write source there
            working_dir="/sandbox",
            volumes=extra_volumes or {},
        )

    # ─── STEP 1: Create a temporary working volume (tmpfs) ───────────────────
    # We use a named volume per execution so the nobody user can write to it.
    volume_name = f"sandbox-{uuid.uuid4().hex}"
    volume = client.volumes.create(volume_name)

    container = None
    try:
        # ─── STEP 2: Write source file into the volume via a setup container ──
        setup_image = "busybox"  # tiny image just to cp files
        try:
            client.images.get(setup_image)
        except ImageNotFound:
            client.images.pull(setup_image)

        try:
            client.images.get(spec.image)
        except ImageNotFound:
            logger.info("Pulling image %s...", spec.image)
            client.images.pull(spec.image)

        setup = client.containers.run(
            setup_image,
            command=["sh", "-c", f"mkdir -p /sandbox && chmod 777 /sandbox"],
            volumes={volume_name: {"bind": "/sandbox", "mode": "rw"}},
            remove=True,
            network_mode="none",
            user="root",
        )

        # ─── STEP 3: Use another busybox container to write source & stdin ──
        # We pack source file and input.txt into a tarball and copy to /sandbox
        tar_bytes = _build_tar_bytes({
            spec.source_filename: source_code,
            "input.txt": stdin if stdin is not None else "",
        })

        writer = client.containers.create(
            setup_image,
            command=["true"],
            volumes={volume_name: {"bind": "/sandbox", "mode": "rw"}},
            user="root",
        )
        try:
            writer.put_archive("/sandbox", tar_bytes)
        finally:
            writer.remove(force=True)

        vol_map = {volume_name: {"bind": "/sandbox", "mode": "rw"}}

        # ─── STEP 4: Optional compile step ───────────────────────────────────
        if spec.compile_cmd:
            compile_start = time.monotonic()
            compile_container = client.containers.create(
                **_container_kwargs(spec.compile_cmd, extra_volumes=vol_map)
            )
            try:
                compile_container.start()
                try:
                    exit_code = compile_container.wait(timeout=timeout)["StatusCode"]
                except Exception:
                    compile_container.kill()
                    return ExecutionResult(
                        verdict=Verdict.TIME_LIMIT_EXCEEDED,
                        compile_error="Compilation timed out",
                    )
                compile_time = (time.monotonic() - compile_start) * 1000
                logs = compile_container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")
                if exit_code != 0:
                    return ExecutionResult(
                        verdict=Verdict.COMPILE_ERROR,
                        compile_error=logs,
                        stderr=logs,
                        exit_code=exit_code,
                        execution_time_ms=compile_time,
                    )
            finally:
                try:
                    compile_container.remove(force=True)
                except Exception:
                    pass

        # ─── STEP 5: Run the program ──────────────────────────────────────────
        # Feed stdin by redirecting from /sandbox/input.txt (robust across all OSs)
        exec_cmd = ["sh", "-c", 'exec "$@" < /sandbox/input.txt', "_"] + list(spec.run_cmd)

        container = client.containers.create(
            **_container_kwargs(exec_cmd, extra_volumes=vol_map)
        )

        run_start = time.monotonic()
        container.start()

        # Wait for container with timeout
        try:
            result = container.wait(timeout=timeout + 2)
            exit_code = result["StatusCode"]
        except Exception:
            # Timed out
            try:
                container.kill()
            except Exception:
                pass
            elapsed = (time.monotonic() - run_start) * 1000
            return ExecutionResult(
                verdict=Verdict.TIME_LIMIT_EXCEEDED,
                execution_time_ms=elapsed,
                exit_code=-1,
            )

        elapsed_ms = (time.monotonic() - run_start) * 1000

        stdout_raw = container.logs(stdout=True, stderr=False).decode("utf-8", errors="replace")
        stderr_raw = container.logs(stdout=False, stderr=True).decode("utf-8", errors="replace")

        if exit_code != 0:
            return ExecutionResult(
                verdict=Verdict.RUNTIME_ERROR,
                stdout=stdout_raw,
                stderr=stderr_raw,
                exit_code=exit_code,
                execution_time_ms=elapsed_ms,
                runtime_error=stderr_raw or f"Program exited with code {exit_code}",
            )

        return ExecutionResult(
            verdict=Verdict.ACCEPTED,  # caller validates against expected output
            stdout=stdout_raw,
            stderr=stderr_raw,
            exit_code=0,
            execution_time_ms=elapsed_ms,
        )

    finally:
        # ─── STEP 6: Cleanup ─────────────────────────────────────────────────
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:
                pass
        try:
            volume.remove(force=True)
        except Exception:
            pass


async def execute_in_sandbox(
    spec: LanguageSpec,
    source_code: str,
    stdin: str = "",
) -> ExecutionResult:
    """
    Async wrapper around `_run_container_sync`.

    Runs the blocking Docker call in a thread pool executor so it does not
    block the FastAPI event loop.
    """
    loop = asyncio.get_event_loop()
    client = _get_docker_client()
    try:
        result = await loop.run_in_executor(
            None,
            _run_container_sync,
            client,
            spec,
            source_code,
            stdin,
        )
    except ImageNotFound as e:
        logger.error("Docker image not found: %s", e)
        return ExecutionResult(
            verdict=Verdict.INTERNAL_ERROR,
            stderr=f"Docker image not found: {e}",
        )
    except DockerException as e:
        logger.error("Docker error: %s", e)
        return ExecutionResult(
            verdict=Verdict.INTERNAL_ERROR,
            stderr=f"Docker error: {e}",
        )
    finally:
        client.close()
    return result
