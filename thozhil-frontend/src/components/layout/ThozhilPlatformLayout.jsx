import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  FileCheck2,
  Video,
  Code2,
  FileText,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
  Menu,
  X,
  Layers,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { useThozhilAuth } from '../../context/ThozhilAuthContext';
import { useApp } from '../../context/AppContext';

export const ThozhilPlatformLayout = ({ children, targetRole = 'employer' }) => {
  const { user, logout } = useThozhilAuth();
  const { toasts, dismissToast, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moduleSwitcherOpen, setModuleSwitcherOpen] = useState(false);

  const isEmployer = targetRole === 'employer';
  const basePath = isEmployer ? '/employer' : '/candidate';

  const modulesList = isEmployer
    ? [
        {
          id: 'm1',
          name: 'LogLense Code Review',
          path: '/employer/loglense',
          icon: FileText,
          badge: 'Module 1',
          port: '3000',
          desc: 'Automated sprint log audit & line-level review'
        },
        {
          id: 'm2',
          name: 'InterviewX AI Platform',
          path: '/employer/interviewx',
          icon: Video,
          badge: 'Module 2',
          port: '5000',
          desc: 'Conversational voice & video interviews'
        },
        {
          id: 'm3',
          name: 'AI Resume Screener',
          path: '/employer/resume-screener',
          icon: FileCheck2,
          badge: 'Module 3',
          port: '8000',
          desc: 'Multi-factor resume parsing & ranking'
        },
        {
          id: 'm4',
          name: 'AI Coding Assessments',
          path: '/employer/coding-assessments',
          icon: Code2,
          badge: 'Module 4',
          port: 'Sandbox',
          desc: 'Monaco IDE & isolated Docker runner'
        }
      ]
    : [
        {
          id: 'm1',
          name: 'LogLense Work Log',
          path: '/candidate/loglense',
          icon: FileText,
          badge: 'Module 1',
          port: '3000',
          desc: 'Submit daily deliverables for instant review'
        },
        {
          id: 'm2',
          name: 'InterviewX Voice Room',
          path: '/candidate/interviewx',
          icon: Video,
          badge: 'Module 2',
          port: '5000',
          desc: 'Complete live adaptive voice & video interview'
        },
        {
          id: 'm3',
          name: 'Resume Fit Analysis',
          path: '/candidate/resume-check',
          icon: FileCheck2,
          badge: 'Module 3',
          port: '8000',
          desc: 'Upload resume & view match against roles'
        },
        {
          id: 'm4',
          name: 'Coding Challenge IDE',
          path: '/candidate/coding-workspace',
          icon: Code2,
          badge: 'Module 4',
          port: 'Sandbox',
          desc: 'Solve technical problems in Monaco workspace'
        }
      ];

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out of THOZHIL platform.', 'primary');
      navigate('/login', { replace: true });
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden select-none">
      {/* Toast Alert Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className="pointer-events-auto p-3.5 rounded-xl border border-slate-200 bg-white shadow-xl cursor-pointer flex items-center justify-between space-x-3 text-xs font-semibold text-slate-800"
          >
            <span>{toast.message}</span>
            <button className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </div>
        ))}
      </div>

      {/* THOZHIL Unified Sidebar */}
      <aside className="hidden md:flex flex-col border-r border-slate-800/80 bg-[#070D18] text-slate-200 w-64 shrink-0 z-20">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link to={basePath} className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
              TZ
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-sm tracking-tight text-white leading-tight">
                THOZHIL
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {isEmployer ? 'Employer Platform' : 'Candidate Platform'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Hub */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1.5">
              Platform Hub
            </span>
            <NavLink
              to={basePath}
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Module Launcher</span>
            </NavLink>
          </div>

          {/* Four Product Modules */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Product Modules
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                4 Active
              </span>
            </div>

            <div className="space-y-1">
              {modulesList.map((mod) => {
                const Icon = mod.icon;
                return (
                  <NavLink
                    key={mod.id}
                    to={mod.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{mod.name}</span>
                    </div>
                    <span className="text-[9px] font-mono opacity-70 px-1 py-0.5 rounded bg-slate-800/80 group-hover:bg-slate-700/80">
                      {mod.badge}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Identity & Session Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-[#050A14]/60">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Thozhil User'}</div>
                <div className="text-[10px] text-slate-400 capitalize">{user?.role || targetRole}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sign out of THOZHIL"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Operational Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          {/* Left: Module Breadcrumb */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-500 hover:text-slate-800 p-1"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link
              to={basePath}
              className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <span>THOZHIL</span>
              <span>/</span>
            </Link>

            <span className="text-xs font-bold text-slate-900 capitalize">
              {isEmployer ? 'Employer Platform' : 'Candidate Platform'}
            </span>
          </div>

          {/* Right: Quick Microservice Status & Role Switcher */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Unified Session: Active</span>
            </div>

            <Link
              to={isEmployer ? '/candidate' : '/employer'}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Switch to {isEmployer ? 'Candidate' : 'Employer'}</span>
            </Link>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};
