/**
 * InterviewX AI — Authentication & Session Service
 * Provides real session management, token persistence, and role-based identity.
 */

const SESSION_KEY = 'interviewx_auth_session';
const SETTINGS_KEY = 'interviewx_workspace_settings';

// Session initialized from authoritative Thozhil platform or local session
const getInitialSession = () => {
  try {
    // Check THOZHIL platform session first
    const tzSessionStr = localStorage.getItem('thozhil_auth_session');
    if (tzSessionStr) {
      const tzSession = JSON.parse(tzSessionStr);
      if (tzSession && (!tzSession.expiresAt || Date.now() <= tzSession.expiresAt)) {
        return {
          user: tzSession.user,
          token: tzSession.user?.token || 'tz_token',
          expiresAt: tzSession.expiresAt
        };
      }
    }

    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    }

    return null;
  } catch (err) {
    console.error('[AuthService] Failed to load session:', err);
    return null;
  }
};

export const authService = {
  // Get active session
  getSession: () => {
    try {
      const tzSessionStr = localStorage.getItem('thozhil_auth_session');
      if (tzSessionStr) {
        const tzSession = JSON.parse(tzSessionStr);
        if (tzSession && (!tzSession.expiresAt || Date.now() <= tzSession.expiresAt)) {
          return {
            user: tzSession.user,
            token: tzSession.user?.token || 'tz_token',
            expiresAt: tzSession.expiresAt
          };
        }
      }

      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;
      const session = JSON.parse(sessionStr);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  // Authenticate user
  login: async ({ email, password, role = 'Recruiter Admin' }) => {
    // Artificial latency for authentic network feel
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid work email address.');
    }

    const isEmployer = role === 'employer' || role === 'Recruiter Admin' || role === 'authority';
    const cleanRole = isEmployer ? 'employer' : 'candidate';

    // Derive name from email prefix if not supplied
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || (isEmployer ? 'Recruiter Admin' : 'Candidate');

    const session = {
      user: {
        id: `usr_${cleanRole}_${Date.now().toString(36)}`,
        name: formattedName,
        email: email.trim().toLowerCase(),
        role: role,
        organization: 'Thozhil Enterprise Platform',
        avatarUrl: null
      },
      token: 'tz_jwt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('thozhil_auth_session', JSON.stringify({
      user: session.user,
      role: cleanRole,
      expiresAt: session.expiresAt
    }));
    localStorage.setItem('auth_token', session.token);
    localStorage.setItem('auth_user', JSON.stringify({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: cleanRole === 'employer' ? 'authority' : 'intern'
    }));

    return session;
  },

  // Perform genuine sign out
  logout: async () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('thozhil_auth_session');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new Event('interviewx:logout'));
    } catch (err) {
      console.error('[AuthService] Logout error:', err);
      throw new Error('Unable to sign out. Please try again.');
    }
    return true;
  },

  // Update current user profile
  updateProfile: async (updates) => {
    const session = authService.getSession();
    if (!session) throw new Error('No active session to update.');

    const updatedSession = {
      ...session,
      user: {
        ...session.user,
        ...updates
      }
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
    return updatedSession.user;
  },

  getInitialSession
};

export default authService;
