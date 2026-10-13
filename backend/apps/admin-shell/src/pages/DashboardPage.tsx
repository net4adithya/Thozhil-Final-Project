import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Video, 
  FolderKanban, 
  Code, 
  Users, 
  ShieldCheck, 
  Activity, 
  Layers,
  ArrowRight,
  Sparkles
} from '../components/Icons';

export const DashboardPage: React.FC = () => {
  const modules = [
    {
      title: 'AI Resume Screener',
      project: 'Project B',
      path: '/resume',
      port: 5020,
      tech: 'Vanilla JS / FastAPI / SQLite',
      icon: FileText,
      color: 'from-blue-600 to-cyan-500',
      description: 'PDF/DOCX batch resume parsing, local TF-IDF & Gemini screening, dynamic ReportLab PDF generator.'
    },
    {
      title: 'AI Video Interviewer',
      project: 'Project A',
      path: '/interview',
      port: 5011,
      tech: 'React 19 / Express ESM / WebSockets / Sarvam AI',
      icon: Video,
      color: 'from-indigo-600 to-purple-600',
      description: 'Real-time WebSocket audio/video interview loop, Sarvam AI STT/TTS, video proctoring event logger.'
    },
    {
      title: 'AI Project Analyser',
      project: 'Project C (LogLense)',
      path: '/project-analysis',
      port: 5032,
      tech: 'React 19 TS / Express / FastAPI / Supabase',
      icon: FolderKanban,
      color: 'from-purple-600 to-pink-600',
      description: 'Intern daily work log review, code attachment AI evaluation, multi-LLM provider review cards, TTS feedback.'
    },
    {
      title: 'AI Coding Interviewer',
      project: 'Project D',
      path: '/coding',
      port: 5041,
      tech: 'Vue 3 / React 18 / NestJS / FastAPI / Docker / Prisma',
      icon: Code,
      color: 'from-emerald-600 to-teal-600',
      description: 'Monaco IDE coding workspace, 12-language AST static analysis, question banks, candidate access codes.'
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-950">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 mb-8 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Thozhil Platform Orchestration Shell
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">
          Enterprise Talent & Assessment Shell Dashboard
        </h1>
        
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          Welcome to the unified Thozhil Admin Shell. All four standalone applications remain 100% functionally intact and independently runnable. Select any module from the sidebar or grid below to mount its interface in the same browser tab.
        </p>

        <div className="mt-6 flex items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 pt-4 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin Auth: <strong className="text-slate-200">Active Session</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Monorepo Mode: <strong className="text-slate-200">Nx Task Orchestrator</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Applications Registered: <strong className="text-slate-200">4 Modules</strong></span>
          </div>
        </div>
      </div>

      {/* Module Launch Grid */}
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-1">
        Orchestrated Applications
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.path} className="glass-card p-6 rounded-xl border border-slate-800 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Port {mod.port}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {mod.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">({mod.project})</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {mod.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {mod.tech}
                </span>

                <NavLink
                  to={mod.path}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-colors shadow-md"
                >
                  <span>Mount Module</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
              </div>
            </div>
          );
        })}
      </div>

      {/* Intern Details Quick Access Card */}
      <div className="glass-panel p-6 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Intern Details Directory</h3>
            <p className="text-xs text-slate-400">View candidate and intern assessment records across all modules.</p>
          </div>
        </div>

        <NavLink
          to="/interns"
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-2"
        >
          <span>Open Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>
    </div>
  );
};
