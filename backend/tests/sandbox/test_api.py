# tests/sandbox/test_api.py
"""
API-level tests for the sandbox router.
Uses FastAPI TestClient (sync) and httpx AsyncClient (async).
No Redis or Docker needed for basic validation tests.
Docker-dependent tests are marked with @skip_no_docker.
"""

import sys
import os
import pytest
import asyncio

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "python_backend"))

from fastapi.testclient import TestClient
from conftest import skip_no_docker

# Build a minimal FastAPI app with only the sandbox router
from fastapi import FastAPI
from app.sandbox.router import router as sandbox_router

app = FastAPI()
app.include_router(sandbox_router, prefix="/api/v1/sandbox")

client = TestClient(app)


# ─── Language listing ─────────────────────────────────────────────────────────

def test_list_languages():
    resp = client.get("/api/v1/sandbox/languages")
    assert resp.status_code == 200
    data = resp.json()
    assert "languages" in data
    assert "python" in data["languages"]
    assert "javascript" in data["languages"]
    assert "cpp" in data["languages"]
    assert "java" in data["languages"]


# ─── Input validation ─────────────────────────────────────────────────────────

def test_run_unsupported_language():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "brainfuck", "source_code": "+-><"},
    )
    assert resp.status_code == 400
    assert "Unsupported language" in resp.json()["detail"]


def test_run_missing_source_code():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "python"},
    )
    assert resp.status_code == 422  # Pydantic validation error


def test_run_missing_language():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"source_code": 'print("hi")'},
    )
    assert resp.status_code == 422


# ─── Poll missing job ─────────────────────────────────────────────────────────

def test_get_unknown_job():
    resp = client.get("/api/v1/sandbox/jobs/nonexistent-job-id")
    # Either 404 (job not found) or 503 (Redis unavailable) — both are valid
    assert resp.status_code in (404, 503)


# ─── Docker execution tests ───────────────────────────────────────────────────

@skip_no_docker
def test_python_execution_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "python", "source_code": 'print("API OK")'},
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert "API OK" in data["stdout"]


@skip_no_docker
def test_javascript_execution_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "javascript", "source_code": 'console.log("JS OK")'},
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert "JS OK" in data["stdout"]


@skip_no_docker
def test_cpp_execution_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "cpp",
            "source_code": '#include<iostream>\nusing namespace std;\nint main(){cout<<"CPP OK"<<endl;return 0;}',
        },
        timeout=120,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert "CPP OK" in data["stdout"]


@skip_no_docker
def test_java_execution_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "java",
            "source_code": 'public class Solution{public static void main(String[] a){System.out.println("JAVA OK");}}',
        },
        timeout=120,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert "JAVA OK" in data["stdout"]


@skip_no_docker
def test_compile_error_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "cpp", "source_code": "this is not cpp {"},
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "COMPILE_ERROR"
    assert data["compile_error"]


@skip_no_docker
def test_runtime_error_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "python", "source_code": "raise RuntimeError('fail')"},
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "RUNTIME_ERROR"


@skip_no_docker
def test_tle_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={"language": "python", "source_code": "while True: pass"},
        timeout=30,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "TIME_LIMIT_EXCEEDED"


@skip_no_docker
def test_test_cases_accepted_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "python",
            "source_code": "print(int(input()) * 2)",
            "test_cases": [
                {"id": 1, "stdin": "3", "expected_output": "6"},
                {"id": 2, "stdin": "10", "expected_output": "20"},
            ],
        },
        timeout=120,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert len(data["test_case_results"]) == 2
    for tc in data["test_case_results"]:
        assert tc["verdict"] == "ACCEPTED"
        # expected_output must NOT be in the response
        assert "expected_output" not in tc


@skip_no_docker
def test_test_cases_wrong_answer_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "python",
            "source_code": "print(42)",  # wrong output for all inputs
            "test_cases": [
                {"id": 1, "stdin": "1", "expected_output": "2"},
            ],
        },
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "WRONG_ANSWER"


@skip_no_docker
def test_expected_output_not_in_response():
    """Security: expected_output must never appear in any API response."""
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "python",
            "source_code": "print('wrong')",
            "test_cases": [
                {"id": 1, "stdin": "", "expected_output": "SECRET_EXPECTED_OUTPUT"},
            ],
        },
        timeout=60,
    )
    assert resp.status_code == 200
    # The secret expected output must not appear anywhere in the JSON response
    assert "SECRET_EXPECTED_OUTPUT" not in resp.text


@skip_no_docker
def test_stdin_works_via_api():
    resp = client.post(
        "/api/v1/sandbox/execution/run",
        json={
            "language": "python",
            "source_code": "x = input(); print(x[::-1])",
            "stdin": "hello",
        },
        timeout=60,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ACCEPTED"
    assert "olleh" in data["stdout"]
