# tests/sandbox/test_schemas.py
"""
Unit tests for sandbox Pydantic schemas — no external services required.
"""

import pytest
from app.sandbox.schemas import (
    SandboxRunRequest,
    SandboxRunResponse,
    TestCaseInput,
    TestCaseResult,
    Verdict,
    SandboxJob,
    SandboxJobResult,
)


def test_verdict_values():
    assert Verdict.ACCEPTED == "ACCEPTED"
    assert Verdict.WRONG_ANSWER == "WRONG_ANSWER"
    assert Verdict.COMPILE_ERROR == "COMPILE_ERROR"
    assert Verdict.RUNTIME_ERROR == "RUNTIME_ERROR"
    assert Verdict.TIME_LIMIT_EXCEEDED == "TIME_LIMIT_EXCEEDED"


def test_sandbox_run_request_minimal():
    req = SandboxRunRequest(language="python", source_code='print("hi")')
    assert req.language == "python"
    assert req.stdin == ""
    assert req.test_cases is None


def test_sandbox_run_request_with_test_cases():
    req = SandboxRunRequest(
        language="python",
        source_code="print(input())",
        test_cases=[TestCaseInput(id=1, stdin="hello", expected_output="hello")],
    )
    assert len(req.test_cases) == 1
    assert req.test_cases[0].expected_output == "hello"


def test_sandbox_run_response_has_no_expected_output():
    """Verify expected_output is never part of the response schema."""
    response_fields = SandboxRunResponse.model_fields.keys()
    assert "expected_output" not in response_fields


def test_test_case_result_has_no_expected_output():
    """Verify TestCaseResult schema never exposes expected_output."""
    result_fields = TestCaseResult.model_fields.keys()
    assert "expected_output" not in result_fields


def test_sandbox_job_serialization():
    job = SandboxJob(
        job_id="abc-123",
        language="python",
        source_code='print("hello")',
    )
    json_str = job.model_dump_json()
    assert "abc-123" in json_str
    restored = SandboxJob.model_validate_json(json_str)
    assert restored.job_id == "abc-123"
    assert restored.language == "python"


def test_sandbox_job_result_pending():
    result = SandboxJobResult(job_id="abc-123", status="pending")
    assert result.result is None
    assert result.error is None


def test_sandbox_job_result_done():
    response = SandboxRunResponse(verdict=Verdict.ACCEPTED, stdout="hello\n")
    result = SandboxJobResult(job_id="abc-123", status="done", result=response)
    assert result.result.verdict == Verdict.ACCEPTED
