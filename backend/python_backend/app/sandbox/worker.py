# python_backend/app/sandbox/worker.py
"""
Sandbox worker process.

Run standalone with:
    python -m app.sandbox.worker

Or via Docker Compose service `sandbox-worker`.

The worker:
  1. Connects to Redis and blocks on the job queue.
  2. Dequeues a SandboxJob.
  3. Resolves the language spec (rejects unknown languages).
  4. Delegates to the harness (single run or test-case run).
  5. Stores the result (or error) back in Redis.
  6. Repeats indefinitely.
"""

from __future__ import annotations

import asyncio
import logging
import signal
import sys
import time

# Ensure project root is on the path when run via `python -m app.sandbox.worker`
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", ".."))

from app.sandbox.config import sandbox_settings
from app.sandbox.harness import run_single, run_with_test_cases
from app.sandbox.languages import resolve_language
from app.sandbox.queue import dequeue_job, store_error, store_result
from app.sandbox.schemas import SandboxRunResponse, Verdict

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sandbox.worker")

_running = True


def _handle_signal(signum, frame):
    global _running
    logger.info("Received signal %s, shutting down gracefully...", signum)
    _running = False


signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)


async def _process_job(job) -> None:
    logger.info("Processing job %s (language=%s)", job.job_id, job.language)

    spec = resolve_language(job.language)
    if spec is None:
        store_error(job.job_id, f"Unsupported language: {job.language!r}")
        return

    try:
        if job.test_cases:
            result = await run_with_test_cases(spec, job.source_code, job.test_cases)
        else:
            result = await run_single(spec, job.source_code, job.stdin)
        store_result(job.job_id, result)
    except Exception as exc:
        logger.exception("Error processing job %s", job.job_id)
        store_error(job.job_id, str(exc))


async def run_worker():
    logger.info(
        "Sandbox worker started. Queue=%s Redis=%s",
        sandbox_settings.SANDBOX_QUEUE_NAME,
        sandbox_settings.REDIS_URL,
    )
    while _running:
        try:
            job = dequeue_job(timeout=5)
            if job is None:
                continue  # timeout, loop again
            await _process_job(job)
        except Exception as exc:
            logger.exception("Worker loop error: %s", exc)
            time.sleep(1)  # brief back-off on unexpected errors

    logger.info("Sandbox worker stopped.")


if __name__ == "__main__":
    asyncio.run(run_worker())
