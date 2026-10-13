import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 120000, // 120 seconds timeout to allow full Sarvam AI processing without premature client aborts
});

// Request interceptor to attach authoritative identity and session headers
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Allow browser and Axios to automatically set multipart/form-data boundary for FormData
      if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        if (config.headers) {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }

      const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('interviewx_auth_session') : null;
      const storedCandId = typeof window !== 'undefined' ? sessionStorage.getItem('interviewx_active_candidate_id') : null;

      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
        if (session.user) {
          if (session.user.role) config.headers['X-User-Role'] = session.user.role;
          if (session.user.email) config.headers['X-User-Email'] = session.user.email;
          if (session.user.id) config.headers['X-User-Id'] = session.user.id;
          if (session.user.candidateId) config.headers['X-Candidate-Id'] = session.user.candidateId;
        }
      }

      if (!config.headers['X-Candidate-Id'] && storedCandId) {
        config.headers['X-Candidate-Id'] = storedCandId;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message;
    const message =
      serverMessage ||
      (error.message === 'Network Error'
        ? 'Cannot connect to backend service. Please verify the server is running.'
        : error.message || 'An unexpected network error occurred');
    const enrichedError = new Error(message);
    enrichedError.response = error.response;
    enrichedError.status = error.response?.status;
    return Promise.reject(enrichedError);
  }
);

export default apiClient;
