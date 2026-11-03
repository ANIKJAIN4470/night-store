import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product, BusinessSettings } from './types.js';
import { fetchProducts, fetchPublicSettings } from './services/api.js';
import { useCustomerAuth } from './context/CustomerAuthContext.js';

// Layout & Common Components
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { CartDrawer } from './components/CartDrawer.js';
import { ProductDetailsModal } from './components/ProductDetailsModal.js';

// Customer Pages
import { HomePage } from './pages/HomePage.js';
import { MenuPage } from './pages/MenuPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { PaymentPage } from './pages/PaymentPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export const CustomerApp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Snacks');
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [lastOrderData, setLastOrderData] = useState<any>(null);
  const [trackingParams, setTrackingParams] = useState<{ orderNumber: string; token: string }>({
    orderNumber: '',
    token: '',
  });

  // Determine currentView from the URL path
  const getCurrentView = (): string => {
    const pathname = location.pathname;
    if (pathname === '/') return 'home';
    if (pathname === '/menu') return 'menu';
    if (pathname === '/checkout') return 'checkout';
    if (pathname === '/confirmation') return 'confirmation';
    if (pathname.startsWith('/pay/')) return 'payment';
    if (pathname === '/track-order') return 'track';
    return '404';
  };

  const currentView = getCurrentView();

  const loadInitialData = async () => {
    setIsLoadingProducts(true);
    try {
      const [prodsData, settingsData] = await Promise.all([
        fetchProducts(),
        fetchPublicSettings(),
      ]);
      setProducts(prodsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleNavigate = (view: string, category?: string) => {
    if (category) {
      setSelectedCategory(category);
    }
    navigate(view === 'track' ? '/track-order' : '/' + (view === 'home' ? '' : view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Map URL paths to page components
  const renderPage = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            products={products}
            settings={settings}
            onNavigate={handleNavigate}
            onSelectProduct={(p) => setSelectedProductModal(p)}
          />
        );
      case 'menu':
        return (
          <MenuPage
            onSelectProduct={(p) => setSelectedProductModal(p)}
          />
        );
      case 'checkout':
        return (
          <CheckoutPage
            settings={settings}
            customerId={isAuthenticated ? customer?.id : undefined}
            onBackToMenu={() => handleNavigate('menu')}
            onNavigateToLogin={() => navigate('/login')}
            onOrderSuccess={(orderData) => {
              setLastOrderData(orderData);
              sessionStorage.setItem(`order_token_${orderData.orderNumber}`, orderData.trackingToken);
              
              // For online payments (UPI/Card): Go directly to payment page
              // For COD: Go to confirmation page
              if (orderData.directToPayment) {
                console.log('[CustomerApp] Redirecting to payment page for online payment...');
                navigate(`/pay/${orderData.orderNumber}`);
              } else {
                console.log('[CustomerApp] Showing confirmation page for COD...');
                navigate('/confirmation');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'confirmation':
        return (
          <OrderConfirmationPage
            orderData={lastOrderData}
            settings={settings}
            onTrackOrder={(orderNumber, token) => {
              setTrackingParams({ orderNumber, token });
              navigate('/track-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReturnToMenu={() => handleNavigate('menu')}
          />
        );
      case 'payment':
        return <PaymentPage />;
      case 'track':
        return (
          <OrderTrackingPage
            initialOrderNumber={trackingParams.orderNumber}
            initialToken={trackingParams.token}
            settings={settings}
            onBackToMenu={() => handleNavigate('menu')}
          />
        );
      case '404':
        return <NotFoundPage onReturnToHome={() => handleNavigate('home')} />;
      default:
        return <HomePage products={products} settings={settings} onNavigate={handleNavigate} onSelectProduct={(p) => setSelectedProductModal(p)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-[#291D15]">
      <Navbar currentView={currentView} setCurrentView={handleNavigate} settings={settings} />
      <main className="flex-1">{renderPage()}</main>
      <CartDrawer settings={settings} onCheckout={() => handleNavigate('checkout')} onBrowseMenu={() => handleNavigate('menu')} />
      <ProductDetailsModal product={selectedProductModal} onClose={() => setSelectedProductModal(null)} />
      <Footer settings={settings} onNavigate={handleNavigate} />
    </div>
  );
};
