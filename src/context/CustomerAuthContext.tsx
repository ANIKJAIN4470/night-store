import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer } from '../types.js';
import { customerGetMe, customerLogin as apiLogin, customerLogout as apiLogout, customerRegister as apiRegister } from '../services/api.js';

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, captchaChallenge?: string, captchaAnswer?: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCustomer = async () => {
    const token = localStorage.getItem('papis_customer_token');
    if (!token) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await customerGetMe();
      setCustomer({
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
        isEmailVerified: data.customer.isEmailVerified,
      });
    } catch {
      localStorage.removeItem('papis_customer_token');
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomer();

    // Listen for 401 logout events
    const handleLogout = () => {
      setCustomer(null);
    };

    window.addEventListener('customer-logout', handleLogout);
    return () => window.removeEventListener('customer-logout', handleLogout);
  }, []);

  const login = async (email: string, password: string, captchaChallenge?: string, captchaAnswer?: string) => {
    const res = await apiLogin(email, password, captchaChallenge || '', captchaAnswer || '');
    setCustomer({
      id: res.customer.id,
      name: res.customer.name,
      email: res.customer.email,
      phone: res.customer.phone,
    });
  };

  const register = async (name: string, email: string, phone: string, password: string, confirmPassword: string) => {
    const res = await apiRegister({ name, email, phone, password, confirmPassword });
    setCustomer({
      id: res.customer.id,
      name: res.customer.name,
      email: res.customer.email,
      phone: res.customer.phone,
    });
  };

  const logout = async () => {
    await apiLogout();
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, isAuthenticated: !!customer, login, register, logout, refreshCustomer }}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
