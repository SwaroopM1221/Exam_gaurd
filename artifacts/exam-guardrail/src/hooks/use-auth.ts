import { useState, useEffect } from 'react';

type AuthRole = 'teacher' | 'auditor';

interface AuthState {
  token: string;
  username: string;
  fullName?: string;
  role: AuthRole;
}

function getStoredAuth(role: AuthRole): AuthState | null {
  try {
    const raw = localStorage.getItem(`auth_${role}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth(role: AuthRole) {
  const [auth, setAuth] = useState<AuthState | null>(() => getStoredAuth(role));

  useEffect(() => {
    if (auth) {
      localStorage.setItem(`auth_${role}`, JSON.stringify(auth));
    } else {
      localStorage.removeItem(`auth_${role}`);
    }
  }, [auth, role]);

  const login = (token: string, username: string, fullName?: string) =>
    setAuth({ token, username, fullName, role });

  const logout = () => setAuth(null);

  return {
    token: auth?.token ?? null,
    username: auth?.username ?? null,
    fullName: auth?.fullName ?? null,
    isAuthenticated: !!auth,
    login,
    logout,
  };
}
