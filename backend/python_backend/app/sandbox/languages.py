# python_backend/app/sandbox/languages.py
"""
Language registry for the Docker sandbox.

All images and commands are SERVER-CONTROLLED. User input never influences
the Docker image used or the command executed inside the container.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class LanguageSpec:
    """Specification for a supported language."""
    name: str              # canonical name e.g. "python"
    image: str             # Docker image tag
    source_filename: str   # filename to write inside container
    compile_cmd: Optional[List[str]]  # None for interpreted languages
    run_cmd: List[str]     # command to run the compiled/interpreted program
    aliases: List[str] = field(default_factory=list)


# Registry of allowed languages — keys are canonical lowercase names.
# User-supplied language strings are looked up here; anything not in this
# registry is rejected before any Docker interaction occurs.
LANGUAGE_REGISTRY: dict[str, LanguageSpec] = {
    "python": LanguageSpec(
        name="python",
        image="python:3.12-slim",
        source_filename="solution.py",
        compile_cmd=None,
        run_cmd=["python3", "solution.py"],
        aliases=["py", "python3"],
    ),
    "javascript": LanguageSpec(
        name="javascript",
        image="node:20-slim",
        source_filename="solution.js",
        compile_cmd=None,
        run_cmd=["node", "solution.js"],
        aliases=["js", "node", "nodejs"],
    ),
    "cpp": LanguageSpec(
        name="cpp",
        image="gcc:13",
        source_filename="solution.cpp",
        compile_cmd=["g++", "-O2", "-std=c++17", "-o", "solution", "solution.cpp"],
        run_cmd=["./solution"],
        aliases=["c++", "cxx"],
    ),
    "java": LanguageSpec(
        name="java",
        image="eclipse-temurin:17-jdk-alpine",
        source_filename="Solution.java",
        compile_cmd=["javac", "Solution.java"],
        run_cmd=["java", "Solution"],
        aliases=["java17"],
    ),
}

# Build a reverse alias map for fast lookup
_ALIAS_MAP: dict[str, str] = {}
for lang, spec in LANGUAGE_REGISTRY.items():
    _ALIAS_MAP[lang] = lang
    for alias in spec.aliases:
        _ALIAS_MAP[alias.lower()] = lang


def resolve_language(lang_input: str) -> Optional[LanguageSpec]:
    """Resolve a user-supplied language string to a LanguageSpec.

    Returns None if the language is not supported (caller should reject the
    request before any Docker interaction).
    """
    canonical = _ALIAS_MAP.get(lang_input.lower().strip())
    if canonical is None:
        return None
    return LANGUAGE_REGISTRY[canonical]


def supported_language_names() -> List[str]:
    """Return the list of canonical language names."""
    return list(LANGUAGE_REGISTRY.keys())
