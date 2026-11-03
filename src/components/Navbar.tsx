import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Clock, Menu as MenuIcon, X, Phone, LogOut, User } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';
import { BusinessSettings } from '../types.js';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  settings?: BusinessSettings | null;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  settings,
}) => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { isAuthenticated, logout } = useCustomerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const isOpen = settings?.isOpen ?? true;

  const handleNav = (view: string) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fffaf4]/95 backdrop-blur-md border-b border-[#eadfd3] shadow-sm">
      {/* Announcement top bar if present */}
      {settings?.announcement && (
        <div className="bg-[#EA580C] text-white text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
          <span>🔥</span>
          <span>{settings.announcement}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EA580C] shadow-sm shadow-[#EA580C]/20 group-hover:scale-105 transition-transform">
              <img src="/papis-kitchen-logo.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#291D15]">
                  Papi's Kitchen
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#FFF2E8] text-[#C2410C] border border-[#FDBA74]/40 uppercase tracking-wider">
                  Hostel Delivery
                </span>
              </div>
              <p className="text-xs text-[#786455] hidden sm:block font-medium">
                {settings?.tagline || 'Hostel Snacks, Delivered to Your Door.'}
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'home'
                  ? 'text-[#EA580C] bg-[#FFF2E8]'
                  : 'text-[#4A3B32] hover:text-[#EA580C] hover:bg-[#F9F4EC]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNav('menu')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'menu'
                  ? 'text-[#EA580C] bg-[#FFF2E8]'
                  : 'text-[#4A3B32] hover:text-[#EA580C] hover:bg-[#F9F4EC]'
              }`}
            >
              Menu & Snacks
            </button>
            <button
              onClick={() => handleNav('track')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentView === 'track'
                  ? 'text-[#EA580C] bg-[#FFF2E8]'
                  : 'text-[#4A3B32] hover:text-[#EA580C] hover:bg-[#F9F4EC]'
              }`}
            >
              Track Order
            </button>

            {/* Operating Hours indicator */}
            <div className="ml-2 pl-3 border-l border-[#EBE0D2] flex items-center gap-2 text-xs font-medium text-[#6B5A4E]">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>
                {isOpen ? `Open (${settings?.openingTime || '17:00'} - ${settings?.closingTime || '03:30'})` : 'Closed for now'}
              </span>
            </div>
          </nav>

          {/* Right Action Icons: Cart + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-[#EA580C]/25 transition-all active:scale-95"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="bg-white text-[#EA580C] text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Account Menu (Desktop) */}
            {isAuthenticated ? (
              <div className="hidden md:relative md:inline-block">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 bg-[#FFF2E8] hover:bg-[#FFE0CC] text-[#EA580C] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-sm transition-all"
                  aria-label="Account menu"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Account</span>
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 bg-white border border-[#EFE8DF] rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => {
                        navigate('/account');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#291D15] hover:bg-[#FFF2E8] transition-colors"
                    >
                      My Account
                    </button>
                    <button
                      onClick={() => {
                        navigate('/account/orders');
                        setAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#291D15] hover:bg-[#FFF2E8] transition-colors border-t border-[#EFE8DF]"
                    >
                      Order History
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t border-[#EFE8DF] flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-2 text-sm font-semibold text-[#EA580C] hover:text-[#C2410C] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-3.5 py-2 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#4A3B32] hover:bg-[#F6EFE6] rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EFE8DF] bg-[#FFFDF9] px-4 pt-3 pb-6 space-y-2 shadow-lg">
          <button
            onClick={() => handleNav('home')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'home' ? 'bg-[#FFF2E8] text-[#EA580C]' : 'text-[#4A3B32]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => handleNav('menu')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'menu' ? 'bg-[#FFF2E8] text-[#EA580C]' : 'text-[#4A3B32]'
            }`}
          >
            Menu & Snacks
          </button>
          <button
            onClick={() => handleNav('track')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold ${
              currentView === 'track' ? 'bg-[#FFF2E8] text-[#EA580C]' : 'text-[#4A3B32]'
            }`}
          >
            Track Existing Order
          </button>

          {/* Mobile Auth Buttons */}
          {isAuthenticated ? (
            <>
              <div className="pt-3 border-t border-[#EFE8DF] space-y-2">
                <button
                  onClick={() => {
                    navigate('/account');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-[#291D15] bg-[#FFF2E8] hover:bg-[#FFE0CC] transition-colors"
                >
                  My Account
                </button>
                <button
                  onClick={() => {
                    navigate('/account/orders');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-[#291D15] hover:bg-[#F9F4EC] transition-colors"
                >
                  Order History
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-3 border-t border-[#EFE8DF] space-y-2">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-[#EA580C] hover:bg-[#FFF2E8] transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  navigate('/register');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-[#EFE8DF] text-xs text-[#786455] space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>
                Operating Hours: {settings?.openingTime || '17:00'} to {settings?.closingTime || '03:30'}
              </span>
            </div>
            {settings?.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Call/WhatsApp: {settings.contactPhone}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
