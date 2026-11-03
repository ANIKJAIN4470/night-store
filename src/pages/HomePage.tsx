import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Search,
  Clock,
  ShieldCheck,
  MapPin,
  Flame,
  CheckCircle2,
  Bike,
  Coffee,
  Sandwich,
  ChevronRight,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import { Product, BusinessSettings } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';
import { getAvailableCoupons } from '../services/api.js';

interface HomePageProps {
  products: Product[];
  settings?: BusinessSettings | null;
  onNavigate: (view: string, category?: string) => void;
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES = [
  { name: 'Maggi', icon: '🍜', label: 'Maggi & Noodles' },
  { name: 'Sandwiches', icon: '🥪', label: 'Grilled Sandwiches' },
  { name: 'Burgers', icon: '🍔', label: 'Burgers' },
  { name: 'Fries', icon: '🍟', label: 'Crispy Fries' },
  { name: 'Indian Snacks', icon: '🥟', label: 'Samosa & Pakora' },
  { name: 'Beverages', icon: '🥤', label: 'Chilled Drinks & Coffee' },
  { name: 'Combos', icon: '🍱', label: 'Study Combos' },
];

export const HomePage: React.FC<HomePageProps> = ({
  products,
  settings,
  onNavigate,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    getAvailableCoupons().then(data => setCoupons(data.coupons || [])).catch(() => {});
  }, []);

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const specials = products.filter((p) => p.isSpecial && p.available).slice(0, 4);
  const bestSellers = products.filter((p) => p.available).slice(0, 6);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('menu');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#21130d] rounded-3xl sm:rounded-4xl p-6 sm:p-12 lg:p-16 border border-[#41251a] relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(234,88,12,.35),transparent_35%),linear-gradient(110deg,#21130d_35%,rgba(33,19,13,.72))] pointer-events-none" />
            {bestSellers[0] && (
              <img
                src={bestSellers[0].imageUrl}
                alt=""
                className="absolute right-[-8%] bottom-[-8%] hidden lg:block w-[52%] h-[112%] object-cover opacity-80 [mask-image:linear-gradient(to_right,transparent,black_35%)]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/papis-kitchen-logo.png';
                  e.currentTarget.classList.add('object-contain', 'p-16');
                }}
              />
            )}

            <div className="relative z-10 max-w-3xl space-y-6">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 shadow-xs text-xs font-bold text-[#ffb36b]">
                <Sparkles className="w-4 h-4 fill-[#EA580C]" />
                <span>Hostel Midnight Cravings Solved</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Late-night cravings? <br className="hidden sm:inline" />
                <span className="text-[#ff6a1a]">We've got you.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#f0d9c6] leading-relaxed max-w-2xl font-normal">
                Your favourite snacks, delivered straight to your hostel room. Hot, fresh, and ready whenever the craving hits.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('menu')}
                  className="flex items-center justify-center gap-2 bg-[#f05a17] hover:bg-[#ff762e] text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-[#EA580C]/25 transition-all active:scale-98"
                >
                  <span>Order Snacks Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onNavigate('track')}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-base px-6 py-4 rounded-2xl transition-all"
                >
                  <span>Track Live Order</span>
                </button>
              </div>

              {/* Key Highlights */}
              <div className="pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-[#f0d9c6]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No account needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cash on Delivery</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct room delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS SECTION */}
      {coupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFFBF5] rounded-3xl p-6 sm:p-8 border border-[#FED7AA] shadow-xs">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EA580C] flex items-center justify-center text-white">
                <Tag className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#291D15]">
                  Active Offers & Coupons
                </h2>
                <p className="text-xs text-[#786455]">Save on your next order with these codes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon.code} className="bg-white rounded-2xl p-4 border border-[#EFE8DF] shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-2xl font-black text-[#EA580C]">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </span>
                      <span className="text-xs text-[#786455] ml-1">OFF</span>
                    </div>
                    <button
                      onClick={() => copyCouponCode(coupon.code)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#EA580C] hover:text-[#C2410C] bg-[#FFF2E8] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#F5F1EA] rounded-lg px-3 py-2 mb-2">
                    <code className="text-sm font-black text-[#291D15]">{coupon.code}</code>
                  </div>
                  {coupon.minOrderAmount && (
                    <p className="text-xs text-[#786455]">Min order ₹{coupon.minOrderAmount}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* QUICK CATEGORY SELECTOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
              Browse Categories
            </h2>
            <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
              Choose your craving from our student-favorite menu
            </p>
          </div>
          <button
            onClick={() => onNavigate('menu')}
            className="text-xs sm:text-sm font-bold text-[#EA580C] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onNavigate('menu', cat.name)}
              className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#EFE8DF] hover:border-[#EA580C] hover:shadow-md transition-all group text-center"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="font-bold text-xs sm:text-sm text-[#291D15] group-hover:text-[#EA580C]">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* TODAY'S CHEF SPECIALS */}
      {specials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF2E8] flex items-center justify-center text-[#EA580C]">
                <Flame className="w-4 h-4 fill-[#EA580C]" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
                  Today's Chef Specials
                </h2>
                <p className="text-xs sm:text-sm text-[#786455]">
                  Student favorites hand-crafted for quick room delivery
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('menu')}
              className="text-xs sm:text-sm font-bold text-[#EA580C] hover:underline flex items-center gap-1"
            >
              <span>See Menu</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specials.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* HOW ROOM DELIVERY WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#291D15] text-white rounded-3xl sm:rounded-4xl p-8 sm:p-12 lg:p-14 relative overflow-hidden">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
              Super Simple & Fast
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-1 text-white">
              How Room Delivery Works
            </h2>
            <p className="text-sm text-[#B7A393] mt-2">
              No hostel student wants complicated ordering during study hours. We made it frictionless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white font-black text-xl">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Choose Your Snacks</h3>
              <p className="text-xs text-[#B7A393] leading-relaxed">
                Browse our fresh snack menu, pick your favorite Maggi or sandwiches, and add them to your cart.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white font-black text-xl">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Enter Hostel & Room #</h3>
              <p className="text-xs text-[#B7A393] leading-relaxed">
                Provide your name, phone number, hostel name, block, and exact room number. No sign-up required!
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white font-black text-xl">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Receive & Pay at Door</h3>
              <p className="text-xs text-[#B7A393] leading-relaxed">
                Our kitchen runner delivers right to your door. Pay conveniently with Cash on Delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SNACKS GRID */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#291D15] tracking-tight">
                Most Ordered Right Now
              </h2>
              <p className="text-xs sm:text-sm text-[#786455] mt-0.5">
                Popular snacks hot off the griddle and fryer
              </p>
            </div>
            <button
              onClick={() => onNavigate('menu')}
              className="text-xs sm:text-sm font-bold text-[#EA580C] hover:underline flex items-center gap-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* HOSTEL COVERAGE & NOTICE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#EFE8DF] p-6 sm:p-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#EA580C] uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              <span>Campus Delivery Zone</span>
            </div>
            <h3 className="text-2xl font-black text-[#291D15] tracking-tight">
              Delivering directly to hostel rooms every night
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
              We cover all major campus hostels with dedicated delivery runners who know every floor and wing. Need special instructions like "Call before reaching lobby"? Just note it down during checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('menu')}
              className="w-full sm:w-auto bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all text-center"
            >
              View Full Snack Menu
            </button>
            <button
              onClick={() => onNavigate('track')}
              className="w-full sm:w-auto bg-[#F6EFE6] hover:bg-[#EFE8DF] text-[#291D15] font-bold text-sm px-6 py-3.5 rounded-xl transition-all text-center"
            >
              Track an Order
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
