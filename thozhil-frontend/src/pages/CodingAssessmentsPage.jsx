import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';

export const CodingAssessmentsPage = () => {
  const { showToast } = useApp();

  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState(null);

  const problem = {
    title: 'Idempotent Token Rate Limiter',
    difficulty: 'Medium',
    category: 'Backend Architecture',
    timeLimit: '15 mins',
    description: `Design and implement an in-memory sliding-window rate limiter in your chosen language.

### Requirements:
1. Allow maximum \`N\` requests within window time \`W\` (in seconds) per client identifier.
2. Return \`true\` if request is allowed, or \`false\` if rate limited.
3. Handle concurrent access safely and ensure constant-time timestamp lookups.`,
    examples: [
      { input: 'allowRequest("user_1", timestamp=1000)', output: 'true' },
      { input: 'allowRequest("user_1", timestamp=1001)', output: 'true' },
      { input: 'allowRequest("user_1", timestamp=1002) (Limit reached)', output: 'false' }
    ]
  };

  const starterCode = {
    python: `# Python 3.12 Sandboxed Solution
import time

class RateLimiter:
    def __init__(self, max_requests: int, window_sec: int):
        self.max_requests = max_requests
        self.window_sec = window_sec
        self.history = {}

    def allow_request(self, user_id: str, timestamp: float) -> bool:
        # Implement sliding window checks here
        return True

if __name__ == "__main__":
    limiter = RateLimiter(5, 60)
    print("Test Case 1 Passed:", limiter.allow_request("user_1", time.time()))
`,
    javascript: `// Node.js 20 Sandboxed Solution
class RateLimiter {
  constructor(maxRequests, windowSec) {
    this.maxRequests = maxRequests;
    this.windowSec = windowSec;
    this.history = new Map();
  }

  allowRequest(userId, timestamp) {
    // Implement sliding window checks here
    return true;
  }
}

const limiter = new RateLimiter(5, 60);
console.log("Test Case 1 Passed:", limiter.allowRequest("user_1", Date.now() / 1000));
`,
    cpp: `// C++17 Sandboxed Solution
#include <iostream>
#include <string>
#include <unordered_map>
#include <deque>

class RateLimiter {
public:
    RateLimiter(int maxReqs, int windowSec) {}
    bool allowRequest(const std::string& userId, double timestamp) {
        return true;
    }
};

int main() {
    RateLimiter limiter(5, 60);
    std::cout << "Test Case 1 Passed: " << (limiter.allowRequest("user_1", 1000.0) ? "true" : "false") << std::endl;
    return 0;
}
`
  };

  const [code, setCode] = useState(starterCode.python);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setCode(starterCode[lang] || '');
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setExecutionOutput(null);

    // Simulate Sandboxed Execution
    setTimeout(() => {
      setIsRunning(false);
      setExecutionOutput({
        verdict: 'ACCEPTED',
        executionTimeMs: 42,
        memoryUsedMb: 14.2,
        stdout: `Running test cases inside Docker ephemeral sandbox (network: none, memory: 256MB)...
Test Case 1: allow_request("user_1", 1000) -> Passed (expected true, got true)
Test Case 2: Consecutive request within window -> Passed
Test Case 3: Burst limit boundary check -> Passed

3/3 Test cases passed cleanly. Execution successful!`,
        stderr: ''
      });
      showToast('Solution evaluated successfully inside hardened Docker sandbox!', 'success');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 text-slate-800 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Thozhil Product Module 4</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            AI Coding Assessment & Sandboxed IDE
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Isolated Docker container execution engine with automated test case evaluation and performance analysis.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">Docker Hardened Sandbox Active</span>
          </Badge>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1">
        {/* Left Column: Problem Statement (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{problem.title}</h2>
            <Badge variant="warning">{problem.difficulty}</Badge>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-400 pb-3 border-b border-slate-100">
            <span>Category: <strong className="text-slate-700">{problem.category}</strong></span>
            <span>Allocated: <strong className="text-slate-700">{problem.timeLimit}</strong></span>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap flex-1">
            {problem.description}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Example Test Cases:</span>
            {problem.examples.map((ex, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-700">
                <div><span className="text-slate-400">Input:</span> {ex.input}</div>
                <div><span className="text-slate-400">Output:</span> {ex.output}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Editor & Sandboxed Console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Editor Header Bar */}
          <div className="bg-slate-900 px-4 py-2.5 rounded-t-2xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">Monaco IDE Sandbox</span>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-slate-800 text-white font-mono text-xs px-2.5 py-1 rounded border border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="python">Python 3.12</option>
                <option value="javascript">Node.js 20</option>
                <option value="cpp">C++ 17</option>
              </select>

              <Button
                variant="primary"
                size="xs"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                <Play className={`w-3.5 h-3.5 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Executing...' : 'Run in Sandbox'}
              </Button>
            </div>
          </div>

          {/* Code Textarea / IDE */}
          <div className="flex-1 bg-slate-950 rounded-b-2xl overflow-hidden border border-slate-800 p-0 flex flex-col min-h-[340px]">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full flex-1 p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-600"
              spellCheck={false}
            />

            {/* Sandbox Execution Console Footer */}
            {executionOutput && (
              <div className="p-4 border-t border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-emerald-400">Verdict: {executionOutput.verdict}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Time: {executionOutput.executionTimeMs}ms • Memory: {executionOutput.memoryUsedMb}MB
                  </div>
                </div>
                <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
                  {executionOutput.stdout}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
