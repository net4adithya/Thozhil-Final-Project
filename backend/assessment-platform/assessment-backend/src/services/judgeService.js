const { executeCode } = require('./compilerService');

/**
 * Normalizes output before comparison: trims trailing whitespace on each line and
 * trailing blank lines, so cosmetic differences (trailing newline, trailing spaces)
 * don't fail an otherwise-correct submission. Does NOT ignore internal whitespace
 * or case, since that could hide real bugs.
 */
function normalize(output) {
  if (typeof output !== 'string') return '';
  return output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}

/**
 * Runs a question's custom checker script against one test case's result.
 *
 * Contract (documented here since it's not enforced by any type system): the checker
 * is executed in the SAME language/version as the candidate's submission — a checker
 * for a Python question is itself Python, etc. — so no extra "checker language" field
 * is needed on the Question schema. It receives a single line of JSON on stdin:
 *   { "input": <test case stdin>, "expected": <expectedOutput>, "actual": <candidate stdout> }
 * and must print, as the LAST non-empty line of its stdout, either "PASS" or "FAIL"
 * (case-insensitive). This mirrors how special judges work on most competitive-judging
 * platforms (checker reads in/expected/actual, decides verdict), while staying simple
 * enough to run through the same executeCode() sandbox used for candidate code.
 *
 * A checker that errors, times out, or doesn't print a recognizable verdict is treated
 * as FAIL — a broken checker must never silently award marks.
 */
async function runCustomChecker({ language, version, checkerCode, input, expected, actual }) {
  const stdin = JSON.stringify({ input: input || '', expected: expected || '', actual: actual || '' });
  try {
    const result = await executeCode({ language, version, code: checkerCode, stdin });
    const lines = normalize(result.stdout).split('\n').map((l) => l.trim()).filter(Boolean);
    const verdict = (lines[lines.length - 1] || '').toUpperCase();
    return {
      passed: result.exitCode === 0 && verdict === 'PASS',
      checkerStdout: result.stdout,
      checkerStderr: result.stderr,
    };
  } catch {
    return { passed: false, checkerStdout: '', checkerStderr: 'Checker execution failed.' };
  }
}

/**
 * Runs a candidate's code against one test case and returns a structured result.
 * Never includes the expected output in the returned object — callers decide
 * separately whether/what to reveal to the candidate.
 *
 * If the question defines `customCheckerCode`, exact-match comparison is replaced by
 * that checker's verdict (see runCustomChecker above) — useful for questions with
 * multiple valid outputs (floating-point tolerance, unordered results, etc.).
 */
async function runAgainstTestCase({ language, version, code, testCase, customCheckerCode }) {
  const result = await executeCode({
    language,
    version,
    code,
    stdin: testCase.input || '',
  });

  let passed = result.exitCode === 0 && normalize(result.stdout) === normalize(testCase.expectedOutput);

  if (result.exitCode === 0 && customCheckerCode) {
    const verdict = await runCustomChecker({
      language,
      version,
      checkerCode: customCheckerCode,
      input: testCase.input,
      expected: testCase.expectedOutput,
      actual: result.stdout,
    });
    passed = verdict.passed;
  }

  return {
    testCaseId: testCase._id,
    isHidden: testCase.isHidden,
    passed,
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: normalize(result.stdout) || (result.stderr ? `Error: ${result.stderr}` : 'No output'),
    stdout: result.stdout,
    stderr: result.stderr,
    timeMs: result.timeMs,
    memoryKb: result.memoryKb,
    exitCode: result.exitCode,
  };
}

/**
 * Runs code against ALL of a question's test cases (visible + hidden) and computes
 * a score. Used on final submit. For "Run Code" (visible-only, no scoring) use
 * runAgainstTestCase directly per-visible-case from the controller instead.
 */
async function scoreCodingAnswer({ language, version, code, question }) {
  const testCases = question.testCases || [];
  const results = [];

  for (const tc of testCases) {
    // Sequential execution keeps per-candidate resource usage predictable and simplifies
    // rate limiting at the compiler queue level; p-queue still allows cross-candidate parallelism.
    // eslint-disable-next-line no-await-in-loop
    const r = await runAgainstTestCase({
      language,
      version,
      code,
      testCase: tc,
      customCheckerCode: question.customCheckerCode || null,
    });
    results.push(r);
  }

  const totalPoints = testCases.reduce((sum, tc) => sum + (tc.points || 1), 0) || testCases.length;
  const earnedPoints = results.reduce((sum, r, i) => {
    if (!r.passed) return sum;
    return sum + (testCases[i].points || 1);
  }, 0);

  const passedCount = results.filter((r) => r.passed).length;
  const marksAwarded = totalPoints > 0 ? (earnedPoints / totalPoints) * question.marks : 0;

  return {
    testCaseResults: results,
    passedCount,
    totalCount: testCases.length,
    marksAwarded: Math.round(marksAwarded * 100) / 100,
    isCorrect: passedCount === testCases.length && testCases.length > 0,
  };
}

/**
 * Strips fields from test case results that only make sense internally (never send
 * expected output; for hidden cases also strip stdout/stderr so candidates can't
 * reverse-engineer the hidden input/output pairs from a wrong-answer diff).
 */
function toCandidateSafeResults(testCaseResults) {
  return testCaseResults.map((r) => {
    if (r.isHidden) {
      return { testCaseId: r.testCaseId, isHidden: true, passed: r.passed };
    }
    return {
      testCaseId: r.testCaseId,
      isHidden: false,
      passed: r.passed,
      stdout: r.stdout,
      stderr: r.stderr,
      timeMs: r.timeMs,
    };
  });
}

module.exports = { runAgainstTestCase, scoreCodingAnswer, toCandidateSafeResults, normalize };
