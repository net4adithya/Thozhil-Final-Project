# python_backend/app/sandbox/router.py
"""
FastAPI router for the Docker sandbox execution API.

Endpoint: POST /api/v1/sandbox/execution/run

Two execution modes:
  1. Synchronous (default) — code is executed immediately in the request,
     good for quick interactive runs from the Monaco editor.
  2. Queued — job is enqueued in Redis and a job_id is returned for polling.
     Enabled by ?mode=queue query parameter.

The queued path is served by the standalone sandbox worker.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from .config import sandbox_settings
from .harness import run_single, run_with_test_cases
from .languages import resolve_language, supported_language_names
from .queue import enqueue_job, get_result, new_job_id
from .schemas import (
    SandboxJob,
    SandboxJobResult,
    SandboxRunRequest,
    SandboxRunResponse,
    Verdict,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/execution/run",
    response_model=SandboxRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Run code in Docker sandbox",
    description=(
        "Execute source code inside an isolated Docker container. "
        "All security constraints are enforced server-side: "
        "no network access, non-root user, capability drop, "
        "CPU/memory limits, and execution timeout. "
        "Expected test-case outputs are NEVER returned in the response."
    ),
)
async def run_sandbox(
    payload: SandboxRunRequest,
    mode: str = Query(default="sync", description="'sync' (immediate) or 'queue' (via Redis worker)"),
) -> SandboxRunResponse:
    """Submit code for execution in the Docker sandbox."""

    # ─── Language validation ───────────────────────────────────────────────
    spec = resolve_language(payload.language)
    if spec is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported language: {payload.language!r}. "
                f"Supported: {supported_language_names()}"
            ),
        )

    if mode == "queue":
        # ─── Queued mode — enqueue and return job_id ───────────────────────
        job = SandboxJob(
            job_id=new_job_id(),
            language=spec.name,
            source_code=payload.source_code,
            stdin=payload.stdin,
            test_cases=payload.test_cases,
        )
        try:
            enqueue_job(job)
        except Exception as exc:
            logger.error("Failed to enqueue job: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Execution queue unavailable. Try mode=sync.",
            )
        # Return a pending response with a hint for polling
        return SandboxRunResponse(
            verdict=Verdict.INTERNAL_ERROR,
            stderr=f"Job enqueued. Poll /api/v1/sandbox/jobs/{job.job_id} for result.",
        )

    # ─── Synchronous mode — execute directly in request ───────────────────
    try:
        if payload.test_cases:
            result = await run_with_test_cases(spec, payload.source_code, payload.test_cases)
        else:
            result = await run_single(spec, payload.source_code, payload.stdin)
    except Exception as exc:
        logger.exception("Sandbox execution error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sandbox execution failed: {exc}",
        )

    return result


@router.get(
    "/jobs/{job_id}",
    response_model=SandboxJobResult,
    summary="Poll queued execution result",
)
async def get_job_result(job_id: str) -> SandboxJobResult:
    """Retrieve the status/result of a queued sandbox job."""
    try:
        result = get_result(job_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Result store unavailable: {exc}",
        )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id!r} not found.",
        )
    return result


@router.get(
    "/languages",
    summary="List supported languages",
)
async def list_languages():
    """Return the list of supported execution languages."""
    return {"languages": supported_language_names()}
