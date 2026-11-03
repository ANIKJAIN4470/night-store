import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  ChefHat,
  Bike,
  CheckCircle2,
  TrendingUp,
  Banknote,
  AlertCircle,
  ArrowRight,
  Database,
  RefreshCw,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';
import { adminGetDashboard } from '../../services/api.js';
import { Order } from '../../types.js';

interface AdminDashboardPageProps {
  onNavigateTab: (tab: 'orders' | 'products' | 'settings') => void;
  onViewOrder: (order: Order) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateTab,
  onViewOrder,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminGetDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = data?.stats;
  const dbStatus = data?.database;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
            Kitchen Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
            Real-time orders, hostel deliveries, and revenue recorded today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-[#EFE8DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#291D15] hover:bg-[#F6EFE6] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Database Mode Card */}
      {dbStatus && (
        <div className="p-4 rounded-2xl bg-white border border-[#EFE8DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${dbStatus.isMongoConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#291D15]">Active Database: </span>
              <span className="font-semibold text-[#5C4A3E]">{dbStatus.databaseType}</span>
              {!dbStatus.isMongoConnected && (
                <p className="text-[11px] text-[#8C7A6D]">
                  Running in resilient local persistent mode. To connect MongoDB Atlas in production, set <code className="bg-[#F5EFE6] px-1 py-0.5 rounded-sm">MONGODB_URI</code> in environment variables.
                </p>
              )}
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] self-start sm:self-auto ${dbStatus.isMongoConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {dbStatus.isMongoConnected ? 'MongoDB Live' : 'Local Storage Mode'}
          </span>
        </div>
      )}

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today's Orders */}
        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
              Today's Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF2E8] text-[#EA580C] flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#291D15]">
            {stats ? stats.totalOrdersToday : '—'}
          </div>
          <p className="text-[11px] text-[#786455]">All orders placed today</p>
        </div>

        {/* Needs Confirmation */}
        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
              Awaiting Action
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {stats ? stats.awaitingConfirmation : '—'}
          </div>
          <p className="text-[11px] text-[#786455]">Newly placed student tickets</p>
        </div>

        {/* In Kitchen Preparing */}
        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
              In Kitchen
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600">
            {stats ? stats.inKitchenPreparing : '—'}
          </div>
          <p className="text-[11px] text-[#786455]">Currently cooking/grilling</p>
        </div>

        {/* Out for Delivery */}
        <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
              Out to Rooms
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600">
            {stats ? stats.outForDelivery : '—'}
          </div>
          <p className="text-[11px] text-[#786455]">Dispatched to hostel wings</p>
        </div>
      </div>

      {/* Revenue & Value Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Order Value */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                Today's Recorded Order Value
              </span>
              <div className="text-3xl font-black text-[#291D15] mt-1">
                ₹{stats ? stats.todayOrderValue : 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#EA580C] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#786455]">
            Total value of all active snack orders placed today (excluding cancellations).
          </p>
        </div>

        {/* Actual Collected Cash */}
        <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                Actual Collected Revenue
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                ₹{stats ? stats.todayCollectedRevenue : 0}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#786455]">
            Actual money collected and verified upon room delivery.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-5 rounded-2xl bg-white border border-[#EFE8DF] hover:border-[#EA580C] hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2E8] text-[#EA580C] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#291D15] group-hover:text-[#EA580C]">
                Manage Incoming Orders
              </h3>
              <p className="text-xs text-[#786455]">
                Change status, mark payments collected, dispatch room runners
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8C7A6D] group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigateTab('products')}
          className="p-5 rounded-2xl bg-white border border-[#EFE8DF] hover:border-[#EA580C] hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2E8] text-[#EA580C] flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#291D15] group-hover:text-[#EA580C]">
                Edit Snack Menu & Prices
              </h3>
              <p className="text-xs text-[#786455]">
                Add snacks, mark sold-out items, modify demo prices
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#8C7A6D] group-hover:text-[#EA580C] group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {false && (
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-[#291D15]">Recent Orders</h2>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-[#EA580C] hover:underline"
          >
            View All Orders →
          </button>
        </div>

        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="divide-y divide-[#F5EFE6]">
            {stats.recentOrders.map((ord: any) => (
              <div
                key={ord.orderNumber}
                onClick={() => onViewOrder(ord)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FFFDF9] cursor-pointer rounded-xl px-2 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#291D15]">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs text-[#786455]">
                      {ord.customerName} · {ord.hostelName} ({ord.roomNumber})
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8C7A6D] mt-0.5">
                    {ord.items?.length} items · Total ₹{ord.total} · {ord.paymentMethod}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      ord.orderStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.orderStatus === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {ord.orderStatus}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      ord.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {ord.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-[#8C7A6D]">
            No orders recorded yet. Place an order on the store to see it live here!
          </div>
        )}
      </div>
      )}
    </div>
  );
};
