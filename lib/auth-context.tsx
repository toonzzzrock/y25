/**
 * Authentication Context
 * Manages user authentication state and session across the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, dateOfBirth: string, sex: string, password: string, userType: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check session on mount and periodically
  useEffect(() => {
    checkSession();
    const interval = setInterval(checkSession, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();
      setAuthenticated(data.authenticated);
      setUser(data.user);
    } catch (error) {
      console.error('Failed to check session:', error);
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (response.status === 503) {
        // Database connection error
        throw new Error('Database connection failed');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, dateOfBirth: string, sex: string, password: string, userType: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, dateOfBirth, sex, password, userType }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthenticated(false); // User needs to login after signup
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, login, signup, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
