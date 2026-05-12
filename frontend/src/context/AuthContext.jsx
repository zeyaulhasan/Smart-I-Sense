import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'smart_i_sense_token';

// Set header synchronously on module load (before any component renders)
const storedToken = localStorage.getItem(TOKEN_KEY);
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storedToken);
  const [loading, setLoading] = useState(true);

  // Keep header in sync whenever token changes (after initial load)
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  // On mount, verify stored token — header is already set synchronously above
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        // res is already response.data due to interceptor → { success, data: { user } }
        setUser(res.data || res);
      } catch {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // res = { success, data: { token, user } }
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    // Set header immediately so subsequent calls work
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data;
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return userData;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const res = await api.patch('/auth/profile', updates);
    setUser(res.data || res);
    return res.data || res;
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateProfile,
  }), [user, token, loading, login, register, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
