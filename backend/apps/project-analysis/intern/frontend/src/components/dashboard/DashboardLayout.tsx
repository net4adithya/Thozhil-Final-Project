import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  History, 
  LogOut, 
  Moon, 
  Sun, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Code2, 
  Video, 
  UserCheck, 
  Sparkles,
  ChevronRight,
  FolderKanban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import logoImage from '../../../assets/thozhill-removebg.webp';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { role, setRole, theme, setTheme, projects, selectedProjectId, setSelectedProjectId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setRole('none');
    window.location.href = '/';
  };

  const navItems = role === 'authority' ? [
    {
      name: 'Authority Panel',
      icon: <LayoutDashboard size={16} />,
      path: '/authority'
    },
    {
      name: 'Log History',
      icon: <History size={16} />,
      path: '/history'
    },
    {
      name: 'Intern Details',
      icon: <Users size={16} />,
      path: '/interns'
    },
    {
      divider: 'PLATFORM MODULES'
    },
    {
      name: 'AI Resume Screener',
      icon: <FileText size={16} />,
      path: '/resume-module'
    },
    {
      name: 'AI Coding Interviewer',
      icon: <Code2 size={16} />,
      path: '/coding-module'
    },
    {
      name: 'AI Video Interviewer',
      icon: <Video size={16} />,
      path: '/interview-module'
    }
  ] : [
    {
      name: 'Intern Dashboard',
      icon: <LayoutDashboard size={16} />,
      path: '/intern'
    },
    {
      name: 'Log History',
      icon: <History size={16} />,
      path: '/history'
    },
    {
      name: 'My Intern Profile',
      icon: <Users size={16} />,
      path: '/interns'
    },
    {
      divider: 'PLATFORM MODULES'
    },
    {
      name: 'AI Resume Screener',
      icon: <FileText size={16} />,
      path: '/resume-module'
    },
    {
      name: 'AI Coding Assessment',
      icon: <Code2 size={16} />,
      path: '/coding-candidate-module'
    },
    {
      name: 'AI Video Interview',
      icon: <Video size={16} />,
      path: '/interview-candidate-module'
    }
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const userInitials = role === 'authority' ? 'SJ' : 'SK';
  const userName = role === 'authority' ? 'Sarah Jenkins' : 'Sanjay Kumar';
  const roleName = role === 'authority' ? 'MANAGER' : 'INTERN';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-bgDark text-textPrimary-light dark:text-textPrimary-dark flex flex-col md:flex-row transition-colors duration-200 font-sans">

      {/* ── Authentic Thozhil Sidebar ── */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-borderDark bg-white dark:bg-cardDark shrink-0 flex flex-col z-20 shadow-sm">

        {/* Brand Header with Specific Module Badge */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-borderDark">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoImage} alt="Thozhil Logo" className="h-8 w-auto object-contain" />
          </Link>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
            Project Module
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3.5 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            if ('divider' in item && item.divider) {
              return (
                <div key={`div-${idx}`} className="pt-4 pb-1.5 px-3">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {item.divider}
                  </span>
                </div>
              );
            }

            const navItem = item as { name: string; icon: React.ReactNode; path: string };
            const isActive = location.pathname === navItem.path || 
              (navItem.path === '/authority' && location.pathname === '/project-analysis') ||
              (navItem.path === '/intern' && location.pathname === '/project-analysis');

            return (
              <button
                key={navItem.name}
                onClick={() => navigate(navItem.path)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-150 group
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600'}>
                    {navItem.icon}
                  </span>
                  <span>{navItem.name}</span>
                </div>
                <ChevronRight className={`w-3 h-3 transition-opacity ${isActive ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-40 text-slate-400'}`} />
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-borderDark space-y-2 bg-slate-50/50 dark:bg-cardDark">
          {/* User card */}
          <div className="px-3 py-2 flex items-center gap-2.5 rounded-xl bg-white dark:bg-bgDark border border-slate-200/80 dark:border-borderDark shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {userInitials}
            </div>
            <div className="truncate min-w-0 flex-1">
              <div className="text-xs font-bold truncate text-slate-900 dark:text-textPrimary-dark">
                {userName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                  role === 'authority' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {roleName}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors text-xs font-semibold gap-2 text-slate-600 shadow-2xs"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/80 dark:border-borderDark bg-white dark:bg-cardDark sticky top-0 z-10 px-6 flex items-center justify-between shrink-0 shadow-xs">
          {/* Left: Project Selector */}
          <div className="flex items-center gap-3">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                navigate(role === 'authority' ? '/authority' : '/intern');
              }}
              className="bg-slate-50 dark:bg-bgDark border border-slate-200 dark:border-borderDark rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-textPrimary-dark focus:outline-none transition-all cursor-pointer shadow-2xs"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.code} — {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextRole = role === 'authority' ? 'intern' : 'authority';
                setRole(nextRole);
                navigate(nextRole === 'authority' ? '/authority' : '/intern');
              }}
              className="flex items-center gap-2 px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-xs text-slate-700 dark:text-slate-300 font-medium border border-slate-200/60 transition-colors cursor-pointer"
              title="Click to switch between Authority and Intern role"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Role: <strong className="capitalize text-slate-900 dark:text-white">{role}</strong> <span className="text-[10px] text-blue-500 font-normal ml-0.5">(Switch)</span></span>
            </button>

            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 transition-colors"
              title="Toggle Appearance"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-6 md:p-8 flex-1 max-w-[1400px] w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
