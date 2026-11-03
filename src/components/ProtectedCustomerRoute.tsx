import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';

interface ProtectedCustomerRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedCustomerRoute guards all customer account routes.
 * If user is not authenticated, redirects to /login.
 */
export const ProtectedCustomerRoute: React.FC<ProtectedCustomerRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useCustomerAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#EFE8DF] border-t-[#EA580C] animate-spin mx-auto mb-4" />
          <p className="text-[#786455] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
};
