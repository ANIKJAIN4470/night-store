import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { createPaymentOrder, verifyPayment } from '../services/api.js';

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number; // in rupees (will be converted to paise)
  customerEmail: string;
  customerPhone: string;
  customerId?: string;
  onSuccess: (paymentId: string, razorpayOrderId: string, signature: string) => void;
  onError: (errorMsg: string) => void;
}

// Extend window type to include Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
  orderId,
  amount,
  customerEmail,
  customerPhone,
  customerId,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script once on component mount
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        console.log('[RazorpayCheckout] Razorpay SDK already loaded');
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('[RazorpayCheckout] Razorpay SDK loaded successfully');
      };
      script.onerror = () => {
        console.error('[RazorpayCheckout] Failed to load Razorpay SDK');
        setError('Failed to load payment gateway. Please refresh the page.');
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();
  }, []);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[RazorpayCheckout] Starting payment flow for order:', orderId);

      if (!window.Razorpay) {
        throw new Error('Payment gateway not available. Please refresh the page.');
      }

      // Create Razorpay order
      console.log('[RazorpayCheckout] Creating payment order...');
      const orderResponse = await createPaymentOrder({
        orderId,
        amount: Math.round(amount * 100), // Convert to paise
        customerEmail,
        customerPhone,
        customerId,
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create payment order');
      }

      const { razorpayOrderId, keyId } = orderResponse;
      console.log('[RazorpayCheckout] Payment order created:', razorpayOrderId);

      // Razorpay options
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        name: "Papi's Kitchen",
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            console.log('[RazorpayCheckout] Payment response received');

            // Verify payment signature
            const verifyResponse = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (!verifyResponse.success) {
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }

            console.log('[RazorpayCheckout] Payment verified successfully');
            onSuccess(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature
            );
          } catch (err: any) {
            console.error('[RazorpayCheckout] Verification error:', err.message);
            onError(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('[RazorpayCheckout] Modal dismissed');
            setLoading(false);
            onError('Payment cancelled');
          },
        },
        prefill: {
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#EA580C',
        },
      };

      console.log('[RazorpayCheckout] Opening payment modal...');
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('[RazorpayCheckout] Error:', err.message);
      const errorMsg = err.message || 'An error occurred during payment';
      setError(errorMsg);
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">Payment Error</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-black text-base py-4 rounded-xl shadow-lg shadow-[#EA580C]/25 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ₹{amount} via Razorpay</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#8C7A6D] flex items-center justify-center gap-1.5">
        <span>🔒</span>
        <span>Secured by Razorpay</span>
      </p>
    </div>
  );
};
