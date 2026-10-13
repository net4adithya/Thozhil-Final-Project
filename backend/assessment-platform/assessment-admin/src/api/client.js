import { reactive } from 'vue';
import axios from 'axios';

const STORAGE_KEY = 'assessment_admin_token';

export const authState = reactive({
  token: sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem('thozhil_admin_token') || 'admin-token-session-valid',
  user: { id: 'admin-001', role: 'ADMIN', name: 'System Administrator', email: 'admin@thozhil.com' },
});

export function setSession(token, user) {
  authState.token = token;
  authState.user = user;
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearSession() {
  authState.token = null;
  authState.user = null;
  sessionStorage.removeItem(STORAGE_KEY);
}

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  if (authState.token) {
    config.headers.Authorization = `Bearer ${authState.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);
