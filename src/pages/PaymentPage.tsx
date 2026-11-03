import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RazorpayCheckout } from '../components/RazorpayCheckout.js';
import { trackOrder } from '../services/api.js';
import { AlertCircle, ArrowLeft, Loader, CheckCircle2 } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract order number from URL path
  const orderNumber = location.pathname.split('/pay/')[1];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    console.log('[PaymentPage] Component mounted with orderNumber:', orderNumber);
    
    const loadOrder = async () => {
      try {
        if (!orderNumber) {
          throw new Error('Order number not found in URL');
        }

        const trackingToken = sessionStorage.getItem(`order_token_${orderNumber}`);
        if (!trackingToken) {
          throw new Error('Session expired. Please place a new order.');
        }

        const orderData = await trackOrder(orderNumber, trackingToken);
        const orderObject = orderData.order || orderData;
        setOrder(orderObject);
        console.log('[PaymentPage] Order loaded:', orderObject);
      } catch (err: any) {
        console.error('[PaymentPage] Error:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderNumber]);

  const handlePaymentSuccess = (paymentId: string, razorpayOrderId: string, signature: string) => {
    console.log('[PaymentPage] Payment successful:', { paymentId, razorpayOrderId, signature });
    setPaymentSuccess(true);
    
    // Wait 2 seconds then redirect to order tracking
    setTimeout(() => {
      navigate(`/track-order?orderNumber=${orderNumber}&token=${sessionStorage.getItem(`order_token_${orderNumber}`)}`);
    }, 2000);
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error('[PaymentPage] Payment error:', errorMsg);
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader className="w-12 h-12 animate-spin text-[#EA580C]" />
        <p className="text-[#786455]">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#786455] hover:text-[#EA580C] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-red-900 mb-1">Payment Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen gap-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#291D15] mb-2">Payment Successful! 🎉</h2>
          <p className="text-sm text-[#786455] mb-6">Your order is confirmed. Redirecting to order tracking...</p>
        </div>
        <Loader className="w-8 h-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#786455] hover:text-[#EA580C] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Go Back</span>
      </button>

      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#291D15]">Complete Payment</h1>
        <p className="text-sm text-[#786455]">Order: {orderNumber}</p>
      </div>

      {order && (
        <div className="bg-white rounded-2xl p-6 border border-[#EFE8DF] space-y-4">
          <h3 className="font-bold text-[#291D15] mb-4">Order Summary</h3>
          
          {/* Order Items */}
          <div className="space-y-2 mb-4 pb-4 border-b border-[#F5EFE6]">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-[#6B5A4E]">{item.quantity}x {item.productName}</span>
                <span className="font-bold text-[#291D15]">₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B5A4E]">Subtotal</span>
              <span className="font-bold text-[#291D15]">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B5A4E]">Delivery Fee</span>
              <span className="font-bold text-[#291D15]">₹{order.deliveryFee}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-semibold">Discount</span>
                <span className="font-bold">-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[#F5EFE6] pt-2 text-base font-black">
              <span>Total Amount</span>
              <span className="text-[#EA580C]">₹{order.total}</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-[#FFF9F5] rounded-lg p-4 text-sm space-y-1">
            <p className="font-bold text-[#291D15]">Delivery To:</p>
            <p className="text-[#6B5A4E]">{order.customerName}</p>
            <p className="text-[#6B5A4E]">{order.hostelName}</p>
            <p className="text-[#6B5A4E]">Room: {order.roomNumber}</p>
            <p className="text-[#6B5A4E]">📞 {order.customerPhone?.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2')}</p>
          </div>
        </div>
      )}

      {/* Razorpay Checkout */}
      {order && (
        <RazorpayCheckout
          orderId={orderNumber}
          amount={order.total}
          customerEmail={order.customerEmail || 'customer@papiskitchen.local'}
          customerPhone={order.customerPhone}
          customerId={order.customerId}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
};
