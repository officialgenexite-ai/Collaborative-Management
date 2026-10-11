import { createContext, useState, useEffect, useCallback } from 'react';
import { setAuthToken, registerAuthErrorHandler } from '../api/axiosInstance';
import * as authApi from '../modules/auth/authApi';

const STORAGE_TOKEN_KEY = 'auth_token';
const STORAGE_USER_KEY = 'auth_user';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load: restore session from localStorage.
  // This backend issues one long-lived (30-day) token with no
  // refresh/rotation endpoint, so localStorage persistence is the
  // correct strategy here — not a workaround for a missing feature.
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_USER_KEY);

    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          setUser(null);
        }
      }
    }
    setLoading(false);
  }, []);

  // If any API call ever comes back 401 (token invalid, expired, or
  // tampered with), axiosInstance calls this to force a clean logout
  // in one place rather than every screen handling it separately.
  useEffect(() => {
    registerAuthErrorHandler(() => {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      setToken(null);
      setUser(null);
    });
  }, []);

  const persistSession = (accessToken, userData) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, accessToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userData));
    setToken(accessToken);
    setAuthToken(accessToken);
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const accessToken = res.data.accessToken || res.data.token;
    persistSession(accessToken, res.data.user);
    return res.data;
  }, []);

  // Called by GoogleCallbackPage once token + user come back from the OAuth redirect
  const setSessionFromGoogle = useCallback((accessToken, userData) => {
    persistSession(accessToken, userData);
  }, []);

  // No backend /auth/logout endpoint exists, and none is needed —
  // the JWT is stateless, so logging out is purely a client-side action.
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    setSessionFromGoogle
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
