import React, { useState } from 'react';
import { 
  Code2, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  User, 
  Play, 
  Clock, 
  Send, 
  Check, 
  Terminal,
  RefreshCw,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CodingCandidateFlow: React.FC = () => {
  const { addToast } = useApp();
  const [step, setStep] = useState<'login' | 'code' | 'workspace' | 'submitted'>('login');
  
  // Login form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // 6-digit code state
  const [accessCode, setAccessCode] = useState('INT901');

  // Candidate workspace state
  const [selectedLang, setSelectedLang] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState(`# Candidate Assessment Solution: Idempotent Rate Limiter
class RateLimiter:
    def __init__(self, max_requests: int, window_sec: int):
        self.max_requests = max_requests
        self.window_sec = window_sec
        self.history = {}

    def allow_request(self, user_id: str, timestamp: float) -> bool:
        if user_id not in self.history:
            self.history[user_id] = []
        # Sliding window check
        self.history[user_id] = [t for t in self.history[user_id] if timestamp - t < self.window_sec]
        if len(self.history[user_id]) < self.max_requests:
            self.history[user_id].append(timestamp)
            return True
        return False
`);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      addToast('Please enter your Intern Email or ID', 'error');
      return;
    }
    addToast('Authenticated successfully. Enter 6-digit access code.', 'success');
    setStep('code');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || accessCode.trim().length < 4) {
      addToast('Please enter a valid 6-digit access code', 'error');
      return;
    }
    addToast('Access code verified! Launching Coding Assessment Workspace.', 'success');
    setStep('workspace');
  };

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput("Running 4 candidate test cases in secure Docker sandbox...\n✓ Test Case 1: allowRequest('user_1', 1000) -> Passed\n✓ Test Case 2: allowRequest('user_1', 1005) -> Passed\n✓ Test Case 3: allowRequest('user_1', 1010) [Limit Reached] -> Passed\n✓ Test Case 4: allowRequest('user_2', 1012) -> Passed\n\nAll 4 test cases passed! (Execution time: 12ms)");
      addToast('Test cases passed successfully (4/4)!', 'success');
    }, 1000);
  };

  const handleFinalSubmit = () => {
    setStep('submitted');
    addToast('Coding assessment submitted for AI evaluation!', 'success');
  };

  if (step === 'submitted') {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col font-sans items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Assessment Submitted!</h2>
          <p className="text-xs text-slate-500">
            Your code has been sent to the Thozhil evaluation pipeline. Your manager can view your test results under Intern Details.
          </p>
          <button
            onClick={() => window.location.href = '/intern'}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md hover:bg-blue-700 transition-colors"
          >
            Return to Intern Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 'workspace') {
    return (
      <div className="w-screen h-screen bg-slate-900 flex flex-col font-sans overflow-hidden">
        {/* Candidate Header */}
        <header className="h-14 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <Code2 className="w-5 h-5 text-blue-500" />
              <span>Thozhil Coding Sandbox</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
              Session: {accessCode}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Time Left: 42:15</span>
            </div>

            <button
              onClick={handleFinalSubmit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Solution</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Problem Spec */}
          <div className="lg:col-span-5 bg-slate-900/60 border-r border-slate-800 p-6 overflow-y-auto space-y-4 text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">Idempotent Token Rate Limiter</h2>
              <span className="text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                Medium
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Design and implement an in-memory sliding-window rate limiter in your chosen language.
            </p>

            <div className="text-xs space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono">
              <div className="text-blue-400 font-bold mb-1">Requirements:</div>
              <div>1. Max N requests per client identifier in time W.</div>
              <div>2. Return True if allowed, False if limited.</div>
              <div>3. Thread-safe sliding window timestamp pruning.</div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500">Example Invocations:</span>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                <div>allow_request("user_1", 1000) -&gt; <span className="text-emerald-400">True</span></div>
                <div>allow_request("user_1", 1005) -&gt; <span className="text-emerald-400">True</span></div>
                <div>allow_request("user_1", 1010) -&gt; <span className="text-rose-400">False (Limit hit)</span></div>
              </div>
            </div>
          </div>

          {/* Code Editor & Test Console */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 overflow-hidden">
            <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">solution.py</span>
              <button
                onClick={handleRunTests}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="flex-1 p-4 bg-[#0a121e] text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none"
            />

            <div className="h-44 border-t border-slate-800 bg-slate-950 p-4 font-mono text-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Console & Output</span>
              </div>
              <div className="flex-1 bg-slate-900/90 rounded-lg p-3 text-slate-300 overflow-y-auto whitespace-pre-wrap text-[11px]">
                {output || "Click 'Run Tests' to execute solution against test suite."}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Candidate Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2 font-bold text-lg text-[#0B1C30]">
          <Sparkles className="w-5 h-5 text-[#1D78F8]" />
          <span>Thozhil</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-200 ml-2">
            Coding Assessment Portal
          </span>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Exit to Home
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 relative overflow-y-auto">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 relative overflow-hidden">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
              <Code2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thozhil Coding Assessment</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {step === 'login' 
                ? 'Candidate Sign In for AI Coding Evaluation' 
                : 'Enter your 6-digit assessment access code'}
            </p>
          </div>

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Intern Email Address</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sanjay@stripe.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Password / Candidate Passcode</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => { setEmailInput('sanjay@stripe.com'); setPasswordInput('password123'); }}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium underline block text-right"
              >
                Use Quick Demo Credentials
              </button>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group"
              >
                <span>Sign In & Proceed to 6-Digit Code</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                  6-Digit Access Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="INT901"
                  className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-3.5 bg-slate-50 border-2 border-blue-500/50 rounded-2xl text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 uppercase shadow-inner"
                />
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Enter code provided by your evaluator (e.g. <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">INT901</code>)
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
