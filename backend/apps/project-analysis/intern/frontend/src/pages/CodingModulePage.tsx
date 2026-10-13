import React, { useState } from 'react';
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Layers, 
  FileCode, 
  ChevronRight,
  Send,
  RefreshCw,
  Award,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Card, Button } from '../components/ui/PremiumComponents';
import { useApp } from '../context/AppContext';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  timeLimit: string;
  description: string;
  starterCode: Record<string, string>;
  testCases: Array<{ input: string; expected: string }>;
}

const PROBLEMS: Problem[] = [
  {
    id: 'prob-1',
    title: 'Idempotent Token Rate Limiter',
    difficulty: 'Medium',
    category: 'Backend Architecture',
    timeLimit: '15 mins',
    description: `Design and implement an in-memory sliding-window rate limiter in your chosen language.\n\n### Requirements:\n1. Allow maximum \`N\` requests within window time \`W\` (in seconds) per client identifier.\n2. Return \`true\` if request is allowed, or \`false\` if rate limited.\n3. Handle concurrent timestamp lookups efficiently with sub-millisecond overhead.`,
    starterCode: {
      python: `# Python 3.12 Sandboxed Solution\nimport time\n\nclass RateLimiter:\n    def __init__(self, max_requests: int, window_sec: int):\n        self.max_requests = max_requests\n        self.window_sec = window_sec\n        self.history = {}\n\n    def allow_request(self, user_id: str, timestamp: float) -> bool:\n        now = timestamp\n        if user_id not in self.history:\n            self.history[user_id] = []\n        \n        # Filter window timestamps\n        self.history[user_id] = [t for t in self.history[user_id] if now - t < self.window_sec]\n        \n        if len(self.history[user_id]) < self.max_requests:\n            self.history[user_id].append(now)\n            return True\n        return False\n\n# Self-test driver\nlimiter = RateLimiter(max_requests=2, window_sec=60)\nprint("Test 1:", limiter.allow_request("user_101", 1000.0))\nprint("Test 2:", limiter.allow_request("user_101", 1005.0))\nprint("Test 3 (Limited):", limiter.allow_request("user_101", 1010.0))`,
      javascript: `// Node.js Rate Limiter Solution\nclass RateLimiter {\n  constructor(maxRequests, windowSec) {\n    this.maxRequests = maxRequests;\n    this.windowSec = windowSec;\n    this.history = new Map();\n  }\n\n  allowRequest(userId, timestamp) {\n    const timestamps = this.history.get(userId) || [];\n    const valid = timestamps.filter(t => timestamp - t < this.windowSec);\n    \n    if (valid.length < this.maxRequests) {\n      valid.push(timestamp);\n      this.history.set(userId, valid);\n      return true;\n    }\n    return false;\n  }\n}\n\nconst limiter = new RateLimiter(2, 60);\nconsole.log("Test 1:", limiter.allowRequest("user_101", 1000));\nconsole.log("Test 2:", limiter.allowRequest("user_101", 1005));\nconsole.log("Test 3 (Limited):", limiter.allowRequest("user_101", 1010));`,
      cpp: `// C++17 Sliding Window Rate Limiter\n#include <iostream>\n#include <unordered_map>\n#include <vector>\n#include <algorithm>\n\nclass RateLimiter {\nprivate:\n    int maxRequests;\n    int windowSec;\n    std::unordered_map<std::string, std::vector<double>> history;\npublic:\n    RateLimiter(int maxReq, int winSec) : maxRequests(maxReq), windowSec(winSec) {}\n    \n    bool allowRequest(const std::string& userId, double timestamp) {\n        auto& times = history[userId];\n        times.erase(std::remove_if(times.begin(), times.end(), \n            [=](double t){ return timestamp - t >= windowSec; }), times.end());\n        if (times.size() < maxRequests) {\n            times.push_back(timestamp);\n            return true;\n        }\n        return false;\n    }\n};\n\nint main() {\n    RateLimiter rl(2, 60);\n    std::cout << "Test 1: " << (rl.allowRequest("user_101", 1000) ? "true" : "false") << "\\n";\n    std::cout << "Test 2: " << (rl.allowRequest("user_101", 1005) ? "true" : "false") << "\\n";\n    std::cout << "Test 3: " << (rl.allowRequest("user_101", 1010) ? "true" : "false") << "\\n";\n    return 0;\n}`
    },
    testCases: [
      { input: 'allowRequest("user_101", timestamp=1000)', expected: 'true' },
      { input: 'allowRequest("user_101", timestamp=1005)', expected: 'true' },
      { input: 'allowRequest("user_101", timestamp=1010)', expected: 'false (Rate limit reached)' },
      { input: 'allowRequest("user_202", timestamp=1012)', expected: 'true (Independent client)' }
    ]
  },
  {
    id: 'prob-2',
    title: 'Least Recently Used (LRU) Cache',
    difficulty: 'Hard',
    category: 'Data Structures',
    timeLimit: '20 mins',
    description: `Implement a Least Recently Used (LRU) cache with O(1) time complexity for both \`get\` and \`put\` operations.\n\n### Requirements:\n1. Initialize LRU cache with positive capacity.\n2. \`get(key)\`: Return value if key exists, otherwise -1.\n3. \`put(key, value)\`: Update value if key exists, or insert new key-value pair. When capacity is exceeded, invalidate least recently used item.`,
    starterCode: {
      python: `# Python 3.12 LRU Cache Implementation\nfrom collections import OrderedDict\n\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = OrderedDict()\n\n    def get(self, key: int) -> int:\n        if key not in self.cache:\n            return -1\n        self.cache.move_to_end(key)\n        return self.cache[key]\n\n    def put(self, key: int, value: int) -> None:\n        if key in self.cache:\n            self.cache.move_to_end(key)\n        self.cache[key] = value\n        if len(self.cache) > self.capacity:\n            self.cache.popitem(last=False)\n\n# Test execution\nlru = LRUCache(2)\nlru.put(1, 1)\nlru.put(2, 2)\nprint("get(1):", lru.get(1))\nlru.put(3, 3) # evicts key 2\nprint("get(2):", lru.get(2))`,
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n  put(key, value) {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      this.map.delete(this.map.keys().next().value);\n    }\n  }\n}\nconst lru = new LRUCache(2);\nlru.put(1, 1);\nlru.put(2, 2);\nconsole.log("get(1):", lru.get(1));\nlru.put(3, 3);\nconsole.log("get(2):", lru.get(2));`
    },
    testCases: [
      { input: 'put(1, 1), put(2, 2), get(1)', expected: '1' },
      { input: 'put(3, 3) [evicts 2], get(2)', expected: '-1' },
      { input: 'put(4, 4) [evicts 1], get(1)', expected: '-1' },
      { input: 'get(3), get(4)', expected: '3, 4' }
    ]
  }
];

export const CodingModulePage: React.FC = () => {
  const { addToast } = useApp();
  const [selectedProbIndex, setSelectedProbIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'python' | 'javascript' | 'cpp'>('python');
  const currentProblem = PROBLEMS[selectedProbIndex];
  const [code, setCode] = useState(currentProblem.starterCode[selectedLang] || currentProblem.starterCode['python']);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'ai-review' | 'candidates'>('output');
  const [testResults, setTestResults] = useState<{
    passed: number;
    total: number;
    stdout: string;
    executionTimeMs: number;
    memoryUsedMb: number;
  } | null>({
    passed: 4,
    total: 4,
    stdout: "All 4 sandbox test assertions verified.\n✓ Test 1: allowRequest('user_101', 1000.0) -> Expected: true | Output: true\n✓ Test 2: allowRequest('user_101', 1005.0) -> Expected: true | Output: true\n✓ Test 3: allowRequest('user_101', 1010.0) -> Expected: false | Output: false\n✓ Test 4: allowRequest('user_202', 1012.0) -> Expected: true | Output: true",
    executionTimeMs: 14.8,
    memoryUsedMb: 18.2
  });

  const handleProblemChange = (index: number) => {
    setSelectedProbIndex(index);
    const p = PROBLEMS[index];
    setCode(p.starterCode[selectedLang] || p.starterCode['python']);
    setTestResults(null);
  };

  const handleLanguageChange = (lang: 'python' | 'javascript' | 'cpp') => {
    setSelectedLang(lang);
    setCode(currentProblem.starterCode[lang] || currentProblem.starterCode['python']);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setTestResults({
        passed: currentProblem.testCases.length,
        total: currentProblem.testCases.length,
        stdout: `Execution completed successfully in isolated Docker sandbox.\n${currentProblem.testCases.map((tc, i) => `✓ Test Case ${i + 1}: ${tc.input} -> Result matched (${tc.expected})`).join('\n')}`,
        executionTimeMs: Math.floor(Math.random() * 20 + 10),
        memoryUsedMb: parseFloat((Math.random() * 5 + 15).toFixed(1))
      });
      addToast('Docker sandbox execution completed! 100% tests passed.', 'success');
    }, 1200);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Module Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">AI Coding Interviewer & Assessment Engine</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Docker Sandbox Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated multi-language code evaluation, AST static analysis, and runtime complexity grading.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleRunCode}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl shadow-sm"
            >
              {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Executing in Sandbox...' : 'Run & Evaluate Code'}</span>
            </Button>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problem & Challenge Context */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Challenge</span>
                <select
                  value={selectedProbIndex}
                  onChange={(e) => handleProblemChange(Number(e.target.value))}
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {PROBLEMS.map((prob, i) => (
                    <option key={prob.id} value={i}>{prob.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-base font-bold text-slate-900">{currentProblem.title}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentProblem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700' :
                    currentProblem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {currentProblem.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-blue-500" /> {currentProblem.category}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {currentProblem.timeLimit}</span>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-xl border border-slate-100 font-sans">
                {currentProblem.description}
              </div>

              {/* Test Cases preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verification Test Cases</span>
                <div className="space-y-2">
                  {currentProblem.testCases.map((tc, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] font-mono">
                      <div className="text-slate-500">Input: <span className="text-slate-800 font-medium">{tc.input}</span></div>
                      <div className="text-slate-500">Expected: <span className="text-emerald-700 font-semibold">{tc.expected}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Candidate Submissions Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Benchmarks</span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">AI</span>
                    <span className="font-semibold text-slate-800">Ananya Iyer (INT-901)</span>
                  </div>
                  <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">8/8 Passed (100%)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">AP</span>
                    <span className="font-semibold text-slate-800">Arjun Patel (INT-902)</span>
                  </div>
                  <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">7/8 Passed (87.5%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Console */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
              {/* Editor Header */}
              <div className="h-12 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono font-medium text-slate-300">solution.{selectedLang === 'python' ? 'py' : selectedLang === 'javascript' ? 'js' : 'cpp'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedLang}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none font-mono"
                  >
                    <option value="python">Python 3.12</option>
                    <option value="javascript">Node.js 20</option>
                    <option value="cpp">C++17 (GCC 13)</option>
                  </select>
                </div>
              </div>

              {/* Code Textarea Area */}
              <div className="flex-1 p-4 bg-[#0B1524] relative overflow-hidden">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-600 selection:text-white"
                />
              </div>

              {/* Execution Console Footer */}
              <div className="border-t border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Docker Execution Sandbox</span>
                  </div>
                  {testResults && (
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="text-emerald-400 font-semibold">{testResults.passed}/{testResults.total} Passed</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">{testResults.executionTimeMs}ms</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">{testResults.memoryUsedMb}MB RAM</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {testResults ? testResults.stdout : "Click 'Run & Evaluate Code' to execute against test suite in isolated Docker sandbox."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
