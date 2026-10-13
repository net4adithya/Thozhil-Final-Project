# python_backend/app/execution/schemas.py
"""Pydantic schemas for the code execution engine."""

from pydantic import BaseModel
from typing import List, Optional

class TestCaseInput(BaseModel):
    id: int
    input: str
    expected_output: str

class ExecutionRequest(BaseModel):
    submission_id: int
    language: str
    code: str
    test_cases: Optional[List[TestCaseInput]] = None

class TestCaseResultResponse(BaseModel):
    test_case_id: int
    passed: bool
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None
    time: Optional[float] = None
    memory: Optional[int] = None

class ExecutionResponse(BaseModel):
    execution_id: int
    submission_id: int
    language: str
    status: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    exit_code: Optional[int] = None
    time: Optional[float] = None
    memory: Optional[int] = None
    test_case_results: Optional[List[TestCaseResultResponse]] = None
