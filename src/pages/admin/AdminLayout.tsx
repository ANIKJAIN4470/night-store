import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Power,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { BusinessSettings } from '../../types.js';

interface AdminLayoutProps {
  currentTab: 'dashboard' | 'orders' | 'products' | 'reports' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'orders' | 'products' | 'reports' | 'settings') => void;
  onExitAdmin: () => void;
  onLogout: () => void;
  settings?: BusinessSettings | null;
  onToggleStoreOpen?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  setCurrentTab,
  onExitAdmin,
  onLogout,
  settings,
  onToggleStoreOpen,
  children,
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBF8F3]">
      {/* Top Admin Bar */}
      <header className="bg-[#291D15] text-white border-b border-[#3A2A20] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Admin Tag */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EA580C] flex items-center justify-center text-white">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight">Papi's Kitchen</span>
                  <span className="text-[10px] font-bold bg-[#EA580C] text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                    Owner Dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Store Open/Closed Toggle if settings available */}
            {settings && (
              <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${settings.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="font-semibold text-white/90">
                  Store Status: {settings.isOpen ? 'Accepting Orders' : 'Store Paused'}
                </span>
                {onToggleStoreOpen && (
                  <button
                    onClick={onToggleStoreOpen}
                    className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    Toggle
                  </button>
                )}
              </div>
            )}

            {/* Right: User Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-[#B7A393] hidden md:inline">
                Signed in as <strong className="text-white">{user?.username}</strong>
              </span>

              <button
                onClick={onExitAdmin}
                className="flex items-center gap-1.5 text-xs text-[#B7A393] hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="View customer facing website"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View Store</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                title="Log out of admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-[#EFE8DF] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#5C4A3E] hover:bg-[#F6EFE6]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setCurrentTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                currentTab === 'orders'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#5C4A3E] hover:bg-[#F6EFE6]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Orders Management</span>
            </button>

            <button
              onClick={() => setCurrentTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                currentTab === 'products'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#5C4A3E] hover:bg-[#F6EFE6]'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Snack Products & Prices</span>
            </button>

            <button
              onClick={() => setCurrentTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                currentTab === 'reports'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#5C4A3E] hover:bg-[#F6EFE6]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports & Analytics</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                currentTab === 'settings'
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'text-[#5C4A3E] hover:bg-[#F6EFE6]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Business Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Admin Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
