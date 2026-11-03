import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedAdminRoute guards all admin routes.
 * If user is not authenticated, redirects to /admin/login.
 */
export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF8F3]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#EFE8DF] border-t-[#EA580C] animate-spin mx-auto mb-4" />
          <p className="text-[#786455] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // User is authenticated, render the protected component
  return <>{children}</>;
};
