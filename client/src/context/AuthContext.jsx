import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
        setAuthToken(null);
      }
    } catch {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (username_or_email, password) => {
    const res = await api.login({ username_or_email, password });
    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login gagal');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registrasi gagal');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
