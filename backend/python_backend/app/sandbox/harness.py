# python_backend/app/sandbox/harness.py
"""
Test case harness — runs a program against multiple test cases and computes verdicts.

Expected outputs are NEVER included in the response to prevent leaking hidden
test-case answers to the frontend.
"""

from __future__ import annotations

import re
from typing import List, Optional

from .executor import execute_in_sandbox, ExecutionResult
from .languages import LanguageSpec
from .schemas import (
    SandboxRunResponse,
    TestCaseInput,
    TestCaseResult,
    Verdict,
)


def _normalize(text: str) -> str:
    """
    Normalize output for comparison:
    - Strip leading/trailing whitespace from the whole output
    - Normalize line endings to \\n
    - Strip trailing whitespace from each line
    - Collapse consecutive blank lines to a single blank line
    """
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.splitlines()]
    # Remove trailing blank lines
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def _compare_outputs(actual: str, expected: str) -> bool:
    return _normalize(actual) == _normalize(expected)


async def run_single(
    spec: LanguageSpec,
    source_code: str,
    stdin: str = "",
) -> SandboxRunResponse:
    """Run code once (no test case comparison) and return structured result."""
    result = await execute_in_sandbox(spec, source_code, stdin)
    return SandboxRunResponse(
        verdict=result.verdict,
        stdout=result.stdout,
        stderr=result.stderr,
        compile_error=result.compile_error,
        runtime_error=result.runtime_error,
        execution_time_ms=result.execution_time_ms,
        exit_code=result.exit_code,
    )


async def run_with_test_cases(
    spec: LanguageSpec,
    source_code: str,
    test_cases: List[TestCaseInput],
) -> SandboxRunResponse:
    """
    Run code against each test case sequentially.

    - For compiled languages the compilation is attempted once before running
      test cases (short-circuit on compile error).
    - Each test case runs in its own fresh container.
    - Expected outputs are compared but NEVER returned in the response.
    """
    if not test_cases:
        return await run_single(spec, source_code)

    # ─── Try a compile-check first for compiled languages ────────────────────
    # Run a dummy execution with empty stdin just to trigger compilation;
    # if compile fails we return COMPILE_ERROR immediately without running TCs.
    if spec.compile_cmd:
        probe = await execute_in_sandbox(spec, source_code, stdin="")
        if probe.verdict == Verdict.COMPILE_ERROR:
            return SandboxRunResponse(
                verdict=Verdict.COMPILE_ERROR,
                compile_error=probe.compile_error,
                stderr=probe.stderr,
                exit_code=probe.exit_code,
            )

    tc_results: List[TestCaseResult] = []
    overall_verdict = Verdict.ACCEPTED
    total_time_ms = 0.0

    for tc in test_cases:
        result = await execute_in_sandbox(spec, source_code, stdin=tc.stdin)
        total_time_ms += result.execution_time_ms or 0.0

        if result.verdict == Verdict.TIME_LIMIT_EXCEEDED:
            tc_verdict = Verdict.TIME_LIMIT_EXCEEDED
            if overall_verdict == Verdict.ACCEPTED:
                overall_verdict = Verdict.TIME_LIMIT_EXCEEDED
        elif result.verdict == Verdict.RUNTIME_ERROR:
            tc_verdict = Verdict.RUNTIME_ERROR
            if overall_verdict == Verdict.ACCEPTED:
                overall_verdict = Verdict.RUNTIME_ERROR
        elif result.verdict == Verdict.INTERNAL_ERROR:
            tc_verdict = Verdict.INTERNAL_ERROR
            if overall_verdict == Verdict.ACCEPTED:
                overall_verdict = Verdict.INTERNAL_ERROR
        else:
            # Check expected output (verdict is ACCEPTED from executor; we do WA check here)
            if _compare_outputs(result.stdout or "", tc.expected_output):
                tc_verdict = Verdict.ACCEPTED
            else:
                tc_verdict = Verdict.WRONG_ANSWER
                if overall_verdict == Verdict.ACCEPTED:
                    overall_verdict = Verdict.WRONG_ANSWER

        tc_results.append(
            TestCaseResult(
                id=tc.id,
                verdict=tc_verdict,
                stdout=result.stdout,
                stderr=result.stderr,
                execution_time_ms=result.execution_time_ms,
                exit_code=result.exit_code,
                # expected_output intentionally NOT included
            )
        )

    return SandboxRunResponse(
        verdict=overall_verdict,
        execution_time_ms=total_time_ms,
        test_case_results=tc_results,
    )
