import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  ArrowRight,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { adminGetAnalytics, adminDownloadExcelReport, adminDownloadPdfReport } from '../../services/api.js';

export const AdminReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetAnalytics({ startDate, endDate });
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const handleDownloadExcel = () => {
    adminDownloadExcelReport({ startDate, endDate });
  };

  const handleDownloadPdf = () => {
    adminDownloadPdfReport({ startDate, endDate });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#EA580C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
            Business Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
            Financial reports, sales analytics, and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EFE8DF] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#EA580C]" />
            <span className="text-xs font-bold text-[#291D15]">Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
            <span className="text-[#786455] text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-[#EA580C] hover:underline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                  Total Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#291D15]">
                ₹{analytics.summary.totalRevenue}
              </div>
              <p className="text-[11px] text-[#786455]">All active orders</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                  Gross Profit
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                ₹{analytics.summary.grossProfit}
              </div>
              <p className="text-[11px] text-[#786455]">Revenue minus COGS</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                  Total Orders
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#FFF2E8] text-[#EA580C] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#291D15]">
                {analytics.summary.totalOrders}
              </div>
              <p className="text-[11px] text-[#786455]">{analytics.summary.activeOrders} active</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#EFE8DF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C7A6D] uppercase tracking-wider">
                  Units Sold
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#291D15]">
                {analytics.summary.totalUnitsSold}
              </div>
              <p className="text-[11px] text-[#786455]">Total items sold</p>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#291D15]">Financial Metrics</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#786455]">Collected Revenue</span>
                  <span className="font-bold text-[#291D15]">₹{analytics.summary.collectedRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Total COGS</span>
                  <span className="font-bold text-[#291D15]">₹{analytics.summary.totalCOGS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Net Profit</span>
                  <span className="font-bold text-emerald-600">₹{analytics.summary.netProfit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Profit Margin</span>
                  <span className="font-bold text-[#EA580C]">{analytics.summary.profitMargin}%</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#F5EFE6]">
                  <span className="text-[#786455]">Completed Orders</span>
                  <span className="font-bold text-emerald-600">{analytics.summary.completedOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Cancelled Orders</span>
                  <span className="font-bold text-red-600">{analytics.summary.cancelledOrders}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#291D15]">Delivery Analytics</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#786455]">Room Delivery Orders</span>
                  <span className="font-bold text-[#291D15]">{analytics.deliveryAnalytics.deliveryOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Self Pickup Orders</span>
                  <span className="font-bold text-[#291D15]">{analytics.deliveryAnalytics.pickupOrders}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#F5EFE6]">
                  <span className="text-[#786455]">Delivery Revenue</span>
                  <span className="font-bold text-purple-600">₹{analytics.deliveryAnalytics.deliveryRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786455]">Pickup Revenue</span>
                  <span className="font-bold text-cyan-600">₹{analytics.deliveryAnalytics.pickupRevenue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Sales Table */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#291D15]">Product Sales Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF7F0] border-b border-[#EFE8DF] text-[#786455] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Units Sold</th>
                    <th className="py-3 px-4">Revenue</th>
                    <th className="py-3 px-4">COGS</th>
                    <th className="py-3 px-4">Gross Profit</th>
                    <th className="py-3 px-4">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {analytics.productAnalytics.productProfitability.map((product: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#FFFDF9]">
                      <td className="py-3 px-4 font-medium text-[#291D15]">{product.productName}</td>
                      <td className="py-3 px-4 text-[#786455]">{product.category}</td>
                      <td className="py-3 px-4 font-bold text-[#291D15]">{product.unitsSold}</td>
                      <td className="py-3 px-4 font-bold text-[#291D15]">₹{product.revenue}</td>
                      <td className="py-3 px-4 text-[#786455]">₹{product.cogs}</td>
                      <td className={`py-3 px-4 font-bold ${product.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₹{product.grossProfit}
                      </td>
                      <td className="py-3 px-4 text-[#786455]">{product.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Selling & Low Selling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Best Selling Products</span>
              </h3>
              <div className="space-y-2">
                {analytics.productAnalytics.bestSellingProducts.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-xl">
                    <div>
                      <p className="font-bold text-sm text-[#291D15]">{product.productName}</p>
                      <p className="text-[11px] text-[#786455]">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#EA580C]">{product.unitsSold} units</p>
                      <p className="text-[10px] text-[#786455]">₹{product.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span>Low Selling Products</span>
              </h3>
              <div className="space-y-2">
                {analytics.productAnalytics.lowSellingProducts.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-xl">
                    <div>
                      <p className="font-bold text-sm text-[#291D15]">{product.productName}</p>
                      <p className="text-[11px] text-[#786455]">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-600">{product.unitsSold} units</p>
                      <p className="text-[10px] text-[#786455]">₹{product.revenue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-[#291D15]">Order Status Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
              {Object.entries(analytics.statusDistribution).map(([status, count]: [string, any]) => (
                <div key={status} className="text-center p-4 bg-[#FFFDF9] rounded-xl">
                  <p className="text-2xl font-black text-[#291D15]">{count}</p>
                  <p className="text-[11px] text-[#786455] mt-1">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
