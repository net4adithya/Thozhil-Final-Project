"""
parser.py – AI response parser for Module 3: AI Reviewer Engine.

Sole responsibility: convert the raw AI text response into a validated
ReviewResponse Pydantic model.

No AI calls, no prompt building, no routing logic, and no HTTP concerns
belong here. Invalid AI responses are never returned to the caller.

Design principles:
  - Uses json.JSONDecoder.raw_decode() to locate the first valid JSON object
    in the response, which is safe even when the JSON contains nested objects
    (unlike a greedy `.*` regex which can mis-match on nested braces).
  - Strips markdown code fences before attempting to decode.
  - Raises ParseError (a domain exception) instead of HTTPException so that
    this module does not depend on FastAPI. routes.py converts ParseError to
    HTTP 500.
  - Logs enough context to diagnose LLM formatting regressions.
"""

import json
import logging
import re

from pydantic import ValidationError

from models import ReviewResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Domain Exception
# ---------------------------------------------------------------------------

class ParseError(Exception):
    """Raised when the AI response cannot be parsed or fails schema validation.

    routes.py catches this and converts it to HTTP 500.
    """

# Matches opening markdown code fences: ```json or ``` on their own line.
_FENCE_RE = re.compile(r"```(?:json)?\s*", re.IGNORECASE)


def _strip_fences(text: str) -> str:
    """Remove markdown code fences so the JSON decoder doesn't choke on them."""
    return _FENCE_RE.sub("", text).replace("```", "")


def _extract_json(text: str) -> dict:
    """Find and decode the first complete JSON object in *text*.

    Uses JSONDecoder.raw_decode() which correctly handles nested braces and
    returns the position after the object, making it safe for responses that
    contain leading/trailing prose.

    Raises:
        ValueError: If no valid JSON object is found.
    """
    decoder = json.JSONDecoder()
    # Scan forward until we find the opening '{'.
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in AI response.")

    try:
        obj, _ = decoder.raw_decode(text, start)
        return obj
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON decode failed: {exc}") from exc


def parse_ai_response(raw_text: str) -> ReviewResponse:
    """Parse and validate *raw_text* from the AI into a ReviewResponse.

    The function is tolerant of the AI wrapping the JSON in markdown fences or
    adding surrounding prose; it extracts the first complete JSON object found.

    Args:
        raw_text: The raw string returned by the AI provider.

    Returns:
        A fully-validated ReviewResponse instance.

    Raises:
        ParseError: If the text cannot be parsed or fails schema validation.
            routes.py catches this and converts it to HTTP 500.
    """
    cleaned = _strip_fences(raw_text)

    try:
        data = _extract_json(cleaned)
    except ValueError as exc:
        logger.error(
            "Failed to extract JSON from AI response: %s | Response snippet: %.300s",
            exc,
            raw_text,
        )
        raise ParseError("Unable to extract JSON from AI response.") from exc

    try:
        review = ReviewResponse(**data)
    except (ValidationError, TypeError) as exc:
        logger.error(
            "Response validation failed: %s | Parsed data keys: %s",
            exc,
            list(data.keys()) if isinstance(data, dict) else "N/A",
        )
        raise ParseError("AI response failed schema validation.") from exc

    return review
