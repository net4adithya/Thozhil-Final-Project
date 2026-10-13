# tests/sandbox/test_queue.py
"""
Unit/integration tests for the Redis queue.
Redis-dependent tests are skipped when Redis is unavailable.
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "python_backend"))

from conftest import skip_no_redis
from app.sandbox.schemas import SandboxJob, SandboxRunResponse, Verdict


@skip_no_redis
def test_enqueue_and_get_pending_result():
    from app.sandbox.queue import enqueue_job, get_result, new_job_id
    job_id = new_job_id()
    job = SandboxJob(job_id=job_id, language="python", source_code='print("q")')
    enqueue_job(job)
    result = get_result(job_id)
    assert result is not None
    assert result.status == "pending"
    assert result.job_id == job_id


@skip_no_redis
def test_store_and_retrieve_done_result():
    from app.sandbox.queue import store_result, get_result, new_job_id
    job_id = new_job_id()
    response = SandboxRunResponse(verdict=Verdict.ACCEPTED, stdout="hello\n")
    store_result(job_id, response)
    retrieved = get_result(job_id)
    assert retrieved is not None
    assert retrieved.status == "done"
    assert retrieved.result.verdict == Verdict.ACCEPTED
    assert retrieved.result.stdout == "hello\n"


@skip_no_redis
def test_store_and_retrieve_error():
    from app.sandbox.queue import store_error, get_result, new_job_id
    job_id = new_job_id()
    store_error(job_id, "Something went wrong")
    retrieved = get_result(job_id)
    assert retrieved is not None
    assert retrieved.status == "error"
    assert "Something went wrong" in retrieved.error


@skip_no_redis
def test_get_nonexistent_result():
    from app.sandbox.queue import get_result
    result = get_result("does-not-exist-xyz-999")
    assert result is None


@skip_no_redis
def test_enqueue_dequeue_roundtrip():
    from app.sandbox.queue import enqueue_job, dequeue_job, new_job_id
    import uuid
    # Use a unique queue name to avoid interference with other tests
    from app.sandbox import queue as q_module
    original_queue = q_module.sandbox_settings.SANDBOX_QUEUE_NAME
    test_queue = f"test:jobs:{uuid.uuid4().hex}"

    # Temporarily override queue name
    q_module.sandbox_settings.SANDBOX_QUEUE_NAME = test_queue
    try:
        job_id = new_job_id()
        job = SandboxJob(job_id=job_id, language="python", source_code="pass")
        enqueue_job(job)
        dequeued = dequeue_job(timeout=3)
        assert dequeued is not None
        assert dequeued.job_id == job_id
        assert dequeued.language == "python"
    finally:
        q_module.sandbox_settings.SANDBOX_QUEUE_NAME = original_queue
