import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = ''; // Vite proxy forwards /api/* → http://localhost:5000

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || localStorage.getItem('alumniconnect_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, verify stored token against backend
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken') || localStorage.getItem('alumniconnect_token');
    if (storedToken) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(({ user: u }) => {
          setUser(u);
          setRole(u.role);
          setIsAuthenticated(true);
          setToken(storedToken);
          localStorage.setItem('authToken', storedToken);
          localStorage.setItem('alumniconnect_token', storedToken);
        })
        .catch(() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('alumniconnect_token');
          setToken(null);
          setUser(null);
          setRole(null);
          setIsAuthenticated(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // ─── Real login ──────────────────────────────────────────────────────────
  const login = async (email, credential, selectedRole = 'admin') => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: credential, pin: credential, selectedRole })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Incorrect email ID or password');

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('alumniconnect_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setRole(data.user.role);
    setIsAuthenticated(true);
    return data.user;
  };

  // ─── Real register (Alumni and Student) ───────────────────────────────────
  const register = async (name, email, password, extraFields = {}, autoLogin = false) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, ...extraFields })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed. Please try again.');

    if (autoLogin && data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('alumniconnect_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRole(data.user.role);
      setIsAuthenticated(true);
    }
    return data;
  };

  // ─── Logout ──────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('alumniconnect_token');
    setToken(null);
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: role || (user?.role) || 'admin',
      token,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
