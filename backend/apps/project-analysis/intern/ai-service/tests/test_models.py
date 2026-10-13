"""
test_models.py – Unit tests for models.py Pydantic validators.

Tests cover:
  - ProgramFile field validation
  - ReviewRequest field validation
  - InternReview score bounds and new TTS fields
  - ManagerSummary risk_level enum enforcement
  - ReviewResponse composition
"""

import pytest
from pydantic import ValidationError

from models import (
    InternReview,
    ManagerSummary,
    ProgramFile,
    ReviewRequest,
    ReviewResponse,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_intern_review(**kwargs):
    defaults = dict(
        score=75,
        feedback="Solid start.",
        speech_text="Solid start.",
        strengths=["Good structure"],
        bugs=[],
        missing=["Tests"],
        suggestions=["Add tests"],
    )
    defaults.update(kwargs)
    return InternReview(**defaults)


def _make_manager_summary(**kwargs):
    defaults = dict(
        overall_score=75,
        summary="The intern is making progress.",
        risk_level="medium",
        recommendation="Continue current approach.",
    )
    defaults.update(kwargs)
    return ManagerSummary(**defaults)


# ---------------------------------------------------------------------------
# ProgramFile
# ---------------------------------------------------------------------------

class TestProgramFile:

    def test_valid_file(self):
        f = ProgramFile(filename="app.py", language="python", content="print(1)")
        assert f.filename == "app.py"
        assert f.language == "python"
        assert f.content == "print(1)"

    def test_empty_content_normalised_to_empty_string(self):
        """Whitespace-only content is coerced to '' so AI can flag empty files."""
        f = ProgramFile(filename="stub.py", language="python", content="   \n\t  ")
        assert f.content == ""

    def test_genuinely_empty_content_allowed(self):
        f = ProgramFile(filename="empty.py", language="python", content="")
        assert f.content == ""

    def test_non_empty_content_preserved(self):
        code = "def foo():\n    return 1"
        f = ProgramFile(filename="fn.py", language="python", content=code)
        assert f.content == code

    def test_missing_filename_raises(self):
        with pytest.raises(ValidationError):
            ProgramFile(language="python", content="x = 1")

    def test_empty_filename_raises(self):
        with pytest.raises(ValidationError):
            ProgramFile(filename="", language="python", content="x = 1")

    def test_missing_language_raises(self):
        with pytest.raises(ValidationError):
            ProgramFile(filename="app.py", content="x = 1")

    def test_empty_language_raises(self):
        with pytest.raises(ValidationError):
            ProgramFile(filename="app.py", language="", content="x = 1")


# ---------------------------------------------------------------------------
# ReviewRequest
# ---------------------------------------------------------------------------

class TestReviewRequest:

    def test_valid_request(self):
        req = ReviewRequest(
            work_description="Build a login API.",
            program_files=[
                ProgramFile(filename="app.py", language="python", content="x=1")
            ],
        )
        assert req.work_description == "Build a login API."
        assert len(req.program_files) == 1

    def test_blank_work_description_raises(self):
        with pytest.raises(ValidationError, match="cannot be empty"):
            ReviewRequest(
                work_description="   ",
                program_files=[ProgramFile(filename="a.py", language="python", content="x")],
            )

    def test_empty_work_description_raises(self):
        with pytest.raises(ValidationError):
            ReviewRequest(
                work_description="",
                program_files=[ProgramFile(filename="a.py", language="python", content="x")],
            )

    def test_work_description_max_length_boundary(self):
        """10,000 characters is the exact boundary — should succeed."""
        ReviewRequest(
            work_description="A" * 10_000,
            program_files=[ProgramFile(filename="a.py", language="python", content="x")],
        )

    def test_work_description_over_max_length_raises(self):
        """10,001 characters should be rejected."""
        with pytest.raises(ValidationError):
            ReviewRequest(
                work_description="A" * 10_001,
                program_files=[ProgramFile(filename="a.py", language="python", content="x")],
            )

    def test_no_files_raises(self):
        with pytest.raises(ValidationError):
            ReviewRequest(work_description="Build an API.", program_files=[])

    def test_too_many_files_raises(self):
        files = [
            ProgramFile(filename=f"f{i}.py", language="python", content="x")
            for i in range(11)
        ]
        with pytest.raises(ValidationError):
            ReviewRequest(work_description="Build an API.", program_files=files)

    def test_exactly_ten_files_accepted(self):
        files = [
            ProgramFile(filename=f"f{i}.py", language="python", content="x")
            for i in range(10)
        ]
        req = ReviewRequest(work_description="Build an API.", program_files=files)
        assert len(req.program_files) == 10


# ---------------------------------------------------------------------------
# InternReview
# ---------------------------------------------------------------------------

class TestInternReview:

    def test_valid_review(self):
        r = _make_intern_review()
        assert r.score == 75
        assert r.audio_supported is True  # default

    def test_score_lower_boundary(self):
        r = _make_intern_review(score=0)
        assert r.score == 0

    def test_score_upper_boundary(self):
        r = _make_intern_review(score=100)
        assert r.score == 100

    def test_score_below_zero_raises(self):
        with pytest.raises(ValidationError):
            _make_intern_review(score=-1)

    def test_score_above_100_raises(self):
        with pytest.raises(ValidationError):
            _make_intern_review(score=101)

    def test_speech_text_field_present(self):
        r = _make_intern_review(speech_text="Spoken version.")
        assert r.speech_text == "Spoken version."

    def test_audio_supported_default_true(self):
        r = _make_intern_review()
        assert r.audio_supported is True

    def test_audio_supported_can_be_false(self):
        r = _make_intern_review(audio_supported=False)
        assert r.audio_supported is False

    def test_bugs_empty_list_valid(self):
        r = _make_intern_review(bugs=[])
        assert r.bugs == []

    def test_bugs_populated(self):
        r = _make_intern_review(bugs=["Plain-text passwords", "SQL injection risk"])
        assert len(r.bugs) == 2

    def test_strengths_empty_list_valid(self):
        r = _make_intern_review(strengths=[])
        assert r.strengths == []

    def test_missing_empty_list_valid(self):
        r = _make_intern_review(missing=[])
        assert r.missing == []


# ---------------------------------------------------------------------------
# ManagerSummary
# ---------------------------------------------------------------------------

class TestManagerSummary:

    @pytest.mark.parametrize("level", ["low", "medium", "high", "critical"])
    def test_valid_risk_levels(self, level):
        s = _make_manager_summary(risk_level=level)
        assert s.risk_level == level

    def test_invalid_risk_level_raises(self):
        with pytest.raises(ValidationError):
            _make_manager_summary(risk_level="unknown")

    def test_risk_level_case_sensitive(self):
        """risk_level is a Literal — 'LOW' should not be accepted."""
        with pytest.raises(ValidationError):
            _make_manager_summary(risk_level="LOW")

    def test_score_bounds(self):
        with pytest.raises(ValidationError):
            _make_manager_summary(overall_score=101)
        with pytest.raises(ValidationError):
            _make_manager_summary(overall_score=-1)


# ---------------------------------------------------------------------------
# ReviewResponse
# ---------------------------------------------------------------------------

class TestReviewResponse:

    def test_valid_response(self):
        r = ReviewResponse(
            intern_review=_make_intern_review(),
            manager_summary=_make_manager_summary(),
        )
        assert r.intern_review.score == 75
        assert r.manager_summary.risk_level == "medium"
