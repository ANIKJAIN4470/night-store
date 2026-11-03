import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext.js';
import { BusinessSettings } from '../types.js';

interface CartDrawerProps {
  onCheckout: () => void;
  onBrowseMenu: () => void;
  settings?: BusinessSettings | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onCheckout,
  onBrowseMenu,
  settings,
}) => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, subtotal } =
    useCart();

  if (!isCartOpen) return null;

  const deliveryFee = settings?.deliveryFee ?? 15;
  const minOrder = settings?.minOrderAmount ?? 50;
  const finalTotal = subtotal + deliveryFee;
  const isBelowMin = subtotal > 0 && subtotal < minOrder;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFDF9] shadow-2xl flex flex-col border-l border-[#EFE8DF]">
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#EFE8DF] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF2E8] flex items-center justify-center text-[#EA580C]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-[#291D15]">Your Snack Cart</h2>
                <p className="text-xs text-[#786455]">{items.length} unique items selected</p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-[#786455] hover:text-[#291D15] hover:bg-[#F6EFE6] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body: Items or Empty state */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#FFF2E8] flex items-center justify-center text-[#EA580C] text-3xl">
                  🥡
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#291D15]">Your cart is hungry!</h3>
                  <p className="text-xs text-[#786455] mt-1 max-w-xs">
                    You haven't added any Maggi, sandwiches, or snacks yet.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onBrowseMenu();
                  }}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
                >
                  Browse Menu & Add Snacks
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-[#8C7A6D] pb-1 border-b border-[#F5EFE6]">
                  <span>Items</span>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#EFE8DF] shadow-xs"
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-xl object-cover bg-[#F5EFE6] shrink-0"
                        onError={(e) => {
                          const image = e.currentTarget;
                          image.onerror = null;
                          image.src = '/papis-kitchen-logo.png';
                          image.classList.add('object-contain', 'p-2');
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#291D15] truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#8C7A6D] mt-0.5">₹{product.price} each</p>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity control */}
                          <div className="flex items-center bg-[#F5EFE6] rounded-lg">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="p-1 text-[#4A3B32] hover:bg-[#EFE8DF] rounded-md transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-xs px-2 text-[#291D15]">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="p-1 text-[#4A3B32] hover:bg-[#EFE8DF] rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="font-bold text-sm text-[#291D15]">
                            ₹{(product.sellingPrice || product.price || 0) * quantity}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Min order alert if triggered */}
                {isBelowMin && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Minimum order amount is <strong>₹{minOrder}</strong>. Please add ₹
                      {minOrder - subtotal} more to checkout.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer Calculations */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#EFE8DF] bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-[#5C4A3E]">
                <div className="flex justify-between">
                  <span>Snacks Subtotal</span>
                  <span className="font-semibold text-[#291D15]">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Delivery Fee</span>
                  <span className="font-semibold text-[#291D15]">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#291D15] pt-2 border-t border-[#F5EFE6]">
                  <span>Total Amount</span>
                  <span className="text-[#EA580C]">₹{finalTotal}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isBelowMin) return;
                  setIsCartOpen(false);
                  onCheckout();
                }}
                disabled={isBelowMin}
                className="w-full flex items-center justify-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md shadow-[#EA580C]/20 transition-all active:scale-98"
              >
                <span>Proceed to Room Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
