"""
test_parser.py – Unit tests for parser.py.

Tests cover:
  - _strip_fences: removes markdown code fences
  - _extract_json: locates first JSON object in mixed text
  - parse_ai_response: full pipeline including schema validation
  - Negative: invalid JSON, missing fields, wrong types, empty responses
  - Security: truncated JSON, JSON with leading prose
"""

import json

import pytest

from parser import ParseError, _extract_json, _strip_fences, parse_ai_response


# ---------------------------------------------------------------------------
# Minimal valid response builder
# ---------------------------------------------------------------------------

def _make_valid_json(**kwargs) -> str:
    """Return a complete valid JSON string matching ReviewResponse schema."""
    data = {
        "intern_review": {
            "score": 72,
            "feedback": "Good work overall.",
            "speech_text": "Good work overall.",
            "audio_supported": True,
            "strengths": ["Clean code"],
            "bugs": [],
            "missing": ["Tests"],
            "suggestions": ["Add tests"],
        },
        "manager_summary": {
            "overall_score": 72,
            "summary": "Intern is making solid progress.",
            "risk_level": "medium",
            "recommendation": "Continue current direction.",
        },
    }
    # Allow callers to override individual fields at the intern_review level.
    data["intern_review"].update(kwargs)
    return json.dumps(data)


# ---------------------------------------------------------------------------
# _strip_fences
# ---------------------------------------------------------------------------

class TestStripFences:

    def test_no_fences_unchanged(self):
        text = '{"key": "value"}'
        assert _strip_fences(text) == text

    def test_strips_json_code_fence(self):
        text = "```json\n{}\n```"
        result = _strip_fences(text)
        assert "```" not in result
        assert "{}" in result

    def test_strips_plain_code_fence(self):
        text = "```\n{}\n```"
        result = _strip_fences(text)
        assert "```" not in result

    def test_strips_uppercase_json_fence(self):
        text = "```JSON\n{}\n```"
        result = _strip_fences(text)
        assert "```" not in result

    def test_strips_trailing_fence(self):
        text = '{"a": 1}```'
        result = _strip_fences(text)
        assert "```" not in result


# ---------------------------------------------------------------------------
# _extract_json
# ---------------------------------------------------------------------------

class TestExtractJson:

    def test_clean_json_object(self):
        text = '{"key": "value"}'
        result = _extract_json(text)
        assert result == {"key": "value"}

    def test_json_with_leading_prose(self):
        text = 'Here is the review:\n{"key": "value"}'
        result = _extract_json(text)
        assert result == {"key": "value"}

    def test_json_with_trailing_prose(self):
        text = '{"key": "value"} and some extra text.'
        result = _extract_json(text)
        assert result == {"key": "value"}

    def test_nested_objects(self):
        text = '{"outer": {"inner": {"deep": 1}}}'
        result = _extract_json(text)
        assert result["outer"]["inner"]["deep"] == 1

    def test_no_json_raises(self):
        with pytest.raises(ValueError, match="No JSON object found"):
            _extract_json("This is plain text with no JSON.")

    def test_invalid_json_raises(self):
        with pytest.raises(ValueError, match="JSON decode failed"):
            _extract_json('{"key": missing_quotes}')

    def test_empty_string_raises(self):
        with pytest.raises(ValueError):
            _extract_json("")

    def test_only_array_raises(self):
        """_extract_json looks for '{' — a bare array should raise."""
        with pytest.raises(ValueError):
            _extract_json("[1, 2, 3]")


# ---------------------------------------------------------------------------
# parse_ai_response
# ---------------------------------------------------------------------------

class TestParseAiResponse:

    # -- Happy path ----------------------------------------------------------

    def test_parses_clean_json(self):
        result = parse_ai_response(_make_valid_json())
        assert result.intern_review.score == 72
        assert result.intern_review.audio_supported is True
        assert result.manager_summary.risk_level == "medium"

    def test_parses_json_with_markdown_fence(self):
        raw = f"```json\n{_make_valid_json()}\n```"
        result = parse_ai_response(raw)
        assert result.intern_review.score == 72

    def test_parses_json_with_leading_prose(self):
        raw = f"Here is my review:\n\n{_make_valid_json()}"
        result = parse_ai_response(raw)
        assert result.intern_review.feedback == "Good work overall."

    def test_parses_speech_text_field(self):
        raw = _make_valid_json(speech_text="Good work overall. No markdown here.")
        result = parse_ai_response(raw)
        assert result.intern_review.speech_text == "Good work overall. No markdown here."

    def test_parses_all_risk_levels(self):
        for level in ("low", "medium", "high", "critical"):
            data = json.loads(_make_valid_json())
            data["manager_summary"]["risk_level"] = level
            result = parse_ai_response(json.dumps(data))
            assert result.manager_summary.risk_level == level

    def test_bugs_field_populated(self):
        raw = _make_valid_json(bugs=["SQL injection", "Hardcoded secret"])
        result = parse_ai_response(raw)
        assert len(result.intern_review.bugs) == 2

    def test_empty_string_raises_parse_error(self):
        with pytest.raises(ParseError):
            parse_ai_response("")

    def test_plain_text_raises_parse_error(self):
        with pytest.raises(ParseError):
            parse_ai_response("Sorry, I could not produce a review.")

    def test_missing_intern_review_raises_parse_error(self):
        data = {"manager_summary": {"overall_score": 70, "summary": "x",
                                    "risk_level": "low", "recommendation": "y"}}
        with pytest.raises(ParseError):
            parse_ai_response(json.dumps(data))

    def test_missing_speech_text_raises_parse_error(self):
        data = json.loads(_make_valid_json())
        del data["intern_review"]["speech_text"]
        with pytest.raises(ParseError):
            parse_ai_response(json.dumps(data))

    def test_invalid_score_type_raises_parse_error(self):
        data = json.loads(_make_valid_json())
        data["intern_review"]["score"] = "seventy-two"
        with pytest.raises(ParseError):
            parse_ai_response(json.dumps(data))

    def test_score_out_of_range_raises_parse_error(self):
        data = json.loads(_make_valid_json())
        data["intern_review"]["score"] = 150
        with pytest.raises(ParseError):
            parse_ai_response(json.dumps(data))

    def test_invalid_risk_level_raises_parse_error(self):
        data = json.loads(_make_valid_json())
        data["manager_summary"]["risk_level"] = "catastrophic"
        with pytest.raises(ParseError):
            parse_ai_response(json.dumps(data))

    def test_truncated_json_raises_parse_error(self):
        truncated = _make_valid_json()[:50]
        with pytest.raises(ParseError):
            parse_ai_response(truncated)

    # -- Negative / attack inputs --------------------------------------------

    def test_extra_keys_are_ignored(self):
        """Extra keys from the LLM should not cause failures."""
        data = json.loads(_make_valid_json())
        data["intern_review"]["extra_unexpected_key"] = "this should be ignored"
        result = parse_ai_response(json.dumps(data))
        assert result.intern_review.score == 72
