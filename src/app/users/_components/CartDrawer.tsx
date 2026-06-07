'use client';

import React from 'react';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem } from '../cart-store';

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: CartItem[];
  cartSubtotal: number;
  onClose: () => void;
  onUpdateQuantity: (menuItemId: string, qty: number, variantId?: string) => void;
  onProceed: () => void;
}

export default function CartDrawer({
  isOpen,
  cartItems,
  cartSubtotal,
  onClose,
  onUpdateQuantity,
  onProceed,
}: CartDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 pb-safe"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md bg-slate-50 sm:rounded-3xl rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center sm:rounded-t-3xl rounded-t-3xl shrink-0">
              <h3 className="text-xl font-black text-slate-800">Your Cart</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {cartItems.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-lg text-slate-700">Your cart is empty</p>
                  <p className="text-sm mt-1">Looks like you haven&apos;t added anything yet.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 border border-red-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{item.name}</p>
                      </div>
                      {item.variantName && (
                        <p className="text-[11px] text-slate-500 font-medium ml-5">{item.variantName}</p>
                      )}
                      <p className="text-sm font-bold text-slate-800 mt-2 ml-5">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-1.5 py-1 mt-1">
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1, item.variantId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="text-sm font-bold text-red-600 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1, item.variantId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Checkout Button */}
            {cartItems.length > 0 && (
              <div className="p-4 bg-white border-t sm:rounded-b-3xl shrink-0 pb-8 sm:pb-4">
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">Item Total</span>
                    <span className="text-slate-800 font-bold">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2 border-b border-dashed border-gray-300 pb-2">
                    <span className="text-slate-600 font-medium">Taxes &amp; Charges</span>
                    <span className="text-slate-800 font-bold text-emerald-600">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-base font-black text-slate-800">Grand Total</span>
                    <span className="text-lg font-black text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={onProceed}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
                >
                  Proceed with the Order
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
