"""
conftest.py – Shared pytest fixtures for Module 3 test suite.

Fixtures defined here are available to all test files without explicit import.
"""

import json
import sys
import os

import pytest

# Ensure the project root is on sys.path so tests can import project modules
# regardless of how pytest is invoked (from repo root or from tests/ dir).
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ---------------------------------------------------------------------------
# Shared data builders
# ---------------------------------------------------------------------------

def make_program_file(filename="app.py", language="python", content="print('hello')"):
    """Return a minimal ProgramFile dict."""
    return {"filename": filename, "language": language, "content": content}


def make_review_request(
    work_description="Build a simple Flask REST API.",
    files=None,
):
    """Return a minimal ReviewRequest dict."""
    if files is None:
        files = [make_program_file()]
    return {"work_description": work_description, "program_files": files}


# ---------------------------------------------------------------------------
# Valid AI response fixture
# ---------------------------------------------------------------------------

VALID_AI_RESPONSE = json.dumps({
    "intern_review": {
        "score": 72,
        "feedback": (
            "You have made a solid start. The Flask app is set up correctly "
            "and the route structure is clean. The main thing missing is "
            "error handling — the endpoints have no input validation."
        ),
        "speech_text": (
            "You have made a solid start. The Flask app is set up correctly "
            "and the route structure is clean. The main thing missing is "
            "error handling. The endpoints have no input validation."
        ),
        "audio_supported": True,
        "strengths": ["Clean route structure", "Flask app correctly initialised"],
        "bugs": ["No input validation on any endpoint"],
        "missing": ["Input validation", "Unit tests"],
        "suggestions": [
            "Add request body validation using Pydantic or marshmallow",
            "Write at least two unit tests for the main routes",
        ],
    },
    "manager_summary": {
        "overall_score": 72,
        "summary": "The intern has built a functional Flask skeleton but lacks validation and tests.",
        "risk_level": "medium",
        "recommendation": "Ask the intern to add input validation and basic unit tests before the next review.",
    },
})


@pytest.fixture()
def valid_ai_response() -> str:
    """Raw JSON string that matches the current ReviewResponse schema."""
    return VALID_AI_RESPONSE


@pytest.fixture()
def valid_ai_response_dict() -> dict:
    """Parsed dict of the valid AI response."""
    return json.loads(VALID_AI_RESPONSE)
