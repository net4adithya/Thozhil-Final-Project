import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Video,
  FileText,
  Folder,
  Settings,
  Menu,
  X,
  Plus,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  User,
  AlertTriangle,
  Sparkles,
  Code2,
  FileCheck2,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CommandPalette } from '../common/CommandPalette';

export const DashboardLayout = ({ children }) => {
  const { toasts, dismissToast, showToast } = useApp();
  const { user, logout, loading: authLoading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close account popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real user details from Auth Context
  const userName = user?.name || 'Recruiter Admin';
  const userEmail = user?.email || 'recruiter@interviewx.local';
  const userRole = user?.role || 'Recruiter Admin';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'RA';

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setLogoutModalOpen(false);
      setAccountMenuOpen(false);
      showToast('Returned to InterviewX Home.', 'primary');
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.message || 'Unable to sign out. Please try again.', 'danger');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navGroups = [
    {
      label: 'PRODUCT MODULES',
      items: [
        { name: 'Command Center', path: '/recruiter', icon: LayoutGrid },
        { name: 'AI Resume Screener', path: '/recruiter/resume-screener', icon: FileCheck2 },
        { name: 'AI Video & Voice Interviews', path: '/recruiter/interviews', icon: Video },
        { name: 'AI Coding Assessments', path: '/recruiter/coding-assessments', icon: Code2 },
        { name: 'LogLense: Intern Reviews', path: '/recruiter/intern-logs', icon: FileText },
      ]
    },
    {
      label: 'CANDIDATE MANAGEMENT',
      items: [
        { name: 'Candidates Pool', path: '/recruiter/candidates', icon: Users },
        { name: 'Question Library', path: '/recruiter/questions', icon: Folder },
        { name: 'Templates', path: '/recruiter/templates', icon: Layers },
      ]
    },
    {
      label: 'INSIGHTS & SYSTEM',
      items: [
        { name: 'Analytics', path: '/recruiter/analytics', icon: TrendingUp },
        { name: 'Settings', path: '/recruiter/settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Alert Pane Overlay */}
      <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg cursor-pointer transform transition-all duration-200 flex items-start space-x-3 bg-white ${
              toast.type === 'success'
                ? 'border-emerald-200 text-emerald-950'
                : toast.type === 'danger'
                  ? 'border-red-200 text-red-950'
                  : toast.type === 'warning'
                    ? 'border-amber-200 text-amber-950'
                    : 'border-blue-200 text-blue-950'
            }`}
          >
            <div className="flex-1 text-xs font-semibold">{toast.message}</div>
            <button className="text-slate-400 hover:text-slate-600 focus:outline-none text-xs leading-none">✕</button>
          </div>
        ))}
      </div>

      {/* Desktop Enterprise Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800/80 bg-[#0B1120] text-slate-200 transition-all duration-200 select-none z-20 relative shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand & Workspace Header */}
        <div className="h-14 px-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          {!sidebarCollapsed ? (
            <Link to="/recruiter" className="flex items-center space-x-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:bg-blue-500 transition-colors">
                TZ
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-sm tracking-tight text-white leading-tight">
                  THOZHIL
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  Unified Platform
                </span>
              </div>
            </Link>
          ) : (
            <Link to="/recruiter" className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs mx-auto hover:bg-blue-500 transition-colors">
              TZ
            </Link>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sidebar Grouped Nav Links */}
        <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto scrollbar-none">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              {!sidebarCollapsed && (
                <div className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = item.path === '/recruiter'
                  ? location.pathname === '/recruiter'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={`flex items-center ${
                      sidebarCollapsed ? 'justify-center px-2' : 'px-2.5'
                    } py-2 rounded-lg text-xs transition-colors group relative ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                    }`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} ${!sidebarCollapsed ? 'mr-2.5' : ''}`} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: System Status & User Account */}
        <div className="p-2.5 border-t border-slate-800/80 space-y-2 relative" ref={accountMenuRef}>
          {/* System Status Indicator */}
          <div className="flex items-center space-x-2 px-2 py-1 text-[11px] text-slate-400">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#34d399]" />
            {!sidebarCollapsed && (
              <span className="truncate text-[11px] font-medium text-slate-300">
                Operational
              </span>
            )}
          </div>

          {/* Account Popover Menu */}
          {accountMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#0F172A] border border-slate-700/80 rounded-xl shadow-xl p-1 z-30 text-left divide-y divide-slate-800">
              <div className="p-2.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white truncate">{userName}</span>
                  <span className="text-[10px] font-medium bg-slate-800 text-blue-300 border border-slate-700 px-1.5 py-0.5 rounded">
                    {userRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/recruiter/settings"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center space-x-2 px-2 py-1.5 text-xs text-slate-200 hover:bg-slate-800/70 hover:text-white rounded-lg transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workspace Settings</span>
                </Link>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}

          {/* User Account Trigger Button */}
          <button
            type="button"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className={`w-full flex items-center ${
              sidebarCollapsed ? 'justify-center p-1.5' : 'p-2 justify-between'
            } rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-white transition-colors text-left focus:outline-none`}
            aria-expanded={accountMenuOpen}
            aria-label="User account menu"
          >
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-tight">{userName}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{userRole}</p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navigation Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 select-none z-10">
          {/* Mobile menu trigger + Brand */}
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/recruiter" className="flex items-center space-x-2 text-primary font-bold text-sm">
              <span className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">IX</span>
              <span className="text-slate-900 font-bold">Interview<span className="text-blue-600">X</span></span>
            </Link>
          </div>

          {/* Search / Command Palette Trigger */}
          <div className="hidden md:flex items-center space-x-3 flex-1 max-w-sm">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white rounded-lg px-3 py-1.5 flex items-center justify-between text-xs text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
                <span className="text-xs">Search candidates, tracks, rubrics...</span>
              </div>
              <kbd className="inline-flex items-center space-x-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-500 shadow-2xs">
                <span>⌘K</span>
              </kbd>
            </button>
          </div>

          {/* Right Header CTAs & User Link */}
          <div className="flex items-center space-x-2.5">
            <Link
              to="/candidate"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Candidate Portal</span>
            </Link>

            <Button
              onClick={() => navigate('/recruiter/interviews/new')}
              size="sm"
              variant="primary"
              icon={Plus}
              className="text-xs font-semibold"
            >
              New Assessment
            </Button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Profile Avatar Trigger in Header */}
            <button
              type="button"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
              aria-label="User profile details"
            >
              <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-none">{userName}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{userRole}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer Modal */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 max-w-xs bg-[#0B1120] text-white h-full shadow-2xl flex flex-col p-4 z-10 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">IX</div>
                  <span className="font-bold text-sm text-white">Interview<span className="text-blue-400">X</span></span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-4 overflow-y-auto">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-0.5">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</div>
                    {group.items.map((item) => {
                      const isActive = item.path === '/recruiter'
                        ? location.pathname === '/recruiter'
                        : location.pathname.startsWith(item.path);
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isActive 
                              ? 'bg-blue-600 text-white font-semibold' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <item.icon className="w-4 h-4 text-slate-400" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <Link
                  to="/candidate"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Candidate Portal</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Canvas Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#F8FAFC] focus:outline-none relative">
          <div className="max-w-7xl mx-auto w-full relative z-0">
            {children}
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => !isLoggingOut && setLogoutModalOpen(false)}
        title="Sign out of InterviewX?"
        size="sm"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to return to the InterviewX home portal? You can switch between candidate and employer workspaces at any time.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoggingOut}
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={isLoggingOut}
              onClick={handleConfirmLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
