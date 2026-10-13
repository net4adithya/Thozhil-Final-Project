import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THOZHIL_SESSION_KEY = 'thozhil_auth_session';

const ThozhilAuthContext = createContext(null);

export const ThozhilAuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem(THOZHIL_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          localStorage.removeItem(THOZHIL_SESSION_KEY);
          return null;
        }
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('[ThozhilAuth] Failed reading initial session:', e);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = session?.user || null;
  const isAuthenticated = !!user;
  const role = user?.role || null; // 'employer' | 'candidate'

  // Synchronize authentication events across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THOZHIL_SESSION_KEY) {
        try {
          const updated = e.newValue ? JSON.parse(e.newValue) : null;
          setSession(updated);
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Platform Login
  const login = useCallback(async ({ email, password, role = 'employer', name }) => {
    setLoading(true);
    setError(null);

    try {
      // Create authoritative Thozhil platform identity
      const isEmployer = role === 'employer' || role === 'Recruiter Admin' || role === 'authority';
      const cleanRole = isEmployer ? 'employer' : 'candidate';
      const displayName = name || (isEmployer ? 'Admin / Hiring Authority' : 'Candidate / Intern');

      const newSession = {
        user: {
          id: `tz_${cleanRole}_${Date.now().toString(36)}`,
          email: email.trim(),
          name: displayName,
          role: cleanRole,
          organization: 'Thozhil Enterprise Platform',
          token: `tz_jwt_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
        },
        role: cleanRole,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24-hour persistent platform session
      };

      localStorage.setItem(THOZHIL_SESSION_KEY, JSON.stringify(newSession));
      // Also write legacy token for child module compatibility
      localStorage.setItem('auth_token', newSession.user.token);
      localStorage.setItem('auth_user', JSON.stringify({
        id: newSession.user.id,
        name: newSession.user.name,
        email: newSession.user.email,
        role: cleanRole === 'employer' ? 'authority' : 'intern'
      }));

      setSession(newSession);
      return newSession;
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Platform Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem(THOZHIL_SESSION_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    session,
    user,
    role,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };

  return (
    <ThozhilAuthContext.Provider value={value}>
      {children}
    </ThozhilAuthContext.Provider>
  );
};

export const useThozhilAuth = () => {
  const context = useContext(ThozhilAuthContext);
  if (!context) {
    return {
      session: null,
      user: null,
      role: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      login: async () => {},
      logout: async () => {}
    };
  }
  return context;
};
