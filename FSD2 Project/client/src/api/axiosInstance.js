import axios from 'axios';

/**
 * Centralised Axios instance for all LMS API calls.
 * The base URL reads from the Vite env variable (falls back to the Vite
 * dev-server proxy path "/api" so it works without any extra config in dev).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* ── Request interceptor: attach JWT from localStorage ──────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response interceptor: normalise error messages ─────────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-clear stale token on 401 – the AuthContext listener will handle redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

export default api;
