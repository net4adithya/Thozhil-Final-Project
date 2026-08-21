import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Video,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  Bell,
  Briefcase,
  HelpCircle,
  GraduationCap,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FolderLock
} from 'lucide-react';

const HyringLogo = ({ className = "h-8 w-auto text-primary" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 137 46" className={className}>
    <path fill="currentColor" d="M37.71 35V9.42h4.264v10.445a6.47 6.47 0 0 1 2.416-2.31q1.527-.887 3.446-.887 2.203 0 3.73.923 1.529.888 2.31 2.665.816 1.74.817 4.37V35h-4.228v-9.983q0-2.31-.995-3.518-.96-1.207-2.949-1.207-1.278 0-2.309.639-1.03.604-1.634 1.776-.604 1.137-.604 2.807V35zm21.668 7.816 4.37-9.806h-1.066L55.54 17.095h4.654l5.33 12.15 5.044-12.15h4.512L63.89 42.816zM76.745 35V17.094h3.802l.39 3.34a7 7 0 0 1 1.6-1.99 6.8 6.8 0 0 1 2.238-1.314q1.314-.462 2.877-.462v4.512H86.16q-1.065 0-2.025.284-.96.249-1.67.853-.675.567-1.065 1.598-.391.995-.391 2.523V35zm12.878 0V17.094h4.263V35zm2.131-20.748q-1.171 0-1.954-.71a2.47 2.47 0 0 1-.746-1.813q.001-1.101.746-1.776.783-.71 1.954-.71 1.173 0 1.919.71.782.675.782 1.776 0 1.066-.782 1.812-.746.71-1.919.71M97.393 35V17.094h3.766l.32 2.984a6.23 6.23 0 0 1 2.344-2.487q1.529-.924 3.624-.923 2.168 0 3.695.923 1.528.888 2.345 2.63.853 1.74.853 4.334V35h-4.264V24.946q0-2.239-.994-3.447-.996-1.207-2.949-1.207-1.28 0-2.31.603-.995.604-1.598 1.777-.569 1.136-.569 2.771V35zm27.552 8.243q-2.522 0-4.441-.64-1.882-.604-2.949-1.883-1.03-1.243-1.03-3.126 0-1.102.533-2.168.569-1.03 1.67-1.918 1.137-.924 2.878-1.599l1.883 2.06q-1.706.605-2.381 1.457-.675.854-.675 1.741 0 .924.569 1.528.603.639 1.598.96 1.03.319 2.31.319 1.243 0 2.167-.355.924-.32 1.421-.924.533-.604.533-1.457 0-1.065-.746-1.74-.745-.64-2.949-.782a34 34 0 0 1-3.304-.391 19 19 0 0 1-2.451-.64 9.6 9.6 0 0 1-1.706-.781 7.3 7.3 0 0 1-1.172-.924v-.817l3.73-3.908 3.162 1.03-4.192 4.086 1.101-2.06q.356.248.711.461.39.214.959.391.605.143 1.563.284.96.143 2.487.285 2.38.177 3.873.852 1.492.675 2.203 1.812t.71 2.736q0 1.563-.888 2.949-.853 1.385-2.629 2.273-1.776.89-4.548.889m0-13.608q-2.238 0-3.872-.852-1.599-.889-2.452-2.345a6.5 6.5 0 0 1-.852-3.269q0-1.812.852-3.268.853-1.457 2.452-2.345 1.634-.888 3.872-.888t3.837.888 2.452 2.345q.852 1.455.852 3.268a6.5 6.5 0 0 1-.852 3.269q-.853 1.456-2.452 2.345-1.599.852-3.837.852m0-3.304q1.528 0 2.452-.817t.923-2.345q0-1.527-.923-2.31-.924-.816-2.452-.816-1.527 0-2.487.817-.959.78-.959 2.31 0 1.527.959 2.344.96.817 2.487.817m2.949-6.11-.817-3.127h7.354v2.665zM9.057 7.7c.866 0 1.567.7 1.567 1.564v10.82a15.83 15.83 0 0 1 4.684-7.62c1.908-1.655 3.948-2.789 6.279-3.53l3.706-1.177c.664-.21 1.354.26 1.354.93v8.45c0 .424-.287.8-.706.93l-5.211 1.637c3.275.633 5.915 3.495 5.915 7.153v7.862a1.6 1.6 0 0 1-1.601 1.598H17.62a1.6 1.6 0 0 1-1.601-1.598V23.947a15.83 15.83 0 0 1-4.681 7.61c-1.909 1.655-3.948 2.79-6.278 3.53l-3.71 1.178c-.664.213-1.35-.26-1.35-.93v-8.45c0-.425.285-.8.704-.93l5.22-1.642C2.647 23.684 0 20.821 0 17.16V9.264c0-.865.701-1.565 1.567-1.565z" />
  </svg>
);

import { useApp } from '../../context/AppContext';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem } from '../ui/Dropdown';

export const DashboardLayout = ({ children }) => {
  const { settings, toasts, dismissToast } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { name: 'Dashboard', path: '/recruiter', icon: LayoutDashboard },
    { name: 'Candidates', path: '/recruiter/candidates', icon: Users },
    { name: 'Interviews', path: '/recruiter/interviews', icon: Video },
    { name: 'Templates', path: '/recruiter/templates', icon: FileSpreadsheet },
    { name: 'Question Bank', path: '/recruiter/questions', icon: FolderLock },
    { name: 'Analytics', path: '/recruiter/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/recruiter/settings', icon: Settings },
  ];

  const handleLogout = () => {
    // Navigate back to landing
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-brandBg flex font-sans">
      {/* Toast Alert Pane Overlay */}
      <div className="fixed top-5 right-5 z-55 flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg cursor-pointer transform transition-all duration-300 flex items-start space-x-3 bg-white ${
              toast.type === 'success'
                ? 'border-brandSuccess/30 text-brandSuccess shadow-green-500/5'
                : toast.type === 'danger'
                ? 'border-brandDanger/30 text-brandDanger shadow-red-500/5'
                : toast.type === 'warning'
                ? 'border-brandWarning/30 text-brandWarning shadow-amber-500/5'
                : 'border-primary/30 text-primary shadow-blue-500/5'
            }`}
          >
            <div className="flex-1 text-sm font-semibold">{toast.message}</div>
            <button className="text-gray-400 hover:text-gray-600 focus:outline-none text-xs leading-none">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-brandBorder transition-all duration-350 ease-in-out shrink-0 relative ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header / Brand Logo */}
        <div className="h-16 flex items-center px-5 border-b border-brandBorder justify-between">
          <Link to="/recruiter" className="flex items-center space-x-2 text-primary hover:opacity-90">
            <HyringLogo className="h-6 w-auto text-primary" />
            {!sidebarCollapsed && (
              <span className="font-bold text-sm text-brandHeading tracking-tight">
                Recruiter <span className="text-primary text-[8px] uppercase font-bold bg-primary/10 px-1 py-0.5 rounded ml-0.5 select-none">Portal</span>
              </span>
            )}
          </Link>
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-4.5 -right-3.5 bg-white border border-brandBorder rounded-full p-1 shadow-sm text-brandBody hover:text-brandHeading z-10 hidden md:block"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 px-3.5 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/recruiter' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive: linkActive }) =>
                  `flex items-center space-x-3.5 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-brandBody hover:text-brandHeading hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-brandBody'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-brandBorder bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Avatar name={settings.recruiterName || 'Recruiter'} size="sm" status="online" />
              {!sidebarCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-semibold text-brandHeading truncate">
                    {settings.recruiterName || 'Recruiter'}
                  </span>
                  <span className="text-[10px] text-brandBody truncate">
                    {settings.companyName || 'Platform'}
                  </span>
                </div>
              )}
            </div>
            
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="text-brandBody hover:text-brandDanger p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Slide-out Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar drawer content */}
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white border-r border-brandBorder pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-3.5">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex flex-shrink-0 items-center px-4 space-x-2 text-primary">
                <HyringLogo className="h-6 w-auto text-primary" />
                <span className="text-sm font-bold text-brandHeading tracking-tight">
                  Recruiter <span className="text-primary text-[8px] uppercase font-bold bg-primary/10 px-1 py-0.5 rounded ml-0.5 select-none">Portal</span>
                </span>
              </div>

              <div className="mt-6 h-0 flex-1 overflow-y-auto px-2.5">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== '/recruiter' && location.pathname.startsWith(item.path));
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-brandBody hover:text-brandHeading hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-brandBody'}`} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-shrink-0 border-t border-brandBorder bg-gray-50/50 p-4 justify-between items-center">
                <div className="flex items-center space-x-3">
                  <Avatar name={settings.recruiterName} size="sm" status="online" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-brandHeading">{settings.recruiterName}</span>
                    <span className="text-[10px] text-brandBody">{settings.companyName}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-brandBody hover:text-brandDanger p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Body Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar Header */}
        <header className="h-16 bg-white border-b border-brandBorder flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-brandBody hover:text-brandHeading focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden sm:block">
              <span className="text-xs font-semibold tracking-wider text-brandBody uppercase">Workspace</span>
              <h2 className="text-sm font-bold text-brandHeading select-none">{settings.companyName || 'Enterprise'}</h2>
            </div>
          </div>

          {/* Quick Actions & Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <Link
              to="/candidate"
              className="text-xs font-semibold text-primary hover:text-primary-dark px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20 transition-all hover:bg-primary/10 flex items-center space-x-1"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Candidate View</span>
            </Link>

            <button className="text-brandBody hover:text-brandHeading p-1.5 rounded-lg transition-colors hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-brandDanger ring-2 ring-white" />
            </button>

            <hr className="h-6 w-px bg-brandBorder" />

            {/* Recruiter Profile Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center space-x-2 focus:outline-none hover:opacity-85 transition-opacity">
                  <Avatar name={settings.recruiterName} size="sm" />
                </button>
              }
            >
              <div className="px-4 py-2 border-b border-brandBorder">
                <p className="text-xs text-brandBody">Signed in as</p>
                <p className="text-xs font-semibold text-brandHeading truncate">{settings.recruiterEmail}</p>
              </div>
              <DropdownItem onClick={() => navigate('/recruiter/settings')}>
                <Settings className="w-4 h-4 text-brandBody" />
                <span>Account Settings</span>
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/candidate')}>
                <GraduationCap className="w-4 h-4 text-brandBody" />
                <span>Simulate Candidate</span>
              </DropdownItem>
              <DropdownItem danger onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
};
