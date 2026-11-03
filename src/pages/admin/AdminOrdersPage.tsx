import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  Phone,
  Home,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Banknote,
  Bike,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  adminGetOrders,
  adminUpdateOrderStatus,
  adminUpdatePayment,
  adminCancelOrder,
} from '../../services/api.js';
import { Order, OrderStatus, PaymentStatus } from '../../types.js';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetOrders({
        status: statusFilter,
        search,
        date: dateFilter || undefined,
        page,
        limit: 15,
      });
      setOrders(res.orders);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(true);
    try {
      const res = await adminUpdateOrderStatus(orderId, newStatus);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder(res.order);
      }
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    setActionLoading(true);
    try {
      const res = await adminUpdatePayment(orderId, newPaymentStatus);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder(res.order);
      }
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedOrder) return;
    if (!cancelReason.trim()) {
      alert('Please specify a cancellation reason');
      return;
    }
    setActionLoading(true);
    try {
      const res = await adminCancelOrder(selectedOrder.id || selectedOrder.orderNumber, cancelReason);
      setSelectedOrder(res.order);
      setShowCancelDialog(false);
      setCancelReason('');
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
            Orders Management
          </h1>
          <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
            Manage student room tickets, cooking pipeline, and dispatch riders.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-[#EFE8DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#291D15] hover:bg-[#F6EFE6] transition-colors self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DF] shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6D]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, student name, phone, or room..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9] focus:outline-hidden focus:border-[#EA580C]"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9] font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending (New)</option>
              <option value="Accepted">Accepted</option>
              <option value="Preparing">Preparing (Kitchen)</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Ready for Pickup">Ready for Pickup</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#EFE8DF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FBF7F0] border-b border-[#EFE8DF] text-[#786455] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer & Room</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EFE6]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C7A6D]">
                    {loading ? 'Loading orders...' : 'No orders found matching your filters.'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.orderNumber}
                    className="hover:bg-[#FFFDF9] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-black text-[#291D15] whitespace-nowrap">
                      {order.orderNumber}
                      <span className="block text-[10px] font-normal text-[#8C7A6D]">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#291D15]">{order.customerName}</div>
                      <div className="text-[11px] text-[#786455]">
                        {order.hostelName} · {order.roomNumber || 'N/A'}
                      </div>
                      <div className="text-[11px] text-[#8C7A6D]">{order.customerPhone}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                          order.deliveryMethod === 'Room Delivery'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}
                      >
                        {order.deliveryMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-[#5C4A3E]">
                        {order.items?.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </div>
                      <span className="text-[10px] text-[#8C7A6D]">
                        {order.items?.length} snack{order.items?.length !== 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-black text-[#291D15] whitespace-nowrap">
                      ₹{order.total}
                      <span className="block text-[10px] font-normal text-[#8C7A6D]">
                        {order.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          order.orderStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.orderStatus === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.orderStatus === 'Preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : order.orderStatus === 'Out for Delivery'
                            ? 'bg-purple-100 text-purple-800'
                            : order.orderStatus === 'Ready for Pickup'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                          order.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 bg-[#FFF2E8] hover:bg-[#EA580C] text-[#EA580C] hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#EFE8DF] flex items-center justify-between text-xs text-[#786455]">
            <span>
              Page {page} of {totalPages} ({total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#EFE8DF] disabled:opacity-40 hover:bg-[#F6EFE6]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#EFE8DF] disabled:opacity-40 hover:bg-[#F6EFE6]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#EFE8DF] shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F5EFE6]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xl text-[#291D15]">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      selectedOrder.orderStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.orderStatus === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {selectedOrder.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-[#786455] mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#8C7A6D] hover:text-[#291D15] p-2"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Action Buttons */}
            {selectedOrder.orderStatus !== 'Cancelled' && (
              <div className="bg-[#FFFDF9] border border-[#F5EFE6] p-4 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-xs text-[#4A3B32] uppercase tracking-wider">
                  Update Order Pipeline Status:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedOrder.id || selectedOrder.orderNumber,
                        'Accepted'
                      )
                    }
                    disabled={actionLoading || selectedOrder.orderStatus !== 'Pending'}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white transition-colors"
                  >
                    Accept / Confirm
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedOrder.id || selectedOrder.orderNumber,
                        'Preparing'
                      )
                    }
                    disabled={
                      actionLoading ||
                      (selectedOrder.orderStatus !== 'Pending' &&
                        selectedOrder.orderStatus !== 'Accepted')
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
                  >
                    Cooking in Kitchen
                  </button>

                  {selectedOrder.deliveryMethod === 'Room Delivery' ? (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          selectedOrder.id || selectedOrder.orderNumber,
                          'Out for Delivery'
                        )
                      }
                      disabled={
                        actionLoading ||
                        (selectedOrder.orderStatus !== 'Preparing' &&
                          selectedOrder.orderStatus !== 'Accepted')
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition-colors"
                    >
                      Send to Hostel Room
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleStatusChange(
                          selectedOrder.id || selectedOrder.orderNumber,
                          'Ready for Pickup'
                        )
                      }
                      disabled={
                        actionLoading ||
                        (selectedOrder.orderStatus !== 'Preparing' &&
                          selectedOrder.orderStatus !== 'Accepted')
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white transition-colors"
                    >
                      Mark Ready for Pickup
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedOrder.id || selectedOrder.orderNumber,
                        'Completed'
                      )
                    }
                    disabled={
                      actionLoading ||
                      selectedOrder.orderStatus === 'Completed'
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors"
                  >
                    {selectedOrder.deliveryMethod === 'Room Delivery' ? 'Mark Delivered' : 'Mark Collected'}
                  </button>

                  <button
                    onClick={() => setShowCancelDialog(true)}
                    disabled={
                      actionLoading ||
                      selectedOrder.orderStatus === 'Completed'
                    }
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 transition-colors ml-auto"
                  >
                    {selectedOrder.orderStatus === 'Pending' ? 'Reject Order' : 'Cancel Order'}
                  </button>
                </div>
              </div>
            )}

            {/* Payment Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FBF7F0] border border-[#EFE8DF] text-xs">
              <div>
                <span className="font-bold text-[#291D15]">
                  Payment: {selectedOrder.paymentMethod}
                </span>
                <span className="block text-[#786455]">
                  Current Status:{' '}
                  <strong className="text-[#291D15]">{selectedOrder.paymentStatus}</strong>
                </span>
              </div>
              <div className="flex gap-2">
                {selectedOrder.paymentStatus !== 'Paid' ? (
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(
                        selectedOrder.id || selectedOrder.orderNumber,
                        'Paid'
                      )
                    }
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Mark Cash Collected
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(
                        selectedOrder.id || selectedOrder.orderNumber,
                        'Pending'
                      )
                    }
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-xl font-bold bg-neutral-200 text-[#4A3B32] hover:bg-neutral-300 transition-colors"
                  >
                    Revert to Pending
                  </button>
                )}
              </div>
            </div>

            {/* Student & Delivery Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-[#EFE8DF] space-y-1">
                <span className="font-bold text-[#8C7A6D] uppercase text-[10px]">
                  Student Details
                </span>
                <p className="font-black text-sm text-[#291D15]">
                  {selectedOrder.customerName}
                </p>
                <p className="text-[#EA580C] font-semibold">{selectedOrder.customerPhone}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EFE8DF] space-y-1">
                <span className="font-bold text-[#8C7A6D] uppercase text-[10px]">
                  {selectedOrder.deliveryMethod === 'Room Delivery' ? 'Room Drop Destination' : 'Pickup Location'}
                </span>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      selectedOrder.deliveryMethod === 'Room Delivery'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}
                  >
                    {selectedOrder.deliveryMethod}
                  </span>
                </div>
                {selectedOrder.deliveryMethod === 'Room Delivery' ? (
                  <>
                    <p className="font-bold text-[#291D15]">{selectedOrder.hostelName}</p>
                    <p className="text-[#5C4A3E]">
                      Block: {selectedOrder.hostelBlock || 'N/A'} · Room:{' '}
                      <strong>{selectedOrder.roomNumber}</strong>
                    </p>
                    {selectedOrder.deliveryInstructions && (
                      <p className="italic text-[#786455] pt-1">
                        "{selectedOrder.deliveryInstructions}"
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[#5C4A3E]">
                    Customer will collect from shop
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#8C7A6D] uppercase tracking-wider">
                Ordered Items
              </h4>
              <div className="divide-y divide-[#F5EFE6] text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-[#EA580C]">{item.quantity}x</span>{' '}
                      <span className="font-medium text-[#291D15]">{item.productName}</span>
                    </div>
                    <span className="font-bold text-[#291D15]">₹{item.subtotal}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-[#F5EFE6] flex justify-between font-black text-sm text-[#291D15]">
                <span>Total Amount:</span>
                <span className="text-[#EA580C]">₹{selectedOrder.total}</span>
              </div>
            </div>

            {/* Status History Audit Log */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F5EFE6]">
                <h4 className="font-bold text-xs text-[#8C7A6D] uppercase tracking-wider">
                  Audit History
                </h4>
                <div className="space-y-1 text-[11px] text-[#786455]">
                  {selectedOrder.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5">
                      <span>
                        Status changed to <strong>{h.status}</strong>
                        {h.note ? ` (${h.note})` : ''}
                      </span>
                      <span className="text-[#A8907E]">
                        {new Date(h.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EFE8DF] space-y-4">
            <h3 className="font-black text-lg text-[#291D15]">Cancel Order with Reason</h3>
            <p className="text-xs text-[#786455]">
              Please state why this order is being cancelled (visible in status tracking):
            </p>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Out of stock ingredient, hostel gate inaccessible"
              className="w-full px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#786455] hover:bg-[#F6EFE6]"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700"
              >
                {actionLoading ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
