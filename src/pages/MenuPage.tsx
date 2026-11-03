import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, UtensilsCrossed, X, Filter } from 'lucide-react';
import { useCustomerProducts } from '../hooks/useCustomerProducts.js';
import { Product } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';
import { ProductGridSkeleton } from '../components/LoadingSkeleton.js';
import { EmptyState } from '../components/EmptyState.js';

interface MenuPageProps {
  onSelectProduct: (product: Product) => void;
}

const CATEGORIES = [
  'All Snacks',
  'Chips',
  'Wafers',
  'Namkeen',
  'Instant Noodles',
  'Candies',
  'Chocolates',
  'Cookies & Biscuits',
  'Drinks',
];

export const MenuPage: React.FC<MenuPageProps> = ({ onSelectProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Snacks');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Fetch products with real-time polling
  const { data: products = [], isLoading, error } = useCustomerProducts({
    category: selectedCategory !== 'All Snacks' ? selectedCategory : undefined,
    search: search || undefined,
    refetchInterval: 1000 * 30, // Poll every 30 seconds for real-time updates
  });

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.sellingPrice || a.price || 0) - (b.sellingPrice || b.price || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.sellingPrice || b.price || 0) - (a.sellingPrice || a.price || 0));
    } else {
      // featured: specials first, then available first
      result.sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.isSpecial !== b.isSpecial) return a.isSpecial ? -1 : 1;
        return (a.sellingPrice || a.price || 0) - (b.sellingPrice || b.price || 0);
      });
    }

    return result;
  }, [products, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#291D15] tracking-tight">
          Hostel Snack Menu
        </h1>
        <p className="text-sm text-[#786455] max-w-xl">
          Everything prepared fresh to order and brought right up to your hostel room.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C7A6D]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search snacks, cheese maggi, burgers..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#EFE8DF] bg-white text-sm text-[#291D15] placeholder-[#8C7A6D] focus:outline-hidden focus:border-[#EA580C] focus:ring-2 focus:ring-[#FFF2E8] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6D] hover:text-[#291D15]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-[#8C7A6D] font-medium hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#EFE8DF] bg-white text-xs font-semibold text-[#291D15] focus:outline-hidden focus:border-[#EA580C]"
          >
            <option value="featured">Featured / Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-2xs ${
                isSelected
                  ? 'bg-[#EA580C] text-white shadow-xs'
                  : 'bg-white text-[#5C4A3E] border border-[#EFE8DF] hover:border-[#EA580C]/40 hover:bg-[#FFFDF9]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Product Grid or Skeleton / Empty */}
      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No snacks match your search"
          description={`We couldn't find anything matching "${search}". Try searching for Lays, Maggi, or Haldirams.`}
          actionText="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedCategory('All Snacks');
          }}
        />
      ) : (
        <div>
          <div className="text-xs text-[#8C7A6D] mb-4">
            Showing {filteredProducts.length} snack{filteredProducts.length !== 1 ? 's' : ''}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
