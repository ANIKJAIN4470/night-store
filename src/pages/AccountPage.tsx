import React, { useState, useEffect } from 'react';
import { Home, LogOut, Lock, User, Award, ShoppingBag, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext.js';
import { customerChangePassword, customerGetOrders } from '../services/api.js';

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, logout, isAuthenticated } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'rewards' | 'password'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    if (!isAuthenticated) navigate('/login?returnTo=/account');
    const tab = new URLSearchParams(location.search).get('tab') as any;
    if (tab && ['profile', 'orders', 'rewards', 'password'].includes(tab)) setActiveTab(tab);
  }, [isAuthenticated, navigate, location.search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await customerGetOrders({ page: 1, limit: 50 });
      setOrders(data.orders);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load orders' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('papis_customer_token');
      const data = await fetch('/api/customer/rewards', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      setRewards(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load rewards' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setLoading(true);
    try {
      await customerChangePassword(currentPassword, newPassword, confirmPassword);
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Password change failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate('/');
  };

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] to-[#F9F4EC]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-[#EFE8DF] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-[#EA580C] hover:text-[#C2410C] font-bold text-sm">
            <Home className="w-4 h-4" />
            Menu
          </button>
          <h1 className="text-2xl font-black text-[#291D15]">{customer.name}'s Account</h1>
          <button onClick={handleLogout} disabled={loading} className="text-red-600 hover:text-red-700 font-bold text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <LogOut className="w-4 h-4 inline mr-1" />}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] rounded-3xl p-8 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Welcome back,</p>
          <h2 className="text-4xl font-black">{customer.name}</h2>
          <p className="text-sm opacity-90 mt-3">{customer.email} • {customer.phone}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 flex-wrap">
          {(['profile', 'orders', 'rewards', 'password'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMessage(null); if (tab === 'orders') fetchOrders(); if (tab === 'rewards') fetchRewards(); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition ${
                activeTab === tab
                  ? 'bg-[#EA580C] text-white shadow-lg'
                  : 'bg-white border border-[#EFE8DF] text-[#4A3B32] hover:border-[#EA580C]'
              }`}
            >
              {tab === 'profile' && <User className="w-4 h-4" />}
              {tab === 'orders' && <ShoppingBag className="w-4 h-4" />}
              {tab === 'rewards' && <Award className="w-4 h-4" />}
              {tab === 'password' && <Lock className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-lg space-y-6">
            <h2 className="text-2xl font-black text-[#291D15]">Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">Full Name</label>
                <div className="px-4 py-3 rounded-xl border border-[#EFE8DF] bg-[#F5F1EA] text-[#291D15] font-semibold">{customer.name}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">Phone</label>
                <div className="px-4 py-3 rounded-xl border border-[#EFE8DF] bg-[#F5F1EA] text-[#291D15] font-semibold">{customer.phone}</div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">Email</label>
                <div className="px-4 py-3 rounded-xl border border-[#EFE8DF] bg-[#F5F1EA] text-[#291D15] font-semibold">{customer.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-lg">
            <h2 className="text-2xl font-black text-[#291D15] mb-6">My Orders</h2>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#EA580C]" /></div>
            ) : orders.length === 0 ? (
              <p className="text-center py-12 text-[#786455]">No orders yet. <button onClick={() => navigate('/')} className="text-[#EA580C] font-bold hover:underline">Order now!</button></p>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order.id} className="border border-[#EFE8DF] rounded-2xl p-6 hover:border-[#EA580C] hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-black text-lg text-[#291D15]">{order.orderNumber}</h4>
                        <p className="text-xs text-[#786455]">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-2xl text-[#EA580C]">₹{order.total}</p>
                        <p className={`text-xs font-bold mt-1 ${order.orderStatus === 'Delivered' ? 'text-green-600' : order.orderStatus === 'Cancelled' ? 'text-red-600' : 'text-amber-600'}`}>{order.orderStatus}</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#786455] mb-4">{order.items.length} item(s) • {order.paymentStatus}</p>
                    <button onClick={() => navigate(`/track-order?order=${order.orderNumber}&token=${order.trackingToken}`)} className="text-sm font-black text-[#EA580C] hover:text-[#C2410C] transition">
                      Track Order →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-lg">
            <h2 className="text-2xl font-black text-[#291D15] mb-6">My Rewards</h2>
            {loading ? (
              <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#EA580C]" /></div>
            ) : rewards ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] rounded-2xl p-8 text-white">
                  <p className="text-sm opacity-90 mb-2">Your Reward Points</p>
                  <h3 className="text-5xl font-black">{rewards.points}</h3>
                </div>
                {rewards.nextMilestone && (
                  <div className="border border-[#EFE8DF] rounded-2xl p-6">
                    <p className="text-sm font-black text-[#4A3B32] mb-4">Next Reward: {rewards.nextMilestone.reward}</p>
                    <div className="w-full bg-[#EFE8DF] rounded-full h-3 mb-3 overflow-hidden"><div className="bg-gradient-to-r from-[#EA580C] to-[#C2410C] h-3 rounded-full transition-all" style={{width: `${Math.min((rewards.points / rewards.nextMilestone.pointsRequired) * 100, 100)}%`}} /></div>
                    <p className="text-xs text-[#786455]">Need {rewards.nextMilestone.pointsNeeded} more points</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center py-12 text-[#786455]">Failed to load rewards</p>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-3xl p-8 border border-[#EFE8DF] shadow-lg">
            <h2 className="text-2xl font-black text-[#291D15] mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">Current Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords.current ? 'text' : 'password'} 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-[#291D15] focus:outline-none focus:border-[#EA580C]"
                  />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786455]">
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">New Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords.new ? 'text' : 'password'} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-[#291D15] focus:outline-none focus:border-[#EA580C]"
                  />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786455]">
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A3B32] mb-2">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showPasswords.confirm ? 'text' : 'password'} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[#EFE8DF] text-[#291D15] focus:outline-none focus:border-[#EA580C]"
                  />
                  <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#786455]">
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold py-3 rounded-xl transition">
                {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : ''}Change Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
