import React from 'react';
import { Plus, Minus, Check, Flame } from 'lucide-react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { items, addToCart, updateQuantity } = useCart();

  const cartItem = items.find((i) => i.product.id === product.id);
  const qtyInCart = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.available) return;
    addToCart(product, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qtyInCart > 0) {
      updateQuantity(product.id, qtyInCart - 1);
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col overflow-hidden ${
        product.available
          ? 'border-[#EFE8DF] hover:border-[#EA580C]/40 hover:shadow-md'
          : 'border-neutral-200 opacity-70 cursor-not-allowed bg-neutral-50'
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full bg-gradient-to-br from-[#F5EFE6] to-[#E8DED2] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const image = e.currentTarget;
            image.onerror = null;
            image.src = '/papis-kitchen-logo.png';
            image.classList.add('object-contain', 'p-8');
          }}
        />

        {/* Veg badge in top-left */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs p-1 rounded-sm shadow-xs border border-emerald-600/30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" title="100% Vegetarian" />
        </div>

        {/* Special tag */}
        {product.isSpecial && product.available && (
          <div className="absolute top-2.5 right-2.5 bg-[#EA580C] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Flame className="w-3 h-3 fill-white" />
            <span>Popular</span>
          </div>
        )}

        {/* Sold out overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-md shadow-md">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#8C7A6D] uppercase tracking-wider">
              {product.category}
            </span>
          </div>

          <h3 className="font-bold text-base text-[#291D15] group-hover:text-[#EA580C] transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-[#6B5A4E] mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add Action */}
        <div className="mt-4 pt-3 border-t border-[#F5EFE6] flex items-center justify-between gap-2">
          <div className="flex-1">
            <span className="text-xs text-[#8C7A6D] font-semibold">Price</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {product.mrp && product.sellingPrice ? (
                <>
                  <span className="text-xs line-through text-[#999] font-medium">
                    ₹{product.mrp}
                  </span>
                  <span className="text-lg font-black text-[#EA580C]">
                    ₹{product.sellingPrice}
                  </span>
                  {product.sellingPrice > product.mrp && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      +₹{(product.sellingPrice - product.mrp).toFixed(0)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg font-black text-[#291D15]">
                  ₹{product.price}
                </span>
              )}
            </div>
          </div>

          {/* Stock Status & Add Action */}
          <div className="flex flex-col items-end gap-1">
            {product.stock !== undefined && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                product.stock > 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {product.stock > 0 ? `${product.stock} left` : 'Out of Stock'}
              </span>
            )}
            
            {product.available && product.stock > 0 ? (
              qtyInCart === 0 ? (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 bg-[#FFF2E8] hover:bg-[#EA580C] text-[#EA580C] hover:text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-[#FDBA74]/50 hover:border-transparent transition-all shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add</span>
                </button>
              ) : (
                <div className="flex items-center bg-[#EA580C] text-white rounded-xl shadow-xs overflow-hidden">
                  <button
                    onClick={handleDecrement}
                    className="p-1.5 hover:bg-[#C2410C] transition-colors"
                    title="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <span className="px-2 font-black text-xs min-w-[20px] text-center">
                    {qtyInCart}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="p-1.5 hover:bg-[#C2410C] transition-colors"
                    title="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              )
            ) : (
              <span className={`text-xs font-semibold italic ${
                product.available ? 'text-neutral-400' : 'text-red-600'
              }`}>
                {product.available ? 'No Stock' : 'Unavailable'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
