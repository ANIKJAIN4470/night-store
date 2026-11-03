import React from 'react';
import { Phone, Clock, MapPin, Heart } from 'lucide-react';
import { BusinessSettings } from '../types.js';

interface FooterProps {
  settings?: BusinessSettings | null;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-[#21160F] text-[#D8C7B8] border-t border-[#3A2A20] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#EA580C]">
                <img src="/papis-kitchen-logo.png" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">Papi's Kitchen</span>
            </div>
            <p className="text-sm leading-relaxed text-[#B7A393]">
              The favorite midnight snack delivery kitchen exclusively serving campus hostel rooms. Freshly prepared, delivered hot right to your door.
            </p>
            <div className="pt-2 text-xs text-[#8E7969]">
              <span>Sample products & prices shown are for demonstration and can be customized by the owner.</span>
            </div>
          </div>

          {/* Col 2: Hostels Served */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Hostels Served</h4>
            <ul className="space-y-1.5 text-sm text-[#B7A393]">
              {settings?.acceptedHostels?.slice(0, 5).map((hostel, i) => (
                <li key={i} className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                  <span className="truncate">{hostel}</span>
                </li>
              )) || (
                <>
                  <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> Boys Hostel 1 & 2</li>
                  <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> Girls Hostel 1 & 2</li>
                  <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> PG Block</li>
                </>
              )}
            </ul>
          </div>

          {/* Col 3: Hours & Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Kitchen Hours</h4>
            <div className="space-y-2 text-sm text-[#B7A393]">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Every Night</p>
                  <p className="text-xs">{settings?.openingTime || '17:00'} – {settings?.closingTime || '03:30'} IST</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Phone className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Call or WhatsApp</p>
                  <p className="text-xs">{settings?.contactPhone || '+91 98765 43210'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Quick Actions</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <button
                onClick={() => onNavigate('menu')}
                className="text-left hover:text-[#EA580C] transition-colors"
              >
                Browse Menu
              </button>
              <button
                onClick={() => onNavigate('track')}
                className="text-left hover:text-[#EA580C] transition-colors"
              >
                Track Your Snack
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#3A2A20] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E7969] gap-4">
          <p>© {new Date().getFullYear()} Papi's Kitchen. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" /> for hostel foodies
          </p>
        </div>
      </div>
    </footer>
  );
};
