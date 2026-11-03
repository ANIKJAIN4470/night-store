import React from 'react';
import {
  CheckCircle2,
  Bike,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { BusinessSettings } from '../types.js';

interface OrderConfirmationPageProps {
  orderData: any;
  settings?: BusinessSettings | null;
  onTrackOrder: (orderNumber: string, token: string) => void;
  onReturnToMenu: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  orderData,
  settings,
  onTrackOrder,
  onReturnToMenu,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!orderData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-[#291D15]">No Recent Order Found</h2>
        <button
          onClick={onReturnToMenu}
          className="bg-[#EA580C] text-white px-6 py-2.5 rounded-xl font-bold"
        >
          Browse Snacks
        </button>
      </div>
    );
  }

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(orderData.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8 animate-in fade-in duration-300">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="w-18 h-18 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF2E8] text-[#EA580C] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{orderData.paymentMethod === 'UPI' ? 'Payment Pending Verification' : 'Snack Order Placed!'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#291D15] tracking-tight">
          {orderData.paymentMethod === 'UPI' ? 'Order Created — Payment Pending' : "We've Received Your Order!"}
        </h1>
        <p className="text-sm text-[#786455] max-w-md mx-auto">
          {orderData.paymentMethod === 'UPI'
            ? 'Scan the QR code below and pay the exact order total. The admin will verify your payment before accepting the order.'
            : 'Our kitchen has received your ticket and is preparing your snacks for delivery directly to your room.'}
        </p>
      </div>

      {/* Order Number & Tracking Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EFE8DF] shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFDF9] border border-[#F5EFE6]">
          <div>
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
              Your Public Order Number
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#EA580C] tracking-tight">
              {orderData.orderNumber}
            </div>
          </div>
          <button
            onClick={handleCopyOrderNumber}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#EFE8DF] text-xs font-bold text-[#4A3B32] hover:bg-[#F6EFE6] transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Order #</span>
              </>
            )}
          </button>
        </div>

        {/* Delivery Details */}
        <div className="space-y-3 pt-2">
          <h3 className="font-extrabold text-sm text-[#291D15] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#EA580C]" />
            Delivery Details
          </h3>
          <div className="grid gap-2 text-xs text-[#6B5A4E]">
            <div>
              <span className="font-bold text-[#4A3B32]">Name:</span> {orderData.customerName}
            </div>
            <div>
              <span className="font-bold text-[#4A3B32]">Phone:</span> {orderData.customerPhone}
            </div>
            <div>
              <span className="font-bold text-[#4A3B32]">Hostel:</span> {orderData.hostelName}
              {orderData.hostelBlock && ` - ${orderData.hostelBlock}`}
            </div>
            <div>
              <span className="font-bold text-[#4A3B32]">Room:</span> {orderData.roomNumber}
            </div>
            {orderData.deliveryInstructions && (
              <div>
                <span className="font-bold text-[#4A3B32]">Special Instructions:</span> {orderData.deliveryInstructions}
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3 pt-4 border-t border-[#EFE8DF]">
          <h3 className="font-extrabold text-sm text-[#291D15]">Your Items</h3>
          <div className="space-y-2">
            {orderData.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs text-[#6B5A4E]">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-bold text-[#4A3B32]">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-2 pt-4 border-t border-[#EFE8DF]">
          <div className="flex justify-between text-xs text-[#6B5A4E]">
            <span>Subtotal</span>
            <span>₹{(orderData.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-[#6B5A4E]">
            <span>Delivery Fee</span>
            <span>₹{(orderData.deliveryFee || 0).toFixed(2)}</span>
          </div>
          {orderData.discount && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Discount</span>
              <span>-₹{orderData.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#291D15] pt-2 border-t border-[#EFE8DF]">
            <span>Total</span>
            <span className="text-lg text-[#EA580C]">₹{(orderData.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-3 rounded-xl bg-[#F5EFE6] text-xs text-[#6B5A4E]">
          <span className="font-bold text-[#4A3B32]">Payment Method:</span> {orderData.paymentMethod}
        </div>

        {orderData.paymentMethod === 'UPI' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
            <h3 className="font-bold text-amber-900">Pay ₹{(orderData.total || 0).toFixed(2)} by UPI</h3>
            <img
              src={settings?.upiQrUrl || '/upi-qr.jpe'}
              alt="UPI payment QR code"
              className="w-56 h-56 object-contain mx-auto rounded-xl bg-white p-2"
            />
            <p className="text-xs text-amber-800">
              Open GPay, PhonePe, Paytm or another UPI app, scan this QR code, and complete payment.
              Your order stays pending until the admin verifies the payment.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => onTrackOrder(orderData.orderNumber, orderData.trackingToken)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-[#EA580C] text-[#EA580C] font-bold text-sm rounded-xl hover:bg-[#FFF2E8] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Track Your Order</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onReturnToMenu}
          className="w-full px-6 py-3 text-[#EA580C] font-bold text-sm hover:text-[#C2410C] transition-colors"
        >
          Continue Shopping
        </button>
      </div>

      {/* Delivery Time Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
        <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Estimated Delivery
        </h4>
        <p className="text-sm text-blue-700">
          {orderData.paymentMethod === 'UPI'
            ? 'Delivery time starts after payment verification and admin acceptance.'
            : `${settings?.estimatedDeliveryTime || '20-30 mins'} from order confirmation`}
        </p>
      </div>

      {/* Support Info */}
      <div className="text-center text-xs text-[#786455]">
        <p className="mb-2">Need help? Contact us on WhatsApp</p>
        <a
          href={`https://wa.me/${settings?.whatsappPhone?.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#EA580C] font-bold hover:underline"
        >
          {settings?.whatsappPhone || '+91 98765 43210'}
        </a>
      </div>
    </div>
  );
};
