import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  ArrowLeft,
  CheckCircle2,
  Bike,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Order, BusinessSettings } from '../types.js';
import { trackOrder, cancelOrderByCustomer, customerGetOrder } from '../services/api.js';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline.js';

interface OrderTrackingPageProps {
  initialOrderNumber?: string;
  initialToken?: string;
  settings?: BusinessSettings | null;
  onBackToMenu?: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  initialOrderNumber = '',
  initialToken = '',
  settings,
  onBackToMenu,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || searchParams.get('order') || '');
  const [tokenInput, setTokenInput] = useState(initialToken || searchParams.get('token') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrderStatus = async (ordNum: string, tkn: string) => {
    if (!ordNum.trim() || !tkn.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trackOrder(ordNum.trim(), tkn.trim());
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || 'Could not locate order with the provided token.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load if params provided
  useEffect(() => {
    if (initialOrderNumber && initialToken) {
      fetchOrderStatus(initialOrderNumber, initialToken);
    }
  }, [initialOrderNumber, initialToken]);

  // Polling for live status updates if order is active
  useEffect(() => {
    if (!autoRefresh || !order || order.orderStatus === 'Completed' || order.orderStatus === 'Cancelled') {
      return;
    }

    const interval = setInterval(() => {
      if (orderNumberInput && tokenInput) {
        trackOrder(orderNumberInput.trim(), tokenInput.trim())
          .then((res) => setOrder(res.order))
          .catch((e) => console.warn('Polling error:', e));
      }
    }, 12000); // 12 seconds poll

    return () => clearInterval(interval);
  }, [autoRefresh, order, orderNumberInput, tokenInput]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderStatus(orderNumberInput, tokenInput);
  };

  const handleCustomerCancel = async () => {
    if (!order || !tokenInput) return;
    setIsCancelling(true);
    try {
      const res = await cancelOrderByCustomer(order.orderNumber, tokenInput, cancelReason);
      setOrder(res.order);
      setCancelModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Could not cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMenu}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#786455] hover:text-[#EA580C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-black text-[#291D15] tracking-tight">
          Track Your Order
        </h1>
        <p className="text-sm text-[#786455]">
          Check the live preparation and delivery status of your snack ticket.
        </p>
      </div>

      {/* Lookup Box (if not already loaded or wants to change) */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs">
        <form onSubmit={handleManualSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Order Number (e.g. PK-XXXX)
            </label>
            <input
              type="text"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder="PK-A1B2C3"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
              required
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Tracking Secret Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste 32-character token"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-sm text-[#291D15] bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track</span>
            </button>
          </div>
        </form>

        <p className="text-[11px] text-[#8C7A6D] mt-2">
          Note: Your secret tracking token protects your order privacy and was provided on the confirmation screen.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Tracking Lookup Failed</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Active Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Status Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-[#291D15]">
                  {order.orderNumber}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    order.orderStatus === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.orderStatus === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-xs text-[#786455] mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                  order.deliveryMethod === 'Room Delivery'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                }`}
              >
                {order.deliveryMethod}
              </span>
              <button
                onClick={() => fetchOrderStatus(order.orderNumber, tokenInput)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#F6EFE6] text-[#291D15] hover:bg-[#EFE8DF] transition-colors"
                title="Refresh order status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {/* Cancel button: only allowed when Pending */}
              {order.orderStatus === 'Pending' && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Visual Stepper */}
          <OrderStatusTimeline
            currentStatus={order.orderStatus}
            history={order.statusHistory || []}
            cancellationReason={order.cancellationReason}
            deliveryMethod={order.deliveryMethod}
          />

          {/* Order Details & Room Drop Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery address */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#291D15] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#EA580C]" />
                <span>{order.deliveryMethod === 'Room Delivery' ? 'Room Delivery Location' : 'Pickup Location'}</span>
              </h3>
              <div className="text-xs text-[#5C4A3E] space-y-1.5">
                {order.deliveryMethod === 'Room Delivery' ? (
                  <>
                    <p>
                      <strong className="text-[#291D15]">Recipient:</strong> {order.customerName}
                    </p>
                    <p>
                      <strong className="text-[#291D15]">Contact:</strong> {order.customerPhone}
                    </p>
                    <p>
                      <strong className="text-[#291D15]">Hostel:</strong> {order.hostelName}{' '}
                      {order.hostelBlock ? `(${order.hostelBlock})` : ''}
                    </p>
                    <p>
                      <strong className="text-[#291D15]">Room:</strong> {order.roomNumber}
                    </p>
                    {order.deliveryInstructions && (
                      <p className="italic text-[#786455] pt-1">
                        "{order.deliveryInstructions}"
                      </p>
                    )}
                  </>
                ) : (
                  <p>
                    <strong className="text-[#291D15]">Recipient:</strong> {order.customerName}
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Items breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-[#291D15]">Order Items & Total</h3>
              <div className="divide-y divide-[#F5EFE6] text-xs">
                {order.items.map((item, i) => (
                  <div key={i} className="py-1.5 flex justify-between">
                    <span>
                      <strong className="text-[#EA580C]">{item.quantity}x</strong>{' '}
                      {item.productName}
                    </span>
                    <span className="font-semibold text-[#291D15]">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#F5EFE6] space-y-1 text-xs">
                <div className="flex justify-between text-[#786455]">
                  <span>Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-[#786455]">
                  <span>Room Delivery Fee:</span>
                  <span>₹{order.deliveryFee}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#291D15] pt-1 border-t border-[#F5EFE6]">
                  <span>Total Amount:</span>
                  <span className="text-[#EA580C]">₹{order.total}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#786455] pt-1">
                  <span>Payment:</span>
                  <span className="font-semibold">{order.paymentMethod} ({order.paymentStatus})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EFE8DF] space-y-4">
            <h3 className="font-black text-lg text-[#291D15]">Cancel Snack Order?</h3>
            <p className="text-xs text-[#786455]">
              You can only cancel before the kitchen begins cooking. Please select a reason:
            </p>

            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            >
              <option value="Changed my mind">Changed my mind</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Need to change hostel room details">Need to change room details</option>
              <option value="Roommate ordered already">Roommate ordered already</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#786455] hover:bg-[#F6EFE6]"
              >
                Keep Order
              </button>
              <button
                onClick={handleCustomerCancel}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kitchen Hours & Support Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-[#EFE8DF]">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Kitchen Hours
          </h4>
          <p className="text-sm text-blue-700">
            {settings?.openingTime || '21:00'} - {settings?.closingTime || '05:00'} IST
          </p>
          <p className="text-xs text-blue-600">
            We prepare hot, fresh snacks and deliver directly to your room within {settings?.estimatedDeliveryTime || '15-20 mins'}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
          <h4 className="font-bold text-green-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Quick Support
          </h4>
          <p className="text-sm text-green-700">
            <strong>Call/WhatsApp:</strong>{' '}
            <a
              href={`https://wa.me/${settings?.whatsappPhone?.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-bold hover:underline"
            >
              {settings?.whatsappPhone || '6375157243'}
            </a>
          </p>
          <p className="text-xs text-green-600">
            Available {settings?.openingTime || '21:00'} - {settings?.closingTime || '05:00'} IST for queries
          </p>
        </div>
      </div>
    </div>
  );
};
