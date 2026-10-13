import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => authService.getInitialSession());
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const user = session?.user || null;
  const isAuthenticated = !!user;

  // Sync session changes across multiple browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'interviewx_auth_session' || e.type === 'interviewx:logout') {
        const currentSession = authService.getSession();
        setSession(currentSession);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('interviewx:logout', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('interviewx:logout', handleStorageChange);
    };
  }, []);

  // Login handler
  const login = useCallback(async ({ email, password, role }) => {
    try {
      setLoading(true);
      setAuthError(null);
      const newSession = await authService.login({ email, password, role });
      setSession(newSession);
      return newSession;
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await authService.logout();
      setSession(null);
      return true;
    } catch (err) {
      setAuthError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setSession((prev) => prev ? { ...prev, user: updatedUser } : null);
      return updatedUser;
    } catch (err) {
      console.error('[AuthContext] Update profile error:', err);
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated,
        loading,
        authError,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
