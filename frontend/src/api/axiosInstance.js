import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

let onAuthError = null; // callback registered by AuthContext to force logout on 401

export function setAuthToken(token) {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
}

export function registerAuthErrorHandler(handler) {
  onAuthError = handler;
}

// ============================================
// ALGORITHM: 401 handling
// This backend issues a single long-lived (30-day) token with no
// refresh/rotation endpoint. So a 401 here means the token is genuinely
// invalid, expired, or tampered with — the only correct response is an
// immediate, clean logout, not a retry-with-refresh loop.
// ============================================
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onAuthError) {
      onAuthError();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
