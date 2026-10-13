const axios = require('axios');
const PQueue = require('p-queue').default;
const env = require('../config/env');

// All calls to the self-hosted compiler service funnel through this queue so that
// a burst of "Run Code" clicks (or exam-end submission storms) can't overwhelm the
// compiler VPS. Increase MAX_CONCURRENT_COMPILER_CALLS as the compiler box can handle it.
const queue = new PQueue({ concurrency: env.compiler.maxConcurrent });

const client = axios.create({
  baseURL: env.compiler.baseUrl,
  timeout: env.compiler.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    'X-Compiler-Key': env.compiler.apiKey,
  },
});

// Visible proof-of-life at boot: if you DON'T see this line in your server logs on
// startup, the process is still running old code — restart it. Also flags the two
// most common misconfigurations up front instead of failing mysteriously later.
console.log(
  `[compiler] baseUrl=${env.compiler.baseUrl} apiKey=${env.compiler.apiKey ? 'set (' + env.compiler.apiKey.length + ' chars)' : 'MISSING'}`
);
if (!env.compiler.apiKey) {
  console.warn('[compiler] COMPILER_API_KEY is not set — requests will likely get a 403 from the compiler service.');
}

// language values used across this app (Question.starterCode, allowedLanguages, the
// admin's Monaco language map) vs. the language/alias names Piston actually reports —
// same idea as the LANGUAGE_HINTS map in InterviewVault's execute.controller.js.
const LANGUAGE_HINTS = {
  python: ['python', 'python3', 'py'],
  python3: ['python', 'python3', 'py'],
  javascript: ['javascript', 'node', 'js', 'nodejs'],
  nodejs: ['javascript', 'node', 'js', 'nodejs'],
  typescript: ['typescript', 'ts'],
  java: ['java'],
  cpp: ['cpp', 'c++'],
  'c++': ['cpp', 'c++'],
  c: ['c'],
  csharp: ['csharp', 'c#', 'cs'],
  'c#': ['csharp', 'c#', 'cs'],
  go: ['go', 'golang'],
  golang: ['go', 'golang'],
  rust: ['rust', 'rs'],
  ruby: ['ruby', 'rb'],
  php: ['php'],
  kotlin: ['kotlin'],
  swift: ['swift'],
};

const RUNTIMES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let runtimesCache = null;
let runtimesCacheAt = 0;

async function getRuntimes() {
  const now = Date.now();
  if (runtimesCache && now - runtimesCacheAt < RUNTIMES_CACHE_TTL_MS) {
    console.log(`[compiler] getRuntimes: using cache (${runtimesCache.length} runtimes, age ${Math.round((now - runtimesCacheAt) / 1000)}s)`);
    return runtimesCache;
  }
  console.log('[compiler] getRuntimes: cache miss/expired — fetching GET /runtimes');
  try {
    const { data } = await client.get('/runtimes');
    console.log(
      `[compiler] getRuntimes: fetched ${Array.isArray(data) ? data.length : '?'} runtimes ->`,
      Array.isArray(data) ? data.map((r) => `${r.language}@${r.version}`).join(', ') : data
    );
    runtimesCache = data;
    runtimesCacheAt = now;
    return data;
  } catch (err) {
    console.error(
      '[compiler] getRuntimes: request failed —',
      err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message
    );
    throw err;
  }
}

/**
 * Resolves a language (+ optional requested version) to whatever the compiler service
 * actually reports as installed — never trusts a stored/imported version string as
 * gospel. This is the fix for the class of bug where an admin-entered or bulk-imported
 * `starterCode[].version` (garbled by a spreadsheet, mistyped, or just no longer
 * installed on the compiler box) reached Piston verbatim and failed as a cryptic
 * "runtime is unknown" — mirrors the dynamic-lookup approach in InterviewVault's
 * execute.controller.js, which never had this bug in the first place.
 *
 * A requestedVersion is honored ONLY if it exactly matches something genuinely
 * installed; otherwise this silently falls back to whatever real version IS installed
 * for that language, rather than sending a version Piston will reject outright.
 */
async function resolveRuntime(language, requestedVersion) {
  const key = String(language || '').toLowerCase();
  const hints = LANGUAGE_HINTS[key] || [key];
  const runtimes = await getRuntimes();
  const candidates = runtimes.filter(
    (rt) => hints.includes(rt.language) || (rt.aliases || []).some((alias) => hints.includes(alias))
  );
  console.log(
    `[compiler] resolveRuntime: language="${language}" requestedVersion="${requestedVersion || ''}" hints=[${hints.join(',')}] -> ${candidates.length} candidate(s): ${candidates.map((c) => `${c.language}@${c.version}`).join(', ') || '(none)'}`
  );
  if (candidates.length === 0) return null;

  if (requestedVersion && requestedVersion !== '*' && requestedVersion !== 'latest') {
    const exact = candidates.find((rt) => rt.version === requestedVersion);
    if (exact) {
      console.log(`[compiler] resolveRuntime: exact version match, using ${exact.language}@${exact.version}`);
      return exact;
    }
    console.log(`[compiler] resolveRuntime: requested version "${requestedVersion}" not installed — falling back to ${candidates[0].language}@${candidates[0].version}`);
  }
  return candidates[0];
}

/**
 * Executes one piece of code against the self-hosted compiler service. `version` is
 * an optional pin — see resolveRuntime — the actual language/version sent to the
 * compiler always comes from what it reports as installed, never from `version`
 * directly.
 *
 * @param {Object} params
 * @param {string} params.language
 * @param {string} [params.version]
 * @param {string} params.code
 * @param {string} [params.stdin]
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number, timeMs: number, memoryKb: number, resolvedVersion: string}>}
 */
async function executeCode({ language, version, code, stdin = '' }) {
  return queue.add(async () => {
    const startedAt = Date.now();

    let runtime;
    try {
      runtime = await resolveRuntime(language, version);
    } catch (err) {
      console.error('[compiler] executeCode: resolveRuntime failed before we even got to /execute —', err.message);
      throw new CompilerError('NETWORK_ERROR', 'Could not reach the compiler service.');
    }
    if (!runtime) {
      console.error(`[compiler] executeCode: no runtime found for language="${language}" — check the [compiler] resolveRuntime log line above for what languages ARE available.`);
      throw new CompilerError('UNSUPPORTED_LANGUAGE', `No execution runtime is available for "${language}".`, 400);
    }

    try {
      console.log(`[compiler] executeCode: POST /execute language=${runtime.language} version=${runtime.version} codeLen=${(code || '').length}`);
      const { data } = await client.post('/execute', {
        language: runtime.language,
        version: runtime.version,
        files: [{ content: code }],
        stdin,
      });

      const run = data.run || {};
      console.log(`[compiler] executeCode: success, exitCode=${run.code}, stdout=${JSON.stringify((run.stdout || '').slice(0, 200))}`);
      return {
        stdout: run.stdout ?? '',
        stderr: run.stderr ?? '',
        exitCode: typeof run.code === 'number' ? run.code : -1,
        timeMs: data.time ?? Date.now() - startedAt,
        memoryKb: data.memory ?? null,
        resolvedVersion: runtime.version,
      };
    } catch (err) {
      console.error(
        `[compiler] executeCode: request FAILED for language=${runtime.language} version=${runtime.version} —`,
        err.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message
      );
      if (err.code === 'ECONNABORTED') {
        throw new CompilerError('TIMEOUT', 'Code execution timed out.');
      }
      if (err.response) {
        throw new CompilerError(
          'COMPILER_ERROR',
          err.response.data?.message || 'Compiler service returned an error.',
          err.response.status
        );
      }
      throw new CompilerError('NETWORK_ERROR', 'Could not reach the compiler service.');
    }
  });
}

class CompilerError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

module.exports = { executeCode, getRuntimes, CompilerError };