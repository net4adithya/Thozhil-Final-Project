import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Video,
  FileCheck2,
  Code2,
  Briefcase,
  GraduationCap,
  Layers,
  Zap,
  Lock
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ThozhilLandingPage = () => {
  const navigate = useNavigate();

  const modules = [
    {
      badge: 'Module 1',
      title: 'LogLense Code Audit',
      desc: 'Automated line-level review of code submissions against sprint deliverables with TTS voice synthesis.',
      icon: FileText,
      port: 'Port 3000'
    },
    {
      badge: 'Module 2',
      title: 'InterviewX AI Platform',
      desc: 'Real-time conversational voice and video interviews with Sarvam AI STT/TTS and proctoring telemetry.',
      icon: Video,
      port: 'Port 5000'
    },
    {
      badge: 'Module 3',
      title: 'AI Resume Screener',
      desc: 'Multi-dimensional resume parsing, semantic qualification scoring, gap analysis, and candidate ranking.',
      icon: FileCheck2,
      port: 'Port 8000'
    },
    {
      badge: 'Module 4',
      title: 'AI Coding Sandbox',
      desc: 'Monaco IDE code workspace with hardened Docker container execution and automated unit test verdicts.',
      icon: Code2,
      port: 'Docker Sandbox'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans select-none relative overflow-hidden">
      {/* Background Lighting Gradients */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-600/20 via-sky-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[400px] bg-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md relative z-10">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-all">
            TZ
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-base tracking-tight text-white leading-tight">
              THOZHIL
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Unified Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/login')}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            className="shadow-lg shadow-blue-600/25"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </header>

      {/* Main Hero & Portals */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 md:py-16 flex flex-col justify-center space-y-12 relative z-10 text-center">
        {/* Hero Title */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>One Unified Platform • Four Integrated Modules</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Enterprise Recruitment <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Unified Under THOZHIL
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Consolidated AI Resume Screening, Conversational Voice & Video Interviews, Sandboxed Coding Assessments, and Automated Intern Code Audits in one seamless environment.
          </p>
        </div>

        {/* Dual Portal Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full text-left">
          {/* Card 1: Employer Portal */}
          <div
            onClick={() => navigate('/login')}
            className="bg-[#0F172A]/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-7 shadow-2xl backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full">
                  Employer Gateway
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Employer & Recruiter Platform
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Screen resumes, manage candidate pools, launch voice & video interviews, evaluate coding challenges, and audit intern deliverables.
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Access all 4 product module workspaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Real-time proctoring & evaluation scorecards</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
              <span>Enter Employer Platform</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Candidate Portal */}
          <div
            onClick={() => navigate('/login')}
            className="bg-[#0F172A]/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-7 shadow-2xl backdrop-blur-xl transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full">
                  Candidate Gateway
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Candidate & Intern Platform
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Join scheduled video interviews, take timed coding assessments in the Monaco IDE, and submit daily work logs for AI feedback.
                </p>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Live conversational AI voice dialogue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Hardened Docker sandbox code execution</span>
                </div>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
              <span>Enter Candidate Platform</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* 4 Connected Modules Strip */}
        <div className="pt-8 border-t border-slate-800/80 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Integrated Product Ecosystem
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              4 Microservices Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {modules.map((m, i) => {
              const Icon = m.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-mono text-slate-500">{m.port}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white">{m.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-[#070D18] relative z-10">
        THOZHIL Enterprise Platform • One Login • Four Modules
      </footer>
    </div>
  );
};
