import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assessmentsService } from '../../services/assessments';

export function Login() {
  const [mode, setMode] = useState<'authority' | 'candidate'>('authority');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else {
        if (email.includes('admin') || email.includes('authority')) {
          navigate('/authority/dashboard');
        } else {
          navigate('/intern/interview/overview');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await assessmentsService.enterAccessCode(accessCode.trim().toUpperCase());
      navigate('/intern/interview/overview');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid access code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-main min-h-screen flex flex-col items-center justify-center p-md sm:p-xl w-full">
      <main className="w-full max-w-[440px] bg-surface-container-lowest border border-outline-variant rounded-lg p-xl flex flex-col gap-lg shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
        {/* Mode Selector Tabs */}
        <div className="flex bg-surface-container rounded p-[4px]">
          <button
            type="button"
            onClick={() => { setMode('authority'); setError(null); }}
            className={`flex-1 py-xs text-navigation font-navigation rounded text-center transition-colors cursor-pointer ${
              mode === 'authority' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Authority Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('candidate'); setError(null); }}
            className={`flex-1 py-xs text-navigation font-navigation rounded text-center transition-colors cursor-pointer ${
              mode === 'candidate' ? 'bg-white text-primary shadow-sm font-semibold' : 'text-secondary hover:text-on-surface'
            }`}
          >
            Intern Access Code
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-xs">
          <h1 className="font-page-title text-page-title text-on-surface m-0">
            {mode === 'authority' ? 'Authority Portal' : 'Enter Assessment'}
          </h1>
          <p className="font-body-main text-body-main text-secondary m-0">
            {mode === 'authority' 
              ? 'Sign in to manage question banks, assessments and reviews.' 
              : 'Enter your 6-character access code from your recruiter.'}
          </p>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="bg-error-container text-on-error-container p-sm rounded text-metadata text-center font-medium">
            {error}
          </div>
        )}

        {/* Form: Authority Sign In */}
        {mode === 'authority' ? (
          <form className="flex flex-col gap-md" onSubmit={handleLogin}>
            <div className="flex flex-col gap-xs">
              <label className="font-navigation text-navigation text-on-surface" htmlFor="email">Email</label>
              <input 
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-main text-body-main placeholder:text-secondary-fixed-dim" 
                id="email" 
                placeholder="admin@thozhil.org" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center">
                <label className="font-navigation text-navigation text-on-surface" htmlFor="password">Password</label>
              </div>
              <div className="relative w-full">
                <input 
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-main text-body-main placeholder:text-secondary-fixed-dim pr-[40px]" 
                  id="password" 
                  placeholder="Enter password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  aria-label="Toggle password visibility" 
                  className="absolute right-sm top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors flex items-center justify-center p-1" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <button 
              className="w-full bg-primary-container text-on-primary font-navigation text-navigation rounded px-md py-[10px] mt-xs hover:bg-primary transition-colors cursor-pointer border border-transparent disabled:opacity-50 font-bold" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in as Authority'}
            </button>
          </form>
        ) : (
          /* Form: Intern Access Code */
          <form className="flex flex-col gap-md" onSubmit={handleCandidateAccess}>
            <div className="flex flex-col gap-xs">
              <label className="font-navigation text-navigation text-on-surface text-center" htmlFor="access-code">6-Character Access Code</label>
              <input 
                className="w-full text-center text-2xl tracking-widest font-mono py-md px-lg border border-outline-variant rounded focus:border-primary focus:ring-2 focus:ring-primary uppercase outline-none bg-surface" 
                id="access-code" 
                maxLength={6}
                placeholder="A3F9X1" 
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button 
              className="w-full bg-primary-container text-on-primary font-navigation text-navigation rounded px-md py-[10px] mt-xs hover:bg-primary transition-colors cursor-pointer border border-transparent disabled:opacity-50 font-bold" 
              type="submit"
              disabled={loading || accessCode.length < 6}
            >
              {loading ? 'Validating...' : 'Start Assessment'}
            </button>
          </form>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-xl font-metadata text-metadata text-secondary text-center">
        © 2026 Thozhil
      </footer>
    </div>
  );
}
