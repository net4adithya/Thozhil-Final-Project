# python_backend/app/sandbox/schemas.py
"""
Pydantic schemas for the sandbox execution API.

Kept separate from the legacy execution/schemas.py so existing editor
and submission schemas are not affected.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Verdict(str, Enum):
    ACCEPTED = "ACCEPTED"
    WRONG_ANSWER = "WRONG_ANSWER"
    COMPILE_ERROR = "COMPILE_ERROR"
    RUNTIME_ERROR = "RUNTIME_ERROR"
    TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


# ─── Request ────────────────────────────────────────────────────────────────

class TestCaseInput(BaseModel):
    id: int = Field(..., description="Test case identifier")
    stdin: str = Field(default="", description="Standard input to feed to the program")
    expected_output: str = Field(default="", description="Expected stdout (hidden from response)")


class SandboxRunRequest(BaseModel):
    language: str = Field(..., description="Language: python | javascript | cpp | java")
    source_code: str = Field(..., description="Source code to execute")
    stdin: str = Field(default="", description="Stdin for single-shot execution")
    test_cases: Optional[List[TestCaseInput]] = Field(
        default=None,
        description="Optional list of test cases. If provided, verdict is computed."
    )


# ─── Response ───────────────────────────────────────────────────────────────

class TestCaseResult(BaseModel):
    id: int
    verdict: Verdict
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    execution_time_ms: Optional[float] = None
    exit_code: Optional[int] = None
    # NOTE: expected_output is NOT included in the response to prevent leaking
    # hidden test-case answers to the frontend.


class SandboxRunResponse(BaseModel):
    verdict: Verdict
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_error: Optional[str] = None
    runtime_error: Optional[str] = None
    execution_time_ms: Optional[float] = None
    memory_kb: Optional[int] = None
    exit_code: Optional[int] = None
    test_case_results: Optional[List[TestCaseResult]] = None


# ─── Queue job schemas ───────────────────────────────────────────────────────

class SandboxJob(BaseModel):
    job_id: str
    language: str
    source_code: str
    stdin: str = ""
    test_cases: Optional[List[TestCaseInput]] = None


class SandboxJobResult(BaseModel):
    job_id: str
    status: str  # "pending" | "running" | "done" | "error"
    result: Optional[SandboxRunResponse] = None
    error: Optional[str] = None
