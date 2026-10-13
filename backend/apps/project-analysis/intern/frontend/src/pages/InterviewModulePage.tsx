import React, { useState } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Award, 
  Clock, 
  Users, 
  ShieldCheck, 
  BrainCircuit, 
  MessageSquare,
  FileCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Card, Button } from '../components/ui/PremiumComponents';
import { useApp } from '../context/AppContext';

interface InterviewSession {
  id: string;
  candidateName: string;
  role: string;
  date: string;
  status: 'Completed' | 'In Progress' | 'Scheduled';
  score: number;
  speechClarity: number;
  technicalAccuracy: number;
  sentiment: string;
  summary: string;
}

const SESSIONS: InterviewSession[] = [
  {
    id: 'int-101',
    candidateName: 'Ananya Iyer',
    role: 'Full Stack Engineer Intern',
    date: 'Today, 10:30 AM',
    status: 'Completed',
    score: 88,
    speechClarity: 92,
    technicalAccuracy: 86,
    sentiment: 'Confident & Structured',
    summary: 'Candidate demonstrated deep understanding of distributed transactions, event-driven architectures, and React performance hooks.'
  },
  {
    id: 'int-102',
    candidateName: 'Rohan Das',
    role: 'AI / ML Engineer Intern',
    date: 'Today, 09:15 AM',
    status: 'Completed',
    score: 92,
    speechClarity: 95,
    technicalAccuracy: 94,
    sentiment: 'Analytical & Precise',
    summary: 'Exceptional answers on transformer attention mechanisms, token embeddings, and vector database indexing.'
  },
  {
    id: 'int-103',
    candidateName: 'Arjun Patel',
    role: 'Backend Systems Intern',
    date: 'Yesterday, 04:00 PM',
    status: 'Completed',
    score: 84,
    speechClarity: 88,
    technicalAccuracy: 82,
    sentiment: 'Calm & Thoughtful',
    summary: 'Solid grasp of PostgreSQL query plans, Redis caching policies, and HTTP/2 multiplexing.'
  }
];

export const InterviewModulePage: React.FC = () => {
  const { addToast } = useApp();
  const [selectedSession, setSelectedSession] = useState<InterviewSession>(SESSIONS[0]);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(true);

  const handleSimulateNewQuestion = () => {
    addToast('AI Question prompt dispatched to candidate audio stream.', 'info');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Module Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">AI Video Interviewer & Speech Evaluator</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Live AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Real-time conversational voice synthesis, facial attention tracking, and automated question evaluation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSimulateNewQuestion}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prompt Next Question</span>
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Active Session & Metrics */}
          <div className="lg:col-span-8 space-y-4">
            {/* Simulated Live Video Stage */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative aspect-video flex flex-col justify-between p-6">
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-medium text-slate-200">{selectedSession.candidateName} • Session Active</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs text-indigo-300 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>14:28 / 30:00</span>
                </div>
              </div>

              {/* Center simulated avatar */}
              <div className="flex flex-col items-center justify-center my-auto text-center z-10">
                <div className="w-24 h-24 rounded-full bg-indigo-600/30 border-2 border-indigo-500/50 flex items-center justify-center text-3xl font-bold text-white shadow-2xl mb-3 backdrop-blur-sm">
                  {selectedSession.candidateName.split(' ').map(n => n[0]).join('')}
                </div>
                <p className="text-sm font-semibold text-slate-100">{selectedSession.candidateName}</p>
                <p className="text-xs text-slate-400">{selectedSession.role}</p>
              </div>

              {/* Bottom Real-time AI Audio & Video controls */}
              <div className="flex items-center justify-between z-10 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMicActive(!isMicActive)}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isMicActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isMicActive ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                    <span>{isMicActive ? 'Mic Active' : 'Muted'}</span>
                  </button>

                  <button 
                    onClick={() => setIsVideoActive(!isVideoActive)}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isVideoActive ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isVideoActive ? <Video className="w-4 h-4 text-blue-400" /> : <VideoOff className="w-4 h-4" />}
                    <span>{isVideoActive ? 'Cam Live' : 'Cam Off'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" /> AI Speech: 96%
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <BrainCircuit className="w-3.5 h-3.5" /> Sentiment: Stable
                  </span>
                </div>
              </div>
            </div>

            {/* AI Real-time Transcript & Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-600" />
                  <span>AI Comprehensive Assessment Summary</span>
                </h3>
                <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Overall Score: {selectedSession.score}/100
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {selectedSession.summary}
              </p>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Speech Clarity</span>
                  <div className="text-lg font-bold text-slate-800 font-mono mt-1">{selectedSession.speechClarity}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Technical Accuracy</span>
                  <div className="text-lg font-bold text-slate-800 font-mono mt-1">{selectedSession.technicalAccuracy}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[11px] text-slate-500 font-medium">Interview Sentiment</span>
                  <div className="text-xs font-bold text-indigo-600 mt-2 truncate">{selectedSession.sentiment}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Candidate Sessions List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Audits</span>
                <span className="text-xs font-semibold text-slate-600 font-mono">{SESSIONS.length} Recorded</span>
              </div>

              <div className="space-y-3">
                {SESSIONS.map((sess) => {
                  const isSelected = selectedSession.id === sess.id;
                  return (
                    <div
                      key={sess.id}
                      onClick={() => setSelectedSession(sess)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50/60 border-indigo-200 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{sess.candidateName}</h4>
                          <p className="text-[11px] text-slate-500">{sess.role}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                          {sess.score}/100
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>{sess.date}</span>
                        <span className="text-emerald-600 font-medium font-mono">{sess.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
