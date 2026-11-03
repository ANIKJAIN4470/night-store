import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';
import { customerGetOrders } from '../services/api.js';
import { Order } from '../types.js';

export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/account/orders');
      return;
    }

    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await customerGetOrders({ status: selectedStatus });
        setOrders(data.orders);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, navigate, selectedStatus]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/account')}
            className="p-2 hover:bg-[#F6EFE6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#5C4A3E]" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-[#291D15] tracking-tight">My Order History</h1>
            <p className="text-sm text-[#786455] mt-1">Track and manage your Papi's Kitchen orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-[#EFE8DF] mb-6">
          <div className="flex flex-wrap gap-2">
            {['All', 'Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                  selectedStatus === status
                    ? 'bg-[#EA580C] text-white'
                    : 'bg-[#F6EFE6] text-[#291D15] hover:bg-[#EFE8DF]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-[#EA580C] animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#EFE8DF] text-center">
            <ShoppingBag className="w-16 h-16 text-[#D4AF9F] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#291D15] mb-2">No orders yet</h2>
            <p className="text-sm text-[#786455] mb-6">Start ordering delicious snacks from Papi's Kitchen</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/track-order?order=${order.orderNumber}&token=${order.trackingToken}`)}
                className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EFE8DF] hover:border-[#EA580C] hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-[#291D15]">{order.orderNumber}</h3>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#FFF2E8] text-[#EA580C]">
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-[#786455]">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#291D15]">₹{order.total.toFixed(2)}</p>
                    <p className="text-xs text-[#786455] flex items-center gap-1 justify-end mt-1">
                      <Clock className="w-3 h-3" />
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
