import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auditor_token');
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('auditor_token', token);
    } else {
      localStorage.removeItem('auditor_token');
    }
  }, [token]);

  const login = (newToken: string) => setToken(newToken);
  const logout = () => setToken(null);

  return { token, login, logout, isAuthenticated: !!token };
}
