import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Clock,
  Phone,
  Power,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  Bell,
  Loader2,
} from 'lucide-react';
import { adminGetSettings, adminUpdateSettings } from '../../services/api.js';
import { BusinessSettings } from '../../types.js';

interface AdminSettingsPageProps {
  onSettingsUpdated?: (settings: BusinessSettings) => void;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({ onSettingsUpdated }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('17:00');
  const [closingTime, setClosingTime] = useState('03:30');
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number>(15);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(50);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('20-30 mins');
  const [acceptedHostels, setAcceptedHostels] = useState<string[]>([]);
  const [newHostelInput, setNewHostelInput] = useState('');
  const [announcement, setAnnouncement] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetSettings();
      setSettings(data);
      setBusinessName(data.businessName || "Papi's Kitchen");
      setTagline(data.tagline || 'Hot & Fresh Snacks, Delivered to Your Hostel Room!');
      setContactPhone(data.contactPhone || '6375157243');
      setWhatsappPhone(data.whatsappPhone || '6375157243');
      setOpeningTime(data.openingTime || '21:00'); // 9 PM
      setClosingTime(data.closingTime || '05:00');  // 5 AM
      setIsOpen(data.isOpen !== false);
      setDeliveryFee(data.deliveryFee ?? 15);
      setMinOrderAmount(data.minOrderAmount ?? 50);
      setEstimatedDeliveryTime(data.estimatedDeliveryTime || '15-20 mins');
      setAcceptedHostels(data.acceptedHostels || ['Tagore Bhawan - C (Block A)', 'Tagore Bhawan - C (Block B)', 'Tagore Bhawan - C (Block C)']);
      setAnnouncement(data.announcement || '🔥 Hot & fresh delivered right to your room! Call 6375157243');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddHostel = () => {
    if (!newHostelInput.trim()) return;
    if (acceptedHostels.includes(newHostelInput.trim())) return;
    setAcceptedHostels([...acceptedHostels, newHostelInput.trim()]);
    setNewHostelInput('');
  };

  const handleRemoveHostel = (hostel: string) => {
    setAcceptedHostels(acceptedHostels.filter((h) => h !== hostel));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const updated = await adminUpdateSettings({
        businessName,
        tagline,
        contactPhone,
        whatsappPhone,
        openingTime,
        closingTime,
        isOpen,
        deliveryFee,
        minOrderAmount,
        estimatedDeliveryTime,
        acceptedHostels,
        announcement,
      });

      setSettings(updated.settings);
      setSavedSuccess(true);
      if (onSettingsUpdated) {
        onSettingsUpdated(updated.settings);
      }
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-[#786455]">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
            Business Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
            Manage store timings, delivery fee, covered hostels, and cash-on-delivery orders.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully! Customers will see updated details immediately.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-900 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Store Open / Paused Override Switch */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
            <Power className="w-4 h-4 text-[#EA580C]" />
            <span>Store Master Switch</span>
          </h3>
          <p className="text-xs text-[#786455] mt-1">
            Toggle this off to immediately pause incoming orders (e.g. during heavy rush or stock replenish).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            isOpen
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-neutral-200 text-neutral-700'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-white' : 'bg-neutral-500'}`} />
          <span>{isOpen ? 'Store is OPEN' : 'Store is PAUSED (Closed)'}</span>
        </button>
      </div>

      {/* 2. Brand & Contact Details */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#291D15]">Brand & Contact Info</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Contact Phone Number
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
          </div>
        </div>
      </div>

      {/* 3. Operating Hours & Delivery Estimates */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#EA580C]" />
          <span>Hours & Timing</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Kitchen Opening Time
            </label>
            <input
              type="text"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              placeholder="17:00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Kitchen Closing Time
            </label>
            <input
              type="text"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              placeholder="03:30"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              value={estimatedDeliveryTime}
              onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
              placeholder="20-30 mins"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
            />
          </div>
        </div>
      </div>

      {/* 4. Pricing & Delivery Charges */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#EA580C]" />
          <span>Delivery Fee & Minimum Order</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Room Delivery Fee (₹)
            </label>
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4A3B32] mb-1">
              Minimum Order Amount (₹)
            </label>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
              required
            />
          </div>
        </div>
      </div>

      {/* 5. Accepted Hostels List */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#EA580C]" />
          <span>Accepted Hostel Delivery Areas</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newHostelInput}
            onChange={(e) => setNewHostelInput(e.target.value)}
            placeholder="e.g. Boys Hostel 4 (BH-4)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
          />
          <button
            type="button"
            onClick={handleAddHostel}
            className="bg-[#EA580C] hover:bg-[#C2410C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
          >
            Add Hostel
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {acceptedHostels.map((hostel, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[#F6EFE6] px-3 py-1.5 rounded-xl text-xs font-medium text-[#291D15]"
            >
              <span>{hostel}</span>
              <button
                type="button"
                onClick={() => handleRemoveHostel(hostel)}
                className="text-[#8C7A6D] hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#EFE8DF] shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-[#291D15] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#EA580C]" />
          <span>Announcement Banner (Top of Website)</span>
        </h3>

        <input
          type="text"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="e.g. Exam season special: Free Peri-Peri dips with orders above ₹150!"
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#EFE8DF] text-xs bg-[#FFFDF9]"
        />
        <p className="text-[11px] text-[#8C7A6D]">
          Leave blank if no announcement banner is needed.
        </p>
      </div>

      {/* Save Button bottom */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save All Settings</span>
        </button>
      </div>
    </form>
  );
};
