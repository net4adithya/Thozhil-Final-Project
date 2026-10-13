import React, { useState } from 'react';
import { 
  Video, 
  User, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  Mic, 
  MicOff, 
  VideoOff, 
  Clock, 
  CheckCircle2,
  Send,
  BrainCircuit
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VideoCandidateFlow: React.FC = () => {
  const { addToast } = useApp();
  const [step, setStep] = useState<'login' | 'workspace' | 'submitted'>('login');
  
  // Login form state
  const [candidateName, setCandidateName] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Video Room state
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const QUESTIONS = [
    "Tell us about a time you optimized latency or handled high concurrency in a web service.",
    "How do you design database transactions to prevent race conditions during distributed updates?",
    "Explain how React memoization hooks (useMemo, useCallback) impact component re-renders."
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !emailInput.trim()) {
      addToast('Please fill in your Candidate Name and Email', 'error');
      return;
    }
    addToast('Candidate verified! Joining AI Video Interview Room.', 'success');
    setStep('workspace');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      addToast('Moving to next AI interview question.', 'info');
    } else {
      setStep('submitted');
      addToast('Interview completed! Video & audio streams submitted for AI scoring.', 'success');
    }
  };

  if (step === 'submitted') {
    return (
      <div className="w-screen h-screen bg-slate-50 flex flex-col font-sans items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Interview Completed!</h2>
          <p className="text-xs text-slate-500">
            Thank you, {candidateName || 'Candidate'}. Your responses have been processed by our speech and behavioral analysis engine. Your evaluator will review your scorecard shortly.
          </p>
          <button
            onClick={() => window.location.href = '/intern'}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700 transition-colors"
          >
            Return to Intern Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 'workspace') {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
        {/* Candidate Header */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-bold text-base text-white">
              <Video className="w-5 h-5 text-indigo-500" />
              <span>Thozhil AI Video Interview Room</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
              Candidate: {candidateName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
            </div>

            <button
              onClick={handleNextQuestion}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>{currentQuestionIndex < QUESTIONS.length - 1 ? 'Next Question' : 'Complete Interview'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Video Interview Stage */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-6">
          {/* Question Banner */}
          <div className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">AI Question Prompt</span>
              <p className="text-sm font-semibold text-white mt-0.5 leading-relaxed">
                {QUESTIONS[currentQuestionIndex]}
              </p>
            </div>
          </div>

          {/* Video Preview Box */}
          <div className="w-full aspect-video bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
            <div className="w-28 h-28 rounded-full bg-indigo-600/30 border-2 border-indigo-500/40 flex items-center justify-center text-4xl font-bold text-white shadow-2xl mb-2 backdrop-blur-md">
              {candidateName ? candidateName.split(' ').map(n => n[0]).join('') : 'C'}
            </div>
            <p className="text-sm font-semibold text-slate-200">{candidateName}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Live Camera Feed Simulated • 1080p WebRTC</p>

            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-slate-700/50 backdrop-blur-md text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Proctoring & Eye Contact Verified</span>
            </div>

            {/* Stage bottom controls */}
            <div className="absolute bottom-4 flex items-center gap-3">
              <button
                onClick={() => setIsMicOn(!isMicOn)}
                className={`p-3 rounded-full text-white transition-colors ${
                  isMicOn ? 'bg-slate-800/90 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsCamOn(!isCamOn)}
                className={`p-3 rounded-full text-white transition-colors ${
                  isCamOn ? 'bg-slate-800/90 hover:bg-slate-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isCamOn ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
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
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold border border-indigo-200 ml-2">
            AI Video Interview Portal
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
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
              <Video className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thozhil Video Interview</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Candidate Sign In for AI Video Assessment Room
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Full Candidate Name</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ananya Iyer"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Intern Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. ananya.iyer@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => { setCandidateName('Ananya Iyer'); setEmailInput('ananya.iyer@example.com'); }}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium underline block text-right"
            >
              Use Quick Demo Candidate
            </button>

            <button
              type="submit"
              className="w-full mt-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 group"
            >
              <Camera className="w-4 h-4" />
              <span>Enter Video Interview Room</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-emerald-600">
              <ShieldCheck className="w-3.5 h-3.5" />
              Camera & Voice Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
