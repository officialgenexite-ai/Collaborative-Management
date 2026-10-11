import axiosInstance from '../../api/axiosInstance';

export const register = (payload) => axiosInstance.post('/auth/register', payload);

export const verifyOtp = (payload) => axiosInstance.post('/auth/verify-otp', payload);

export const login = (email, password) =>
  axiosInstance.post('/auth/login', { email, password });

export const googleLoginUrl = () => {
  const base = axiosInstance.defaults.baseURL;
  return `${base}/auth/google`;
};

// No /auth/refresh or /auth/logout on this backend — the JWT is stateless
// and long-lived (30 days), so there's nothing for the server to do on
// logout. Session lifecycle is handled entirely in AuthContext via localStorage.
