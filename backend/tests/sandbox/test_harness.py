# tests/sandbox/test_harness.py
"""
Unit tests for the test-case harness normalization and verdict logic.
These test pure Python logic — no Docker needed.
"""

import pytest
from app.sandbox.harness import _normalize, _compare_outputs


def test_normalize_strips_trailing_whitespace():
    assert _normalize("hello   \n") == "hello"


def test_normalize_handles_crlf():
    assert _normalize("hello\r\nworld\r\n") == "hello\nworld"


def test_normalize_strips_trailing_blank_lines():
    assert _normalize("hello\n\n\n") == "hello"


def test_normalize_preserves_interior_blank_lines():
    result = _normalize("a\n\nb")
    assert result == "a\n\nb"


def test_compare_outputs_exact_match():
    assert _compare_outputs("hello\n", "hello") is True


def test_compare_outputs_trailing_newline_ignored():
    assert _compare_outputs("42\n", "42") is True
    assert _compare_outputs("42", "42\n") is True


def test_compare_outputs_crlf_lf_same():
    assert _compare_outputs("hello\r\nworld\r\n", "hello\nworld") is True


def test_compare_outputs_wrong_output():
    assert _compare_outputs("41\n", "42\n") is False


def test_compare_outputs_extra_spaces_in_line_matter():
    """Trailing spaces on a line are stripped, but leading spaces matter."""
    assert _compare_outputs("  hello", "  hello") is True
    assert _compare_outputs("hello", "  hello") is False


def test_compare_outputs_empty_vs_empty():
    assert _compare_outputs("", "") is True


def test_compare_outputs_empty_vs_nonempty():
    assert _compare_outputs("", "hello") is False
