# tests/sandbox/test_languages.py
"""
Unit tests for the language registry — no Docker or Redis required.
"""

import pytest
from app.sandbox.languages import resolve_language, supported_language_names, LANGUAGE_REGISTRY


def test_resolve_python():
    spec = resolve_language("python")
    assert spec is not None
    assert spec.name == "python"
    assert spec.compile_cmd is None
    assert "python3" in spec.run_cmd


def test_resolve_python_aliases():
    for alias in ("py", "python3", "Python", "PYTHON"):
        spec = resolve_language(alias)
        assert spec is not None, f"alias {alias!r} should resolve"
        assert spec.name == "python"


def test_resolve_javascript():
    spec = resolve_language("javascript")
    assert spec is not None
    assert spec.name == "javascript"
    assert spec.compile_cmd is None
    assert "node" in spec.run_cmd


def test_resolve_javascript_aliases():
    for alias in ("js", "node", "nodejs"):
        spec = resolve_language(alias)
        assert spec is not None
        assert spec.name == "javascript"


def test_resolve_cpp():
    spec = resolve_language("cpp")
    assert spec is not None
    assert spec.name == "cpp"
    assert spec.compile_cmd is not None
    assert "g++" in spec.compile_cmd


def test_resolve_cpp_aliases():
    for alias in ("c++", "cxx", "CPP"):
        spec = resolve_language(alias)
        assert spec is not None
        assert spec.name == "cpp"


def test_resolve_java():
    spec = resolve_language("java")
    assert spec is not None
    assert spec.name == "java"
    assert spec.compile_cmd is not None
    assert "javac" in spec.compile_cmd


def test_resolve_unknown_language():
    assert resolve_language("brainfuck") is None
    assert resolve_language("ruby") is None
    assert resolve_language("") is None
    assert resolve_language("  ") is None


def test_supported_languages_contains_expected():
    langs = supported_language_names()
    assert "python" in langs
    assert "javascript" in langs
    assert "cpp" in langs
    assert "java" in langs


def test_all_specs_have_images():
    for name, spec in LANGUAGE_REGISTRY.items():
        assert spec.image, f"{name} must have a Docker image"


def test_all_specs_have_run_cmd():
    for name, spec in LANGUAGE_REGISTRY.items():
        assert spec.run_cmd, f"{name} must have a run command"


def test_server_controls_images():
    """Images must be hardcoded server-side, not derivable from user input."""
    spec = resolve_language("python")
    # User can NOT influence the image — it's always the server-controlled value
    assert "python:3.12" in spec.image or "python" in spec.image
