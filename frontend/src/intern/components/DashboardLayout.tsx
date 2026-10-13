import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  FileCheck2,
  FolderKanban,
  Building2,
  Briefcase,
  MoreVertical,
  User,
  Settings
} from 'lucide-react';
import { useApp } from '../context/InternContext';
import { useAuth } from '../../context/AuthContext';
import { useThozhilAuth } from '../../context/ThozhilAuthContext';
import logoImage from '../../assets/thozhill-removebg.webp';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  name: string;
  path: string;
  icon?: React.ReactNode;
}

interface ProductModule {
  id: string;
  name: string;
  badge?: string;
  icon: React.ReactNode;
  defaultPath: string;
  matchPrefixes: string[];
  subItems: SubMenuItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { role, setRole, theme, setTheme, projects, selectedProjectId, setSelectedProjectId } = useApp();
  const { user: authUser, logout: authLogout } = useAuth();
  const { logout: tzLogout } = useThozhilAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active path
  const currentPath = location.pathname;
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Track expanded accordion state for product modules
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
    const isResume = currentPath.includes('resume');
    const isCoding = currentPath.includes('coding');
    const isInterview = currentPath.includes('/recruiter') || (currentPath.startsWith('/candidate') && !currentPath.includes('resume') && !currentPath.includes('coding'));
    
    return {
      loglense: !isResume && !isCoding && !isInterview,
      resume: isResume,
      interview: isInterview,
      coding: isCoding
    };
  });

  // Ensure active route's module is expanded when path changes
  useEffect(() => {
    if (currentPath.includes('resume')) {
      setExpandedModules(prev => ({ ...prev, resume: true }));
    } else if (currentPath.includes('coding')) {
      setExpandedModules(prev => ({ ...prev, coding: true }));
    } else if (currentPath.includes('/recruiter') || (currentPath.startsWith('/candidate') && !currentPath.includes('resume') && !currentPath.includes('coding'))) {
      setExpandedModules(prev => ({ ...prev, interview: true }));
    } else {
      setExpandedModules(prev => ({ ...prev, loglense: true }));
    }
  }, [currentPath]);

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if (authLogout) await authLogout();
      if (tzLogout) await tzLogout();
    } catch (_) {}
    setRole('none');
    window.location.href = '/';
  };

  // 4 Core Product Modules Definitions with Authentic Submenus
  const productModules: ProductModule[] = role === 'authority' ? [
    {
      id: 'loglense',
      name: 'LogLense',
      badge: 'Main Portal',
      icon: <FileText size={16} />,
      defaultPath: '/authority',
      matchPrefixes: ['/authority', '/project-analysis', '/history', '/interns'],
      subItems: [
        { name: 'Authority Panel', path: '/authority', icon: <LayoutDashboard size={14} /> },
        { name: 'Log History', path: '/history', icon: <History size={14} /> },
        { name: 'Intern Details', path: '/interns', icon: <Users size={14} /> }
      ]
    },
    {
      id: 'resume',
      name: 'AI Resume Screener',
      icon: <FileCheck2 size={16} />,
      defaultPath: '/recruiter/resume-screener',
      matchPrefixes: ['/recruiter/resume-screener', '/resume'],
      subItems: [
        { name: 'Resume Screening Hub', path: '/recruiter/resume-screener', icon: <FileCheck2 size={14} /> }
      ]
    },
    {
      id: 'interview',
      name: 'AI Video Interviewer',
      icon: <Video size={16} />,
      defaultPath: '/recruiter/interviews',
      matchPrefixes: ['/recruiter'],
      subItems: [
        { name: 'Interviews List', path: '/recruiter/interviews', icon: <Video size={14} /> },
        { name: 'Create Assessment', path: '/recruiter/interviews/new', icon: <Sparkles size={14} /> },
        { name: 'Candidates Pool', path: '/recruiter/candidates', icon: <Users size={14} /> },
        { name: 'Question Library', path: '/recruiter/questions', icon: <FolderKanban size={14} /> },
        { name: 'Templates', path: '/recruiter/templates', icon: <FileText size={14} /> },
        { name: 'Analytics', path: '/recruiter/analytics', icon: <Sparkles size={14} /> },
        { name: 'Command Center', path: '/recruiter', icon: <LayoutDashboard size={14} /> }
      ]
    },
    {
      id: 'coding',
      name: 'AI Coding Interviewer',
      icon: <Code2 size={16} />,
      defaultPath: '/recruiter/coding-assessments',
      matchPrefixes: ['/recruiter/coding-assessments', '/coding'],
      subItems: [
        { name: 'Coding Assessments', path: '/recruiter/coding-assessments', icon: <Code2 size={14} /> }
      ]
    }
  ] : [
    {
      id: 'loglense',
      name: 'LogLense',
      badge: 'Main Portal',
      icon: <FileText size={16} />,
      defaultPath: '/intern',
      matchPrefixes: ['/intern', '/project-analysis', '/history', '/interns'],
      subItems: [
        { name: 'Intern Dashboard', path: '/intern', icon: <LayoutDashboard size={14} /> },
        { name: 'Log History', path: '/history', icon: <History size={14} /> },
        { name: 'My Intern Profile', path: '/interns', icon: <Users size={14} /> }
      ]
    },
    {
      id: 'resume',
      name: 'AI Resume Screener',
      icon: <FileCheck2 size={16} />,
      defaultPath: '/candidate/resume-check',
      matchPrefixes: ['/candidate/resume-check', '/resume'],
      subItems: [
        { name: 'Resume Fit Analysis', path: '/candidate/resume-check', icon: <FileCheck2 size={14} /> }
      ]
    },
    {
      id: 'interview',
      name: 'AI Video Interviewer',
      icon: <Video size={16} />,
      defaultPath: '/candidate',
      matchPrefixes: ['/candidate'],
      subItems: [
        { name: 'My Assessments', path: '/candidate', icon: <Video size={14} /> },
        { name: 'Practice Sandbox', path: '/candidate/practice', icon: <Sparkles size={14} /> },
        { name: 'Hardware & Device Check', path: '/candidate/device-check', icon: <UserCheck size={14} /> }
      ]
    },
    {
      id: 'coding',
      name: 'AI Coding Interviewer',
      icon: <Code2 size={16} />,
      defaultPath: '/candidate/coding-workspace',
      matchPrefixes: ['/candidate/coding-workspace', '/coding'],
      subItems: [
        { name: 'Coding Workspace', path: '/candidate/coding-workspace', icon: <Code2 size={14} /> }
      ]
    }
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const userInitials = authUser?.name
    ? authUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : (role === 'authority' ? 'SJ' : 'SK');
    
  const userName = authUser?.name || (role === 'authority' ? 'Sarah Jenkins' : 'Sanjay Kumar');
  const roleName = role === 'authority' ? 'EMPLOYER / MANAGER' : 'CANDIDATE / INTERN';

  const isLogLenseActive = currentPath === '/authority' || currentPath === '/intern' || currentPath === '/history' || currentPath.startsWith('/interns') || currentPath === '/project-analysis';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-bgDark text-textPrimary-light dark:text-textPrimary-dark flex flex-col md:flex-row transition-colors duration-200 font-sans">

      {/* ── Authentic Thozhil Shared Sidebar ── */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-borderDark bg-white dark:bg-cardDark shrink-0 flex flex-col z-20 shadow-sm">

        {/* Brand Header with LogLense Portal Indicator */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-borderDark">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logoImage} alt="Thozhil Logo" className="h-8 w-auto object-contain" />
          </Link>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
            LogLense Portal
          </span>
        </div>

        {/* Section Label */}
        <div className="pt-3 px-4 pb-1">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            PRODUCT AREAS
          </span>
        </div>

        {/* Expandable Module Navigation */}
        <nav className="p-3 flex-1 space-y-1.5 overflow-y-auto">
          {productModules.map((module) => {
            const isModuleOpen = !!expandedModules[module.id];
            const isAnySubActive = module.subItems.some(sub => currentPath === sub.path || (sub.path !== '/recruiter' && currentPath.startsWith(sub.path)));
            const isModuleActive = isAnySubActive || module.matchPrefixes.some(prefix => currentPath === prefix || currentPath.startsWith(prefix));

            return (
              <div key={module.id} className="space-y-1">
                {/* Product Area Header Button */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 cursor-pointer
                    ${isModuleActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isModuleActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}>
                      {module.icon}
                    </span>
                    <span className="tracking-tight">{module.name}</span>
                    {module.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300 rounded">
                        {module.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    {isModuleOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>

                {/* Expandable Submenu Items */}
                {isModuleOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-blue-100 dark:border-blue-900/50 ml-4 animate-in fade-in duration-200">
                    {module.subItems.map((sub) => {
                      const isSubActive = currentPath === sub.path || (sub.path === '/authority' && currentPath === '/project-analysis') || (sub.path === '/intern' && currentPath === '/project-analysis');

                      return (
                        <button
                          key={sub.name}
                          type="button"
                          onClick={() => navigate(sub.path)}
                          className={`
                            w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left
                            ${isSubActive
                              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={isSubActive ? 'text-white' : 'text-slate-400'}>
                              {sub.icon}
                            </span>
                            <span className="truncate">{sub.name}</span>
                          </div>
                          {isSubActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white ml-1 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-borderDark space-y-2 bg-slate-50/50 dark:bg-cardDark">
          {/* User card with 3-dot slidebar menu */}
          <div className="relative">
            <div className="px-3 py-2 flex items-center justify-between gap-2.5 rounded-xl bg-white dark:bg-bgDark border border-slate-200/80 dark:border-borderDark shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {userInitials}
              </div>
              <div className="truncate min-w-0 flex-1">
                <div className="text-xs font-bold truncate text-slate-900 dark:text-textPrimary-dark">
                  {userName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded ${
                    role === 'authority' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {roleName}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
              </div>
              {/* Three Dot Action Button */}
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Account Options"
              >
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Three Dot Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-white dark:bg-cardDark border border-slate-200 dark:border-borderDark rounded-xl shadow-xl z-50 text-xs animate-in fade-in duration-150">
                <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-borderDark text-[11px] text-slate-500 font-medium truncate">
                  {authUser?.email || (role === 'authority' ? 'manager@thozhil.com' : 'intern@thozhil.com')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/interns');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <User size={13} className="text-blue-500" />
                  <span>View Profile & Directory</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate(role === 'authority' ? '/intern' : '/authority');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <Briefcase size={13} className="text-indigo-500" />
                  <span>Switch to {role === 'authority' ? 'Candidate Space' : 'Authority Hub'}</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-borderDark" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors text-xs font-semibold gap-2 text-slate-600 shadow-2xs cursor-pointer"
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
          {/* Left: Project Selector (when on LogLense) or Module Breadcrumb */}
          <div className="flex items-center gap-3">
            {isLogLenseActive ? (
              <>
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
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">LogLense Orchestrator</span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white capitalize">
                  {currentPath.includes('resume') ? 'AI Resume Screener' : currentPath.includes('coding') ? 'AI Coding Interviewer' : 'AI Video Interviewer'}
                </span>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
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
              type="button"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 transition-colors cursor-pointer"
              title="Toggle Appearance"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-6 md:p-8 flex-1 w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

