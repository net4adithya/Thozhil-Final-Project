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
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';

export const Login = () => {
  const { login, loading: authLoading, authError, isAuthenticated } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('recruiter'); // 'recruiter' | 'candidate'
  const [showPassword, setShowPassword] = useState(false);
  const from = location.state?.from?.pathname || (activeTab === 'recruiter' ? '/recruiter' : '/candidate');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: 'recruiter@interviewx.local',
      password: 'password',
      role: 'Recruiter Admin'
    }
  });

  // If already authenticated and visiting /login directly, redirect to destination
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const setDemoCredentials = (email, role) => {
    setValue('email', email);
    setValue('password', 'password');
    if (role) setValue('role', role);
  };

  const onSubmit = async (data) => {
    try {
      await login({
        email: data.email,
        password: data.password,
        role: activeTab === 'recruiter' ? (data.role || 'Recruiter Admin') : 'Candidate'
      });
      showToast('Welcome back to InterviewX', 'primary');
      navigate(from, { replace: true });
    } catch (err) {
      showToast(err.message || 'Sign in failed. Please check your credentials.', 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans select-none relative overflow-hidden">
      {/* Top Header */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200 bg-white relative z-10">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            IX
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900">
            INTERVIEW<span className="text-blue-600">X</span>
          </span>
        </Link>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xs p-6 sm:p-8 space-y-6 text-left">
          
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center space-x-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <span>Technical Assessment Platform</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to InterviewX
            </h1>
            <p className="text-xs text-slate-500">
              Select your role to access your dedicated portal
            </p>
          </div>

          {/* Role Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('recruiter');
                setDemoCredentials('recruiter@interviewx.local', 'Recruiter Admin');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'recruiter'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recruiter Workspace</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('candidate');
                setDemoCredentials('candidate@interviewx.local', 'Candidate');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'candidate'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Candidate Portal</span>
            </button>
          </div>

          {/* Quick Demo Credentials helper */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <span>⚡ Demo credentials:</span>
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Click to pre-fill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeTab === 'recruiter' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('recruiter@interviewx.local', 'Recruiter Admin')}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 rounded-lg font-medium shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95"
                  >
                    Recruiter Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('manager@interviewx.local', 'Recruiter Lead')}
                    className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 rounded-lg font-medium shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95"
                  >
                    Hiring Manager
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setDemoCredentials('candidate@interviewx.local', 'Candidate')}
                  className="px-2.5 py-1 text-[11px] bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 text-slate-700 rounded-lg font-medium shadow-2xs hover:shadow-xs transition-all duration-150 active:scale-95"
                >
                  Candidate Demo
                </button>
              )}
            </div>
          </div>

          {/* Error Message if any */}
          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  {...register('email', { required: 'Work email is required' })}
                  placeholder={activeTab === 'recruiter' ? 'recruiter@company.com' : 'candidate@email.com'}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>
              {errors.email && (
                <span className="text-[11px] text-red-600 font-medium">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Password
                </label>
                <span className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'recruiter' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Workspace Role
                </label>
                <select
                  {...register('role')}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="Recruiter Admin">Recruiter Admin</option>
                  <option value="Recruiter Lead">Recruiter Lead</option>
                  <option value="Technical Interviewer">Technical Interviewer</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={authLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs mt-2 flex items-center justify-center space-x-1.5"
            >
              <span>{activeTab === 'recruiter' ? 'Sign in to Workspace' : 'Enter Assessment Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        © 2026 InterviewX. All rights reserved. • Enterprise Recruitment Infrastructure
      </footer>
    </div>
  );
};

export default Login;
