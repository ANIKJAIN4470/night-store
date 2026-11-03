import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types.js';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{
    requiresOTP: boolean;
    adminId?: string;
    developmentOtp?: string;
  }>;
  verifyOTP: (adminId: string, otp: string, rememberDevice: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('papis_admin_token');
    if (token) {
      setUser({ id: 'admin', username: 'admin', role: 'admin' });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    console.log('🔑 AuthContext.login called with:', credentials);
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    console.log('📡 Response status:', response.status, response.statusText);
    const data = await response.json();
    console.log('📦 Response data:', data);
    if (!response.ok) {
      console.error('❌ API error:', data.error);
      throw new Error(data.error);
    }
    console.log('✅ Returning:', { requiresOTP: data.requiresOTP, adminId: data.adminId });
    return {
      requiresOTP: data.requiresOTP,
      adminId: data.adminId,
      developmentOtp: data.developmentOtp,
    };
  };

  const verifyOTP = async (adminId: string, otp: string, rememberDevice: boolean) => {
    const response = await fetch('/api/admin/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, otp, rememberDevice }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    if (data.token) {
      localStorage.setItem('papis_admin_token', data.token);
      setUser(data.user);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    localStorage.removeItem('papis_admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
