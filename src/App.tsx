import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { CustomerAuthProvider } from './context/CustomerAuthContext.js';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.js';
import { ProtectedCustomerRoute } from './components/ProtectedCustomerRoute.js';
import { CustomerApp } from './CustomerApp.js';
import { AdminApp } from './AdminApp.js';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { AccountPage } from './pages/AccountPage.js';
import { OrderHistoryPage } from './pages/OrderHistoryPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';

function AppContent() {
  return (
    <Routes>
      {/* Customer Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/account"
        element={
          <ProtectedCustomerRoute>
            <AccountPage />
          </ProtectedCustomerRoute>
        }
      />
      <Route
        path="/account/orders"
        element={
          <ProtectedCustomerRoute>
            <OrderHistoryPage />
          </ProtectedCustomerRoute>
        }
      />
      <Route
        path="/account/orders/:id"
        element={
          <ProtectedCustomerRoute>
            <OrderTrackingPage />
          </ProtectedCustomerRoute>
        }
      />

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedAdminRoute>
            <AdminApp />
          </ProtectedAdminRoute>
        }
      />

      {/* Redirect /admin to /admin/login */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

      {/* Customer App - handles /, /menu, /checkout, /track-order */}
      <Route path="/*" element={<CustomerApp />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </Router>
  );
}
