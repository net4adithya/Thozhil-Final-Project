"""
models.py – Pydantic request and response models for Module 3: AI Reviewer Engine.

Defines the exact shapes of the API contract.
All validation is performed here; no schema changes are permitted without a
corresponding update to docs/api_contract.md.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class ProgramFile(BaseModel):
    """A single source file submitted by the intern."""

    filename: str = Field(
        ...,
        description="The original filename including extension (e.g. 'auth.py', 'README.md').",
        min_length=1,
    )
    language: str = Field(
        ...,
        description="Programming language or file type (e.g. 'python', 'javascript', 'markdown').",
        min_length=1,
    )
    content: str = Field(
        ...,
        description="Full text content of the file.",
    )

    @field_validator("content")
    @classmethod
    def normalise_content(cls, value: str) -> str:
        """Coerce whitespace-only content to empty string.

        Empty files (e.g. stubs, blank .gitignore) are allowed — the AI will
        flag them in the review. Rejecting them here would produce unnecessary
        422 errors for Module 4.
        """
        return value if value.strip() else ""


# ---------------------------------------------------------------------------
# Request Model
# ---------------------------------------------------------------------------

class ReviewRequest(BaseModel):
    """Incoming review request from Module 4."""

    work_description: str = Field(
        ...,
        description="The official task assigned by the manager.",
        max_length=10_000,   # ~2,500 tokens — generous for any real work description;
                             # prevents context-window exhaustion via oversized input.
    )
    program_files: list[ProgramFile] = Field(
        ...,
        description="The intern's submitted source files (1–10 files).",
        min_length=1,
        max_length=10,
    )

    @field_validator("work_description")
    @classmethod
    def work_description_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Work description cannot be empty or whitespace.")
        return value


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------

class InternReview(BaseModel):
    """Detailed review directed at the intern.

    Contains two versions of the review text:
      - feedback:     Screen-optimized prose. May include technical terms,
                      file references, and code-style names.
      - speech_text:  Audio-optimized prose. Same meaning as feedback but
                      adapted for TTS: abbreviations spelled out, backtick
                      references rewritten as spoken phrases, shorter sentences.

    Module 2 (frontend) displays `feedback` on screen and passes `speech_text`
    to the Browser Speech API (or a cloud TTS provider if configured).
    """

    score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Evaluation score (0–100) measuring alignment with the work description.",
    )
    feedback: str = Field(
        ...,
        description=(
            "Conversational narrative covering completed work, issues, code quality, "
            "and next steps. Written in spoken prose — suitable for screen display "
            "and text-to-speech. May contain technical terms and file references."
        ),
    )
    speech_text: str = Field(
        ...,
        description=(
            "TTS-optimized version of feedback. Same content and tone as feedback, "
            "but adapted for audio playback: abbreviations spelled out "
            "(e.g. 'JWT' → 'JSON Web Token', 'API' → 'A P I'), backtick file "
            "references rewritten as spoken phrases (e.g. '`auth.py`' → "
            "'the auth dot py file'), and long sentences broken into shorter ones "
            "for natural TTS flow. No markdown. No bullet points."
        ),
    )
    audio_supported: bool = Field(
        default=True,
        description=(
            "True when speech_text is available and the frontend can activate "
            "audio playback (Browser Speech API or cloud TTS). Always True in "
            "the current browser-mode implementation."
        ),
    )
    strengths: list[str] = Field(
        ...,
        description="Positive aspects identified in the submission.",
    )
    bugs: list[str] = Field(
        ...,
        description=(
            "Concrete bugs, security issues, or anti-patterns found in the code. "
            "Each item should be a specific, actionable observation (e.g. "
            "'Passwords stored as plain text in users dict — use bcrypt'). "
            "Empty list if no bugs are found."
        ),
    )
    missing: list[str] = Field(
        ...,
        description="Features required by the work description that were not found.",
    )
    suggestions: list[str] = Field(
        ...,
        description="Actionable recommendations for improving the submission.",
    )


class ManagerSummary(BaseModel):
    """Concise summary intended for managerial review."""

    overall_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Simplified score for quick managerial review (0–100).",
    )
    summary: str = Field(
        ...,
        description="Short paragraph summarising the intern's progress.",
    )
    risk_level: Literal["low", "medium", "high", "critical"] = Field(
        ...,
        description=(
            "Risk assessment of the current submission state: "
            "low = on track, medium = minor gaps, high = significant gaps, "
            "critical = fundamental issues or nothing submitted."
        ),
    )
    recommendation: str = Field(
        ...,
        description="One-sentence managerial action recommendation.",
    )


class ReviewResponse(BaseModel):
    """Top-level API response returned to Module 4."""

    intern_review: InternReview
    manager_summary: ManagerSummary
