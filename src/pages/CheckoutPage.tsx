import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  Banknote,
  QrCode,
  Info,
  Loader2,
  Phone,
  User,
  Home,
  MessageSquare,
  X,
  Tag,
  Lock,
  LogIn,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';
import { BusinessSettings, DeliveryMethod } from '../types.js';
import { placeOrder, validateCoupon } from '../services/api.js';

interface CheckoutPageProps {
  settings?: BusinessSettings | null;
  onBackToMenu: () => void;
  onOrderSuccess: (orderData: any) => void;
  onNavigateToLogin?: () => void;
  customerId?: string;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  settings,
  onBackToMenu,
  onOrderSuccess,
  onNavigateToLogin,
  customerId,
}) => {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, customer } = useCustomerAuth();

  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Room Delivery');
  const [hostelName, setHostelName] = useState(settings?.acceptedHostels?.[0] || 'Boys Hostel 1 (BH-1)');
  const [hostelBlock, setHostelBlock] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI'>('Cash on Delivery');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const { appliedCoupon, applyCoupon, removeCoupon } = useCart();

  const deliveryFee = deliveryMethod === 'Room Delivery' ? (settings?.deliveryFee ?? 15) : 0;
  const minOrder = settings?.minOrderAmount ?? 50;
  const discount = appliedCoupon?.discount || 0;
  const finalTotal = subtotal + deliveryFee - discount;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Please enter your full name (minimum 2 characters)';
    }
    const cleanPhone = customerPhone.replace(/[\s\-\(\)\+]/g, '');
    const phoneValid = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(cleanPhone);
    if (!customerPhone.trim() || !phoneValid) {
      newErrors.customerPhone = 'Please enter a valid 10-digit Indian mobile number';
    }
    if (deliveryMethod === 'Room Delivery') {
      if (!hostelName.trim()) {
        newErrors.hostelName = 'Please select or enter your hostel name';
      }
      if (!roomNumber.trim()) {
        newErrors.roomNumber = 'Please enter your hostel room number';
      }
    }
    if (items.length === 0) {
      newErrors.cart = 'Your cart is empty. Please add items before checking out.';
    }
    if (subtotal < minOrder) {
      newErrors.minOrder = `Minimum order amount is ₹${minOrder}. Current subtotal is ₹${subtotal}.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode, subtotal);
      applyCoupon(result.code, result.discount);
      setCouponSuccess(`Coupon applied! You saved ₹${result.discount}`);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSubmitting(true);
    try {
      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryMethod,
        hostelName: deliveryMethod === 'Room Delivery' ? hostelName.trim() : 'Self Pickup',
        hostelBlock: deliveryMethod === 'Room Delivery' ? hostelBlock.trim() : undefined,
        roomNumber: deliveryMethod === 'Room Delivery' ? roomNumber.trim() : undefined,
        deliveryInstructions: deliveryMethod === 'Room Delivery' ? deliveryInstructions.trim() || undefined : undefined,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        idempotencyKey,
        customerId,
        couponCode: appliedCoupon?.code,
      };

      // Always create the order
      const response = await placeOrder(payload);
      clearCart();

      // Store tracking token for order tracking
      sessionStorage.setItem(`order_token_${response.orderNumber}`, response.trackingToken);

      onOrderSuccess(response);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setApiError(err.message || 'Failed to submit order. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#291D15] mb-2">Login Required</h2>
          <p className="text-sm text-[#786455] mb-6">You need to log in to place an order.</p>
        </div>
        <button
          onClick={onNavigateToLogin}
          className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all"
        >
          <LogIn className="w-5 h-5" />
          <span>Log In to Your Account</span>
        </button>
        <button
          onClick={onBackToMenu}
          className="text-[#EA580C] hover:text-[#C2410C] font-bold text-sm"
        >
          ← Back to Menu
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 bg-[#FFF2E8] text-[#EA580C] rounded-full flex items-center justify-center mx-auto text-3xl">
          🥡
        </div>
        <h2 className="text-2xl font-black text-[#291D15]">Your Cart is Empty</h2>
        <p className="text-sm text-[#786455]">Pick something delicious from the menu!</p>
        <button
          onClick={onBackToMenu}
          className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={onBackToMenu}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#786455] hover:text-[#EA580C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Menu & Cart</span>
      </button>

      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#291D15] tracking-tight">Checkout</h1>
        <p className="text-sm text-[#786455]">Complete your order</p>
      </div>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Order Submission Error</h4>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#EA580C]" />
              <span>1. Delivery Method</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                deliveryMethod === 'Room Delivery' ? 'border-[#EA580C] bg-[#FFF9F5]' : 'border-[#EFE8DF] hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="Room Delivery"
                  checked={deliveryMethod === 'Room Delivery'}
                  onChange={() => setDeliveryMethod('Room Delivery')}
                  className="mt-1 text-[#EA580C] focus:ring-[#EA580C]"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-[#291D15]">
                    <Home className="w-4 h-4 text-[#EA580C]" />
                    <span>Room Delivery</span>
                  </div>
                  <p className="text-xs text-[#786455] mt-1">We'll deliver to your hostel room</p>
                  <p className="text-[10px] text-[#EA580C] font-semibold mt-1">Delivery fee: ₹{settings?.deliveryFee ?? 15}</p>
                </div>
              </label>

              <label className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                deliveryMethod === 'Self Pickup' ? 'border-[#EA580C] bg-[#FFF9F5]' : 'border-[#EFE8DF] hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="Self Pickup"
                  checked={deliveryMethod === 'Self Pickup'}
                  onChange={() => setDeliveryMethod('Self Pickup')}
                  className="mt-1 text-[#EA580C] focus:ring-[#EA580C]"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-[#291D15]">
                    <ShoppingBag className="w-4 h-4 text-[#EA580C]" />
                    <span>Self Pickup</span>
                  </div>
                  <p className="text-xs text-[#786455] mt-1">Pick up from the shop yourself</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">No delivery fee</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
              <User className="w-4 h-4 text-[#EA580C]" />
              <span>2. Contact Details</span>
            </h3>
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:ring-2 focus:ring-[#FFF2E8] ${
                  errors.customerName ? 'border-red-400 bg-red-50/20' : 'border-[#EFE8DF] focus:border-[#EA580C]'
                }`}
              />
              {errors.customerName && <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Phone Number *</label>
              <input
                type="tel"
                maxLength={10}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:ring-2 focus:ring-[#FFF2E8] ${
                  errors.customerPhone ? 'border-red-400 bg-red-50/20' : 'border-[#EFE8DF] focus:border-[#EA580C]'
                }`}
              />
              {errors.customerPhone && <p className="text-xs text-red-600 mt-1">{errors.customerPhone}</p>}
            </div>
          </div>

          {deliveryMethod === 'Room Delivery' && (
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
                <Home className="w-4 h-4 text-[#EA580C]" />
                <span>3. Room Address</span>
              </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Hostel *</label>
                <select
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
                >
                  {settings?.acceptedHostels?.map((h, i) => (
                    <option key={i} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Block/Floor (optional)</label>
                <input
                  type="text"
                  value={hostelBlock}
                  onChange={(e) => setHostelBlock(e.target.value)}
                  placeholder="Block B"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Room Number *</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Room 314"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:ring-2 focus:ring-[#FFF2E8] ${
                  errors.roomNumber ? 'border-red-400 bg-red-50/20' : 'border-[#EFE8DF] focus:border-[#EA580C]'
                }`}
              />
              {errors.roomNumber && <p className="text-xs text-red-600 mt-1">{errors.roomNumber}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4A3B32] mb-1.5">Special Instructions (optional)</label>
              <textarea
                rows={2}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Ring phone before entering..."
                className="w-full px-4 py-2 rounded-xl border border-[#EFE8DF] text-xs text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
              />
            </div>
          </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#EA580C]" />
              <span>{deliveryMethod === 'Room Delivery' ? '4' : '3'}. Payment Method</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                paymentMethod === 'Cash on Delivery' ? 'border-[#EA580C] bg-[#FFF9F5]' : 'border-[#EFE8DF] hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  className="mt-1 text-[#EA580C] focus:ring-[#EA580C]"
                />
                <div>
                  <div className="flex items-center gap-2 font-bold text-sm text-[#291D15]">
                    <Banknote className="w-4 h-4 text-[#EA580C]" />
                    <span>Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-[#786455] mt-1">Pay directly to runner</p>
                </div>
              </label>

              {settings?.paymentMethods?.upi !== false && (
                <label className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'UPI' ? 'border-[#EA580C] bg-[#FFF9F5]' : 'border-[#EFE8DF] hover:border-neutral-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="mt-1 text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <div>
                    <div className="flex items-center gap-2 font-bold text-sm text-[#291D15]">
                      <QrCode className="w-4 h-4 text-[#EA580C]" />
                      <span>UPI Payment</span>
                    </div>
                    <p className="text-xs text-[#786455] mt-1">Pay using GPay, PhonePe, Paytm or any UPI app</p>
                  </div>
                </label>
              )}

            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-5 sticky top-24">
            <h3 className="font-extrabold text-base text-[#291D15] pb-3 border-b border-[#F5EFE6]">Order Summary</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-md bg-[#FFF2E8] text-[#EA580C] font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {quantity}x
                    </span>
                    <span className="font-medium text-[#291D15] truncate">{product.name}</span>
                  </div>
                  <span className="font-bold text-[#291D15] shrink-0">₹{(product.sellingPrice || product.price || 0) * quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#F5EFE6] space-y-2 text-xs text-[#6B5A4E]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#291D15]">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-[#291D15]">₹{deliveryFee}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span className="font-semibold">Coupon ({appliedCoupon.code})</span>
                  <span className="font-bold">-₹{appliedCoupon.discount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#F5EFE6] flex justify-between items-baseline text-base font-black text-[#291D15]">
                <span>Total</span>
                <span className="text-[#EA580C] text-xl">₹{finalTotal}</span>
              </div>
            </div>

            {!appliedCoupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3B32]">Have a coupon?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Code"
                    className="flex-1 px-3 py-2 rounded-lg border border-[#EFE8DF] text-xs text-[#291D15] bg-[#FFFDF9] focus:outline-none focus:border-[#EA580C]"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode}
                    className="px-4 py-2 bg-[#291D15] hover:bg-[#4A3B32] disabled:bg-neutral-300 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-600">{couponError}</p>}
              </form>
            ) : (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-xs font-bold text-green-800">✓ {appliedCoupon.code} applied</span>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            {couponSuccess && <p className="text-xs text-green-600 font-semibold">{couponSuccess}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-black text-base py-4 rounded-2xl shadow-lg shadow-[#EA580C]/25 transition-all active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Placing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Place Order (₹{finalTotal})</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-[#8C7A6D] text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secure & encrypted</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
