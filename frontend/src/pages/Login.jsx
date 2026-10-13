import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Briefcase,
  GraduationCap,
  Code2,
  FileCheck2,
  Video,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useThozhilAuth } from '../context/ThozhilAuthContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import logoImage from '../assets/thozhill-removebg.webp';

import { useApp as useInternApp } from '../intern/context/InternContext';

export const Login = () => {
  const { login, loading: authLoading, authError, isAuthenticated } = useAuth();
  const { login: thozhilLogin } = useThozhilAuth();
  const { showToast } = useApp();
  const { setRole: setInternRole } = useInternApp();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedRole = location.state?.defaultTab || location.state?.role || (location.state?.from?.pathname?.includes('candidate') || location.state?.from?.pathname?.includes('intern') ? 'candidate' : 'admin');
  const [activeTab, setActiveTab] = useState(requestedRole); // 'admin' | 'candidate'
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: requestedRole === 'admin' ? 'admin@thozhil.com' : 'candidate@thozhil.com',
      password: 'password',
      role: requestedRole === 'admin' ? 'Recruiter Admin' : 'Candidate'
    }
  });

  // Handle URL role changes or tab requests
  React.useEffect(() => {
    if (location.state?.defaultTab) {
      handleTabSwitch(location.state.defaultTab);
    }
  }, [location.state?.defaultTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'admin') {
      setValue('email', 'admin@thozhil.com');
      setValue('password', 'password');
      setValue('role', 'Recruiter Admin');
    } else {
      setValue('email', 'candidate@thozhil.com');
      setValue('password', 'password');
      setValue('role', 'Candidate');
    }
  };

  const handleQuickLogin = async (roleType) => {
    try {
      const email = roleType === 'admin' ? 'admin@thozhil.local' : 'candidate@thozhil.local';
      const role = roleType === 'admin' ? 'Recruiter Admin' : 'Candidate';
      const defaultLogLenseDest = roleType === 'admin' ? '/authority' : '/intern';
      const dest = (location.state?.from?.pathname && location.state.from.pathname !== '/login' && location.state.from.pathname !== '/')
        ? location.state.from.pathname
        : defaultLogLenseDest;

      await login({
        email,
        password: 'password',
        role
      });
      await thozhilLogin({
        email,
        password: 'password',
        role: roleType === 'admin' ? 'employer' : 'candidate'
      });
      
      const internRole = roleType === 'admin' ? 'authority' : 'intern';
      try {
        localStorage.setItem('role', internRole);
        if (setInternRole) setInternRole(internRole);
      } catch (_) {}

      showToast(`Welcome to LogLense — ${roleType === 'admin' ? 'Employer Authority Portal' : 'Candidate Workspace'}!`, 'success');
      navigate(dest, { replace: true });
    } catch (err) {
      showToast(err.message || 'Quick login failed.', 'danger');
    }
  };

  const onSubmit = async (data) => {
    try {
      const role = activeTab === 'admin' ? (data.role || 'Recruiter Admin') : 'Candidate';
      const defaultLogLenseDest = activeTab === 'admin' ? '/authority' : '/intern';
      const dest = (location.state?.from?.pathname && location.state.from.pathname !== '/login' && location.state.from.pathname !== '/')
        ? location.state.from.pathname
        : defaultLogLenseDest;

      await login({
        email: data.email,
        password: data.password,
        role
      });
      await thozhilLogin({
        email: data.email,
        password: data.password,
        role: activeTab === 'admin' ? 'employer' : 'candidate'
      });

      const internRole = activeTab === 'admin' ? 'authority' : 'intern';
      try {
        localStorage.setItem('role', internRole);
        if (setInternRole) setInternRole(internRole);
      } catch (_) {}

      showToast(`Welcome to LogLense Portal`, 'primary');
      navigate(dest, { replace: true });
    } catch (err) {
      showToast(err.message || 'Sign in failed. Please check your credentials.', 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between font-sans select-none relative overflow-x-hidden">
      {/* Subtle Ambient Gradient & Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-blue-100/40 via-sky-50/20 to-transparent blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logoImage} alt="Thozhil Logo" className="h-8 w-auto object-contain" />
          <span className="text-[11px] font-bold text-[#1D78F8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
            Unified Platform
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200 font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>4 Microservices Live</span>
          </div>
          <Link
            to="/"
            className="text-xs font-semibold text-slate-600 hover:text-[#1D78F8] transition-colors flex items-center gap-1"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 py-6 sm:py-8">
        <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-5">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>One Login • Four Integrated Modules</span>
            </div>
            <h1 className="text-2xl sm:text-2xl font-black text-[#0B1C30] tracking-tight">
              Sign in to Thozhil
            </h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
              Select your role to access the unified platform and its integrated microservices.
            </p>
          </div>

          {/* Dual Role Selector Cards */}
          <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200/90">
            {/* Admin / Employer Option */}
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`p-3 rounded-lg text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-[#0B1C30] shadow-sm border-2 border-[#1D78F8] ring-3 ring-blue-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${activeTab === 'admin' ? 'bg-blue-50 text-[#1D78F8]' : 'bg-slate-200/70 text-slate-600'}`}>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                {activeTab === 'admin' && (
                  <span className="w-2 h-2 rounded-full bg-[#1D78F8]" />
                )}
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm leading-tight text-slate-900">Admin / Employer</div>
                <div className="text-[10px] sm:text-[11px] mt-0.5 text-slate-500 font-medium">
                  Recruiter & Authority Hub
                </div>
              </div>
            </button>

            {/* Candidate / Intern Option */}
            <button
              type="button"
              onClick={() => handleTabSwitch('candidate')}
              className={`p-3 rounded-lg text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                activeTab === 'candidate'
                  ? 'bg-white text-[#0B1C30] shadow-sm border-2 border-[#1D78F8] ring-3 ring-blue-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${activeTab === 'candidate' ? 'bg-blue-50 text-[#1D78F8]' : 'bg-slate-200/70 text-slate-600'}`}>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                {activeTab === 'candidate' && (
                  <span className="w-2 h-2 rounded-full bg-[#1D78F8]" />
                )}
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm leading-tight text-slate-900">Candidate / Intern</div>
                <div className="text-[10px] sm:text-[11px] mt-0.5 text-slate-500 font-medium">
                  Interviews & Assessment Hub
                </div>
              </div>
            </button>
          </div>

          {/* Standard Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeTab === 'admin' ? 'Employer / Admin Email' : 'Candidate Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required' })}
                  placeholder={activeTab === 'admin' ? 'admin@thozhil.com' : 'candidate@thozhil.com'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all font-mono"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={authLoading}
              className="w-full justify-center mt-1 bg-[#1D78F8] hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-md shadow-blue-500/20 transition-all text-xs cursor-pointer"
            >
              {authLoading ? 'Signing in...' : `Enter ${activeTab === 'admin' ? 'Employer Portal' : 'Candidate Portal'}`}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Bottom Module Connectivity Badges */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center mb-2.5">
              Integrated Product Areas
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-semibold text-slate-600">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">LogLense</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">InterviewX</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Resume Screener</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Coding Sandbox</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white relative z-10">
        THOZHIL Enterprise Recruitment Platform • Unified Architecture
      </footer>
    </div>
  );
};

