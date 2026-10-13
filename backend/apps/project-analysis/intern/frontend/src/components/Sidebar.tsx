import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Code2, 
  Video, 
  LogOut, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck,
  Briefcase,
  MoreVertical,
  User
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, setRole } = useApp();

  const currentPath = window.location.pathname || location.pathname;

  const handleLogout = () => {
    setRole('none');
    localStorage.removeItem('role');
    localStorage.removeItem('thozhil_admin_token');
    localStorage.removeItem('thozhil_intern_identity');
    window.location.href = '/';
  };

  const navItems = role === 'authority' ? [
    {
      id: 'dashboard',
      label: 'Dashboard / Project Analyser',
      icon: LayoutDashboard,
      path: '/authority',
      matchPrefixes: ['/authority', '/project-analysis', '/dashboard']
    },
    {
      id: 'interns',
      label: 'Intern Details',
      icon: Users,
      path: '/interns',
      matchPrefixes: ['/interns']
    },
    {
      id: 'resume',
      label: 'AI Resume Screener',
      icon: FileText,
      path: '/resume-module',
      matchPrefixes: ['/resume-module', '/resume']
    },
    {
      id: 'coding',
      label: 'AI Coding Interviewer',
      icon: Code2,
      path: '/coding-module',
      matchPrefixes: ['/coding-module', '/coding']
    },
    {
      id: 'interview',
      label: 'AI Video Interviewer',
      icon: Video,
      path: '/interview-module',
      matchPrefixes: ['/interview-module', '/interview']
    }
  ] : [
    {
      id: 'dashboard',
      label: 'Intern Project Dashboard',
      icon: LayoutDashboard,
      path: '/intern',
      matchPrefixes: ['/intern', '/project-analysis']
    },
    {
      id: 'interns',
      label: 'My Intern Profile',
      icon: Users,
      path: '/interns',
      matchPrefixes: ['/interns']
    }
  ];

  const isItemActive = (prefixes: string[]) => {
    return prefixes.some(prefix => currentPath === prefix || currentPath.startsWith(prefix));
  };

  const handleNavigate = (targetPath: string) => {
    navigate(targetPath);
  };

  return (
    <aside className="w-64 bg-[#0B1C30] text-slate-100 flex flex-col h-screen border-r border-slate-800/80 shrink-0 select-none z-30">
      {/* ── Brand Header ── */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight">
              Thozhil
            </h1>
            <p className="text-[11px] text-slate-400">Career & Assessment Platform</p>
          </div>
        </div>
      </div>

      {/* ── Active User Profile Badge with 3-Dots ── */}
      <div className="mx-4 my-4 relative">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 text-xs font-bold">
              {role === 'authority' ? 'M' : role === 'intern' ? 'I' : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate capitalize">
                {role === 'authority' ? 'Manager Panel' : role === 'intern' ? 'Intern Space' : 'Authenticated User'}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Session Active
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Dot Dropdown Menu */}
        {showMenu && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 text-xs">
            <button
              onClick={() => {
                setShowMenu(false);
                navigate('/interns');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Intern Directory</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                navigate(role === 'authority' ? '/intern' : '/authority');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              <span>Switch to {role === 'authority' ? 'Intern Workspace' : 'Manager Panel'}</span>
            </button>
            <div className="my-1 border-t border-slate-800" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main Navigation Items ── */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Platform Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.matchPrefixes);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${active ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`} />
            </button>
          );
        })}
      </nav>

      {/* ── Footer / Logout ── */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Lock Shell</span>
        </button>
      </div>
    </aside>
  );
};
