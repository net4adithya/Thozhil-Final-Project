import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Video,
  FileCheck2,
  Code2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Server,
  Zap,
  Users,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useThozhilAuth } from '../context/ThozhilAuthContext';
import { Button } from '../components/ui/Button';

export const ThozhilEmployerPlatform = () => {
  const { user } = useThozhilAuth();
  const navigate = useNavigate();

  const modules = [
    {
      id: 'm1',
      badge: 'MODULE 1 • LOGLENSE',
      title: 'LogLense Code Review & Log Management',
      folder: 'main/intern',
      desc: 'Automated first-level code audits against sprint deliverables. Generates line-level constructive reviews, technical scores, and TTS speech feedback.',
      route: '/employer/loglense',
      standaloneUrl: 'http://localhost:3000',
      portLabel: 'Port 3000 • Express + AI Service',
      status: 'Online',
      statusColor: 'emerald',
      icon: FileText,
      themeColor: 'blue',
      features: ['Sprint deliverables matching', 'Automated code feedback & score', 'TTS Voice explanation summary']
    },
    {
      id: 'm2',
      badge: 'MODULE 2 • INTERVIEWX AI',
      title: 'InterviewX AI Video & Voice Platform',
      folder: 'project-a',
      desc: 'Autonomous technical video & conversational voice interviews with real-time Sarvam AI audio processing, proctoring events, and candidate scorecards.',
      route: '/employer/interviewx',
      standaloneUrl: 'http://localhost:5000',
      portLabel: 'Port 5000 • Express + WebSocket',
      status: 'Online',
      statusColor: 'emerald',
      icon: Video,
      themeColor: 'indigo',
      features: ['Real-time Sarvam AI voice loop', 'Proctoring & tab-switch tracker', 'Comprehensive candidate dossiers']
    },
    {
      id: 'm3',
      badge: 'MODULE 3 • RESUME SCREENER',
      title: 'Thozhil AI Resume Screener',
      folder: 'project-b',
      desc: 'Multi-dimensional resume parser and candidate ranking engine. Matches candidates against job specs with semantic skill analysis and PDF report exports.',
      route: '/employer/resume-screener',
      standaloneUrl: 'http://localhost:8000',
      portLabel: 'Port 8000 • FastAPI Background Worker',
      status: 'Online',
      statusColor: 'emerald',
      icon: FileCheck2,
      themeColor: 'emerald',
      features: ['PDF/DOCX batch parsing', 'Weighted qualification scoring', 'Downloadable candidate evaluation PDFs']
    },
    {
      id: 'm4',
      badge: 'MODULE 4 • CODING ASSESSMENTS',
      title: 'AI Coding Assessment & Sandboxed IDE',
      folder: 'project-d',
      desc: 'Interactive Monaco code workspace with hardened Docker container execution. Evaluates multi-language algorithms with memory and runtime quotas.',
      route: '/employer/coding-assessments',
      standaloneUrl: 'http://localhost:5173/employer/coding-assessments',
      portLabel: 'Sandbox Engine • Docker Isolated',
      status: 'Active',
      statusColor: 'emerald',
      icon: Code2,
      themeColor: 'amber',
      features: ['Monaco IDE multi-language editor', 'Isolated Docker sandbox execution', 'Hidden & visible test suites']
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-left">
      {/* Platform Welcome Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Thozhil Unified Employer Platform</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Employer Command Center & Module Launcher
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Welcome back, <strong className="text-slate-800">{user?.name || 'Administrator'}</strong>. Select any of the four production modules below to manage hiring pipelines, conduct evaluations, or screen candidates.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employer/resume-screener')}
            className="w-full sm:w-auto"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            Quick Screen Resumes
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/employer/interviewx')}
            className="w-full sm:w-auto"
          >
            <Video className="w-4 h-4 mr-1.5" />
            Launch Assessments
          </Button>
        </div>
      </div>

      {/* Module Launcher Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Integrated Product Modules
            </h2>
            <p className="text-xs text-slate-500">
              Four specialized engineering recruitment and assessment products running on unified authentication
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            4 / 4 Online
          </span>
        </div>

        {/* 4-Module Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-400/50 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Strip */}
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-mono border border-blue-100">
                      {mod.badge}
                    </span>

                    {/* Live Microservice Port Badge */}
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{mod.portLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  {/* Key Capabilities */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Core Functionality:
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {mod.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center text-xs text-slate-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mr-2 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <a
                    href={mod.standaloneUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    title="Launch original standalone project port in new tab"
                  >
                    <span>Launch Standalone ({mod.portLabel.split('•')[0].trim()})</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </a>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(mod.route)}
                    className="shadow-xs"
                  >
                    <span>Open Module Inside Thozhil</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
