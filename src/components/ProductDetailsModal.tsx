import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { Product } from '../types.js';
import { useCart } from '../context/CartContext.js';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#EFE8DF] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Image */}
        <div className="relative aspect-16/10 w-full bg-[#F5EFE6]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const image = e.currentTarget;
              image.onerror = null;
              image.src = '/papis-kitchen-logo.png';
              image.classList.add('object-contain', 'p-16');
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/90 text-[#291D15] hover:bg-white shadow-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {product.isSpecial && (
            <div className="absolute bottom-3 left-3 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>Chef's Choice Special</span>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#EA580C] uppercase tracking-wider">
              {product.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span className="font-semibold">Pure Vegetarian</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-[#291D15] tracking-tight">
            {product.name}
          </h2>

          <p className="text-sm text-[#5C4A3E] leading-relaxed">
            {product.description}
          </p>

          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F5EFE6] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#8C7A6D]">Price per serving</span>
              <div className="text-2xl font-black text-[#291D15]">
                ₹{product.price}
              </div>
            </div>

            {product.available && (
              <div className="flex items-center gap-3 bg-[#F5EFE6] p-1.5 rounded-2xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#291D15] hover:bg-[#EA580C] hover:text-white transition-colors shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-sm w-6 text-center text-[#291D15]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#291D15] hover:bg-[#EA580C] hover:text-white transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#FBF7F0] border-t border-[#EFE8DF] flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#8C7A6D]">Item total</span>
            <div className="text-lg font-black text-[#291D15]">
              ₹{(product.sellingPrice || product.price || 0) * quantity}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-[#5C4A3E] hover:bg-[#EFE8DF] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!product.available}
              className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{product.available ? `Add ₹${(product.sellingPrice || product.price || 0) * quantity}` : 'Sold Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
