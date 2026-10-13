/**
 * Local compiler endpoint — implements a Piston-compatible API surface using the
 * Node.js, Python, Java, and C/C++ runtimes installed on host or WSL.
 *
 * Routes:
 *   GET  /api/compiler/runtimes  → array of { language, version, aliases }
 *   POST /api/compiler/execute   → { language, version, files, stdin } → { run: { stdout, stderr, code } }
 */
const router = require('express').Router();
const { exec, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');

// ─── Runtime detection & caching ─────────────────────────────────────────────

let cachedRuntimes = null;
let detectedTools = {};

function toWslPath(winPath) {
  return winPath.replace(/\\/g, '/').replace(/^([a-zA-Z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
}

function runCmd(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      const output = (stdout || '') + (stderr || '');
      if (output.trim()) resolve(output.trim());
      else resolve(null);
    });
  });
}

async function detectRuntimes() {
  if (cachedRuntimes) return cachedRuntimes;

  const runtimes = [];
  detectedTools = {};

  // 1. Python
  let pyVersion = await runCmd('python --version 2>&1 || python3 --version 2>&1');
  if (pyVersion) {
    detectedTools.python = 'python';
  } else {
    const wslPy = await runCmd('wsl python3 -V 2>&1');
    if (wslPy) {
      pyVersion = wslPy;
      detectedTools.python = 'wsl python3';
    }
  }
  if (pyVersion) {
    const ver = pyVersion.match(/\d+\.\d+\.\d+/)?.[0] || '3.x';
    runtimes.push({ language: 'python', version: ver, aliases: ['python3', 'py'] });
    runtimes.push({ language: 'python3', version: ver, aliases: ['python', 'py'] });
  }

  // 2. JavaScript (Node)
  let nodeVersion = await runCmd('node --version');
  if (nodeVersion) {
    detectedTools.node = 'node';
  } else {
    const wslNode = await runCmd('wsl node -v 2>&1');
    if (wslNode) {
      nodeVersion = wslNode;
      detectedTools.node = 'wsl node';
    }
  }
  if (nodeVersion) {
    const ver = nodeVersion.match(/\d+\.\d+\.\d+/)?.[0] || '18.x';
    runtimes.push({ language: 'javascript', version: ver, aliases: ['node', 'js', 'nodejs'] });
    runtimes.push({ language: 'nodejs', version: ver, aliases: ['node', 'js', 'javascript'] });
  }

  // 3. Java
  let javaVersion = null;
  const wslJava = await runCmd('wsl javac -version 2>&1');
  if (wslJava && wslJava.includes('javac')) {
    detectedTools.java = 'wsl';
    javaVersion = wslJava;
  } else {
    const hostJava = await runCmd('javac -version 2>&1');
    if (hostJava && hostJava.includes('javac')) {
      detectedTools.java = 'host';
      javaVersion = hostJava;
    }
  }
  if (javaVersion) {
    const ver = javaVersion.match(/(\d+[\.\d]*)/)?.[0] || '17';
    runtimes.push({ language: 'java', version: ver, aliases: [] });
  }

  // 4. C++ / C (g++)
  let gppVersion = null;
  const wslCpp = await runCmd('wsl g++ --version 2>&1');
  if (wslCpp && wslCpp.includes('g++')) {
    detectedTools.cpp = 'wsl';
    gppVersion = wslCpp;
  } else {
    const hostCpp = await runCmd('g++ --version 2>&1');
    if (hostCpp && hostCpp.includes('g++')) {
      detectedTools.cpp = 'host';
      gppVersion = hostCpp;
    }
  }
  if (gppVersion) {
    const ver = gppVersion.match(/(\d+\.\d+\.\d+)/)?.[0] || '11.x';
    runtimes.push({ language: 'cpp', version: ver, aliases: ['c++'] });
    runtimes.push({ language: 'c', version: ver, aliases: ['gcc'] });
  }

  cachedRuntimes = runtimes;
  console.log('[local-compiler] detected runtimes:', runtimes.map((r) => `${r.language}@${r.version}`).join(', '));
  console.log('[local-compiler] detected execution mode:', detectedTools);
  return runtimes;
}

// ─── Code Execution ───────────────────────────────────────────────────────────

const TIMEOUT_MS = 12000;
const MAX_OUTPUT = 50000; // 50KB

async function runCode({ language, code, stdin = '' }) {
  await detectRuntimes();
  const lang = (language || '').toLowerCase();
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const execDir = path.join(tmpDir, `compiler_${id}`);
  fs.mkdirSync(execDir, { recursive: true });

  try {
    if (lang === 'python' || lang === 'python3' || lang === 'py') {
      return await runPython(execDir, code, stdin);
    } else if (lang === 'javascript' || lang === 'nodejs' || lang === 'node' || lang === 'js') {
      return await runJavaScript(execDir, code, stdin);
    } else if (lang === 'java') {
      return await runJava(execDir, code, stdin);
    } else if (lang === 'cpp' || lang === 'c++') {
      return await runCpp(execDir, code, stdin);
    } else if (lang === 'c' || lang === 'gcc') {
      return await runC(execDir, code, stdin);
    } else {
      return { stdout: '', stderr: `Language "${language}" is not supported.`, code: 1, time: 0 };
    }
  } finally {
    try { fs.rmSync(execDir, { recursive: true, force: true }); } catch {}
  }
}

function runPython(dir, code, stdin) {
  const file = path.join(dir, 'solution.py');
  fs.writeFileSync(file, code, 'utf8');

  if (detectedTools.python === 'wsl python3') {
    const wslFile = toWslPath(file);
    return spawnAndCapture('wsl', ['python3', wslFile], stdin, dir);
  }
  return spawnAndCapture('python', [file], stdin, dir);
}

function runJavaScript(dir, code, stdin) {
  const file = path.join(dir, 'solution.js');
  fs.writeFileSync(file, code, 'utf8');

  if (detectedTools.node === 'wsl node') {
    const wslFile = toWslPath(file);
    return spawnAndCapture('wsl', ['node', wslFile], stdin, dir);
  }
  return spawnAndCapture('node', [file], stdin, dir);
}

async function runJava(dir, code, stdin) {
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch?.[1] || 'Main';
  const file = path.join(dir, `${className}.java`);
  fs.writeFileSync(file, code, 'utf8');

  const useWsl = detectedTools.java === 'wsl';

  if (useWsl) {
    const wslDir = toWslPath(dir);
    const wslFile = toWslPath(file);

    // Compile
    const compileResult = await spawnAndCapture('wsl', ['javac', wslFile], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Run
    return spawnAndCapture('wsl', ['java', '-cp', wslDir, className], stdin, dir);
  } else {
    // Host compile
    const compileResult = await spawnAndCapture('javac', [file], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Host run
    return spawnAndCapture('java', ['-cp', dir, className], stdin, dir);
  }
}

async function runCpp(dir, code, stdin) {
  const srcFile = path.join(dir, 'solution.cpp');
  fs.writeFileSync(srcFile, code, 'utf8');

  const useWsl = detectedTools.cpp === 'wsl';

  if (useWsl) {
    const wslSrc = toWslPath(srcFile);
    const wslOut = toWslPath(path.join(dir, 'solution_out'));

    // Compile
    const compileResult = await spawnAndCapture('wsl', ['g++', '-o', wslOut, wslSrc, '-std=c++17'], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Run
    return spawnAndCapture('wsl', [wslOut], stdin, dir);
  } else {
    const outFile = path.join(dir, process.platform === 'win32' ? 'solution_out.exe' : 'solution_out');

    // Compile
    const compileResult = await spawnAndCapture('g++', ['-o', outFile, srcFile, '-std=c++17'], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Run
    return spawnAndCapture(outFile, [], stdin, dir);
  }
}

async function runC(dir, code, stdin) {
  const srcFile = path.join(dir, 'solution.c');
  fs.writeFileSync(srcFile, code, 'utf8');

  const useWsl = detectedTools.cpp === 'wsl';

  if (useWsl) {
    const wslSrc = toWslPath(srcFile);
    const wslOut = toWslPath(path.join(dir, 'solution_out'));

    // Compile
    const compileResult = await spawnAndCapture('wsl', ['gcc', '-o', wslOut, wslSrc], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Run
    return spawnAndCapture('wsl', [wslOut], stdin, dir);
  } else {
    const outFile = path.join(dir, process.platform === 'win32' ? 'solution_out.exe' : 'solution_out');

    // Compile
    const compileResult = await spawnAndCapture('gcc', ['-o', outFile, srcFile], '', dir);
    if (compileResult.code !== 0) {
      return { stdout: '', stderr: compileResult.stderr || compileResult.stdout, code: 1, time: 0 };
    }

    // Run
    return spawnAndCapture(outFile, [], stdin, dir);
  }
}

function spawnAndCapture(cmd, args, stdin, cwd) {
  return new Promise((resolve) => {
    const startMs = Date.now();
    let stdout = '';
    let stderr = '';
    let settled = false;

    const useShell = process.platform === 'win32' && cmd !== 'wsl';

    const child = spawn(cmd, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: useShell,
    });

    child.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(0, MAX_OUTPUT) + '\n[output truncated]';
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
      if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(0, MAX_OUTPUT) + '\n[error truncated]';
    });

    if (stdin) {
      try { child.stdin.write(stdin); } catch {}
    }
    try { child.stdin.end(); } catch {}

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { child.kill('SIGKILL'); } catch {}
        resolve({ stdout, stderr: stderr + '\nExecution timed out.', code: 124, time: TIMEOUT_MS });
      }
    }, TIMEOUT_MS);

    child.on('close', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ stdout, stderr, code: code ?? 0, time: Date.now() - startMs });
      }
    });

    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ stdout: '', stderr: err.message, code: 1, time: Date.now() - startMs });
      }
    });
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/runtimes', async (req, res) => {
  try {
    const runtimes = await detectRuntimes();
    res.json(runtimes);
  } catch (err) {
    res.status(500).json({ message: 'Could not detect runtimes.', error: err.message });
  }
});

router.post('/execute', async (req, res) => {
  const { language, files, stdin = '' } = req.body;

  if (!language) return res.status(400).json({ message: 'language is required.' });
  if (!Array.isArray(files) || !files[0]?.content) {
    return res.status(400).json({ message: 'files[0].content is required.' });
  }

  const code = files[0].content;
  const startMs = Date.now();

  try {
    const result = await runCode({ language, code, stdin });
    res.json({
      run: {
        stdout: result.stdout,
        stderr: result.stderr,
        code: result.code,
        signal: null,
        output: result.stdout + result.stderr,
      },
      language,
      time: result.time || (Date.now() - startMs),
    });
  } catch (err) {
    res.status(500).json({ message: 'Execution failed.', error: err.message });
  }
});

router.runCode = runCode;
module.exports = router;
