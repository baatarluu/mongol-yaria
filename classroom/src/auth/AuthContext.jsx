import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  // Эхлүүлэхэд токен байвал багшийн мэдээллийг сэргээнэ.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getToken()) {
        try {
          const { teacher } = await api.me();
          if (!cancelled) setTeacher(teacher);
        } catch {
          setToken('');
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, teacher } = await api.login({ email, password });
    setToken(token);
    setTeacher(teacher);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, teacher } = await api.register({ name, email, password });
    setToken(token);
    setTeacher(teacher);
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setTeacher(null);
  }, []);

  return (
    <AuthContext.Provider value={{ teacher, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
