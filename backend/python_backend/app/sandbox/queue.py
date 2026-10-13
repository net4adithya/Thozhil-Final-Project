# python_backend/app/sandbox/queue.py
"""
Redis-backed job queue for sandbox execution.

Job lifecycle:
  1. API enqueues a SandboxJob into a Redis list (LPUSH).
  2. Worker blocks on BRPOP to consume the next job.
  3. Worker stores the SandboxJobResult back under key  sandbox:result:<job_id>.
  4. API (or frontend polling) reads the result with GET on that key.

The result TTL (SANDBOX_RESULT_TTL) ensures old results do not accumulate.
"""

from __future__ import annotations

import json
import logging
import uuid
from typing import Optional

import redis as redis_lib

from .config import sandbox_settings
from .schemas import SandboxJob, SandboxJobResult, SandboxRunResponse

logger = logging.getLogger(__name__)

_JOB_KEY_PREFIX = "sandbox:job:"
_RESULT_KEY_PREFIX = "sandbox:result:"


def _redis_client() -> redis_lib.Redis:
    return redis_lib.from_url(
        sandbox_settings.REDIS_URL,
        decode_responses=True,
    )


# ─── Enqueue ─────────────────────────────────────────────────────────────────

def enqueue_job(job: SandboxJob) -> str:
    """Push a job onto the Redis queue. Returns the job_id."""
    r = _redis_client()
    payload = job.model_dump_json()
    r.lpush(sandbox_settings.SANDBOX_QUEUE_NAME, payload)
    # Store initial "pending" status so callers can poll immediately
    _store_result(
        r,
        job.job_id,
        SandboxJobResult(job_id=job.job_id, status="pending"),
    )
    logger.info("Enqueued job %s (language=%s)", job.job_id, job.language)
    return job.job_id


def dequeue_job(timeout: int = 30) -> Optional[SandboxJob]:
    """Block-pop the next job from the queue. Returns None on timeout."""
    r = _redis_client()
    result = r.brpop(sandbox_settings.SANDBOX_QUEUE_NAME, timeout=timeout)
    if result is None:
        return None
    _, payload = result
    return SandboxJob.model_validate_json(payload)


# ─── Result storage ───────────────────────────────────────────────────────────

def _store_result(r: redis_lib.Redis, job_id: str, job_result: SandboxJobResult) -> None:
    key = f"{_RESULT_KEY_PREFIX}{job_id}"
    r.set(key, job_result.model_dump_json(), ex=sandbox_settings.SANDBOX_RESULT_TTL)


def store_result(job_id: str, result: SandboxRunResponse) -> None:
    """Store a completed execution result."""
    r = _redis_client()
    job_result = SandboxJobResult(job_id=job_id, status="done", result=result)
    _store_result(r, job_id, job_result)
    logger.info("Stored result for job %s (verdict=%s)", job_id, result.verdict)


def store_error(job_id: str, error: str) -> None:
    """Store an error result for a failed job."""
    r = _redis_client()
    job_result = SandboxJobResult(job_id=job_id, status="error", error=error)
    _store_result(r, job_id, job_result)
    logger.error("Stored error for job %s: %s", job_id, error)


def get_result(job_id: str) -> Optional[SandboxJobResult]:
    """Retrieve a job result. Returns None if not found."""
    r = _redis_client()
    key = f"{_RESULT_KEY_PREFIX}{job_id}"
    raw = r.get(key)
    if raw is None:
        return None
    return SandboxJobResult.model_validate_json(raw)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def new_job_id() -> str:
    return str(uuid.uuid4())
