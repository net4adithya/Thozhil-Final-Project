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
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const { login, loading: authLoading, authError, isAuthenticated } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'candidate'
  const [showPassword, setShowPassword] = useState(false);
  const from = location.state?.from?.pathname || (activeTab === 'admin' ? '/employer' : '/candidate');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: 'admin@thozhil.local',
      password: 'password',
      role: 'Recruiter Admin'
    }
  });

  // If already authenticated and visiting /login directly, redirect to destination
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'admin') {
      setValue('email', 'admin@thozhil.local');
      setValue('password', 'password');
      setValue('role', 'Recruiter Admin');
    } else {
      setValue('email', 'candidate@thozhil.local');
      setValue('password', 'password');
      setValue('role', 'Candidate');
    }
  };

  const handleQuickLogin = async (roleType) => {
    try {
      const email = roleType === 'admin' ? 'admin@thozhil.local' : 'candidate@thozhil.local';
      const role = roleType === 'admin' ? 'Recruiter Admin' : 'Candidate';
      const dest = roleType === 'admin' ? '/employer' : '/candidate';

      await login({
        email,
        password: 'password',
        role
      });
      showToast(`Logged in successfully as ${roleType === 'admin' ? 'Admin / Employer' : 'Candidate / Intern'}!`, 'success');
      navigate(dest, { replace: true });
    } catch (err) {
      showToast(err.message || 'Quick login failed.', 'danger');
    }
  };

  const onSubmit = async (data) => {
    try {
      await login({
        email: data.email,
        password: data.password,
        role: activeTab === 'admin' ? (data.role || 'Recruiter Admin') : 'Candidate'
      });
      showToast('Welcome to THOZHIL Unified Platform', 'primary');
      navigate(activeTab === 'admin' ? '/employer' : '/candidate', { replace: true });
    } catch (err) {
      showToast(err.message || 'Sign in failed. Please check your credentials.', 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col justify-between font-sans select-none relative overflow-hidden">
      {/* Background Ambient Glow FX */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-blue-600/20 via-sky-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[450px] h-[350px] bg-indigo-600/15 blur-[100px] pointer-events-none rounded-full" />

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
          <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Microservices Live</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-xl bg-[#0F172A]/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>One Login • Four Product Modules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to THOZHIL
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select your role to access the unified platform and its integrated microservices.
            </p>
          </div>

          {/* Dual Role Selector Cards */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/80 rounded-xl border border-slate-800">
            {/* Admin / Employer Option */}
            <button
              type="button"
              onClick={() => handleTabSwitch('admin')}
              className={`p-3.5 rounded-lg text-left transition-all relative flex flex-col justify-between ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Briefcase className={`w-5 h-5 ${activeTab === 'admin' ? 'text-white' : 'text-slate-400'}`} />
                {activeTab === 'admin' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Admin / Employer</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'admin' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Recruiter & Authority Hub
                </div>
              </div>
            </button>

            {/* Candidate / Intern Option */}
            <button
              type="button"
              onClick={() => handleTabSwitch('candidate')}
              className={`p-3.5 rounded-lg text-left transition-all relative flex flex-col justify-between ${
                activeTab === 'candidate'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <GraduationCap className={`w-5 h-5 ${activeTab === 'candidate' ? 'text-white' : 'text-slate-400'}`} />
                {activeTab === 'candidate' && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">Candidate / Intern</div>
                <div className={`text-[10px] mt-0.5 ${activeTab === 'candidate' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Interviews & Assessment Hub
                </div>
              </div>
            </button>
          </div>

          {/* Quick 1-Click Instant Login Button */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] font-bold text-blue-300 block">Instant Access Mode</span>
              <span className="text-[10px] text-slate-400">
                Log in as {activeTab === 'admin' ? 'Admin / Employer' : 'Candidate / Intern'} with 1 click
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleQuickLogin(activeTab)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Quick Login ⚡</span>
            </button>
          </div>

          {/* Standard Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {activeTab === 'admin' ? 'Employer / Admin Email' : 'Candidate Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  {...register('email', { required: 'Email address is required' })}
                  placeholder={activeTab === 'admin' ? 'admin@thozhil.local' : 'candidate@thozhil.local'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={authLoading}
              className="w-full justify-center mt-2 shadow-lg shadow-blue-600/30"
            >
              {authLoading ? 'Signing in...' : `Enter ${activeTab === 'admin' ? 'Admin Platform' : 'Candidate Platform'}`}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Bottom Module Connectivity Badges */}
          <div className="pt-4 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block text-center mb-2.5">
              Available Modules in This Session
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-medium text-slate-400">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">LogLense</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">InterviewX</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Resume Screener</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Coding Sandbox</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 bg-[#070D18] relative z-10">
        THOZHIL Enterprise Recruitment Platform • Unified Architecture
      </footer>
    </div>
  );
};
