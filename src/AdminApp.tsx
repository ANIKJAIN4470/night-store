import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.js';
import { BusinessSettings } from './types.js';
import { fetchPublicSettings, adminUpdateSettings } from './services/api.js';

// Admin Layout & Pages
import { AdminLayout } from './pages/admin/AdminLayout.js';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.js';
import { AdminProductsPage } from './pages/admin/AdminProductsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';
import { AdminDiagnosticsPage } from './pages/admin/AdminDiagnosticsPage.js';
import { AdminReportsPage } from './pages/admin/AdminReportsPage.js';

export const AdminApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Determine current tab from URL path
  const getCurrentTab = (): 'dashboard' | 'orders' | 'products' | 'reports' | 'settings' => {
    const pathname = location.pathname;
    if (pathname.includes('/admin/diagnostics')) return 'dashboard'; // Route to diagnostics, show dashboard layout
    if (pathname.includes('/admin/orders')) return 'orders';
    if (pathname.includes('/admin/products')) return 'products';
    if (pathname.includes('/admin/reports')) return 'reports';
    if (pathname.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const currentTab = getCurrentTab();

  const setCurrentTab = (tab: 'dashboard' | 'orders' | 'products' | 'reports' | 'settings') => {
    navigate(`/admin/${tab === 'dashboard' ? 'dashboard' : tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchPublicSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const handleToggleStoreOpen = async () => {
    if (!settings) return;
    try {
      const updated = await adminUpdateSettings({ isOpen: !settings.isOpen });
      setSettings(updated.settings);
    } catch (e) {
      console.error('Failed to toggle store open/pause:', e);
    }
  };

  const handleExitAdmin = () => {
    navigate('/');
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      onExitAdmin={handleExitAdmin}
      onLogout={handleLogout}
      settings={settings}
      onToggleStoreOpen={handleToggleStoreOpen}
    >
      {currentTab === 'dashboard' && (
        location.pathname.includes('/admin/diagnostics') ? (
          <AdminDiagnosticsPage />
        ) : (
          <AdminDashboardPage
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onViewOrder={() => {
              setCurrentTab('orders');
            }}
          />
        )
      )}
      {currentTab === 'orders' && <AdminOrdersPage />}
      {currentTab === 'products' && <AdminProductsPage />}
      {currentTab === 'reports' && <AdminReportsPage />}
      {currentTab === 'settings' && (
        <AdminSettingsPage
          onSettingsUpdated={(newSettings) => setSettings(newSettings)}
        />
      )}
    </AdminLayout>
  );
};
