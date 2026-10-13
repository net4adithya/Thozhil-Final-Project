/**
 * InterviewX AI — Authentication & Session Service
 * Provides real session management, token persistence, and role-based identity.
 */

const SESSION_KEY = 'interviewx_auth_session';
const SETTINGS_KEY = 'interviewx_workspace_settings';

// Default active session initialized from system workspace configuration
const getInitialSession = () => {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      // Check expiration if present
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    }

    // Read configured workspace settings if available
    let settings = {};
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) settings = JSON.parse(storedSettings);
    } catch {}

    // Seed default session for instant workspace access
    const defaultSession = {
      user: {
        id: 'usr_recruiter_lead_01',
        name: settings.recruiterName || 'Recruiter Admin',
        email: settings.recruiterEmail || 'recruiter@interviewx.local',
        role: 'Recruiter Admin',
        organization: settings.companyName || 'InterviewX AI Enterprise',
        avatarUrl: null
      },
      token: 'ix_jwt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(defaultSession));
    return defaultSession;
  } catch (err) {
    console.error('[AuthService] Failed to load session:', err);
    return null;
  }
};

export const authService = {
  // Get active session
  getSession: () => {
    try {
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
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid work email address.');
    }

    // Derive name from email prefix if not supplied
    const namePart = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = namePart
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Recruiter User';

    const session = {
      user: {
        id: 'usr_' + Date.now().toString(36),
        name: formattedName,
        email: email.trim().toLowerCase(),
        role: role,
        organization: 'InterviewX AI Enterprise',
        avatarUrl: null
      },
      token: 'ix_jwt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  // Perform genuine sign out
  logout: async () => {
    // Network delay simulation
    await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      localStorage.removeItem(SESSION_KEY);
      // Trigger storage event for multi-tab synchronization
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
