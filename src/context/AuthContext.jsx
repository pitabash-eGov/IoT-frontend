import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMe, login as loginApi, register as registerApi, refresh as refreshApi } from '../api/auth';

const AuthContext = createContext(null);

function decodeJwtExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // convert to ms
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((token) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const exp = decodeJwtExp(token);
    if (!exp) return;

    // Refresh 5 minutes before expiry
    const delay = exp - Date.now() - 5 * 60 * 1000;
    if (delay <= 0) return;

    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await refreshApi();
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        scheduleRefresh(data.token);
      } catch {
        clearAuth();
      }
    }, delay);
  }, [clearAuth]);

  const storeAuth = useCallback((data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    scheduleRefresh(data.token);
  }, [scheduleRefresh]);

  // Validate stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then(({ data }) => {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        scheduleRefresh(token);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setLoading(false));
  }, [clearAuth, scheduleRefresh]);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    storeAuth(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await registerApi(name, email, password);
    storeAuth(data);
    return data;
  };

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
