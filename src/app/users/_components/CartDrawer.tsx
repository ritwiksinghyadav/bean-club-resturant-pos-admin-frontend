'use client';

import React from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  X,
  Utensils
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CartItem, useCartStore } from '../cart-store';

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: CartItem[];
  cartSubtotal: number;
  onClose: () => void;
  onUpdateQuantity: (
    menuItemId: string,
    qty: number,
    variantId?: string
  ) => void;
  onProceed: () => void;
}

export default function CartDrawer({
  isOpen,
  cartItems,
  cartSubtotal,
  onClose,
  onUpdateQuantity,
  onProceed
}: CartDrawerProps) {
  const orderType = useCartStore((s) => s.orderType);
  const setOrderType = useCartStore((s) => s.setOrderType);

  const handleProceedClick = () => {
    if (!orderType) {
      toast.error('Select Dining Preference first!', {
        description:
          'Please choose Dine-in or Takeaway to proceed with your order.'
      });
      return;
    }
    onProceed();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='pb-safe fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:p-4'
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-slate-50 shadow-2xl sm:max-w-md sm:rounded-3xl'
          >
            {/* Header */}
            <div className='flex shrink-0 items-center justify-between rounded-t-3xl border-b bg-white p-4 sm:rounded-t-3xl'>
              <h3 className='text-xl font-black text-slate-800'>Your Cart</h3>
              <button
                onClick={onClose}
                className='rounded-full bg-gray-100 p-2 text-slate-600 hover:bg-gray-200'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Cart Items List */}
            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto p-4'>
              {cartItems.length === 0 ? (
                <div className='py-10 text-center text-slate-500'>
                  <ShoppingBag className='mx-auto mb-4 h-16 w-16 text-gray-300' />
                  <p className='text-lg font-bold text-slate-700'>
                    Your cart is empty
                  </p>
                  <p className='mt-1 text-sm'>
                    Looks like you haven&apos;t added anything yet.
                  </p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'
                  >
                    <div className='flex-1'>
                      <div className='mb-1 flex items-center gap-2'>
                        <div className='flex h-3 w-3 items-center justify-center rounded-sm border border-red-500'>
                          <div className='h-1.5 w-1.5 rounded-full bg-red-500' />
                        </div>
                        <p className='text-sm leading-tight font-bold text-slate-800'>
                          {item.name}
                        </p>
                      </div>
                      {item.variantName && (
                        <p className='ml-5 text-[11px] font-medium text-slate-500'>
                          {item.variantName}
                        </p>
                      )}
                      <p className='mt-2 ml-5 text-sm font-bold text-slate-800'>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className='mt-1 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-1.5 py-1'>
                      <button
                        onClick={() =>
                          onUpdateQuantity(
                            item.menuItemId,
                            item.quantity - 1,
                            item.variantId
                          )
                        }
                        className='rounded p-1 text-red-600 hover:bg-red-100'
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className='h-3.5 w-3.5' />
                        ) : (
                          <Minus className='h-3.5 w-3.5' />
                        )}
                      </button>
                      <span className='w-4 text-center text-sm font-bold text-red-600'>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(
                            item.menuItemId,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        className='rounded p-1 text-red-600 hover:bg-red-100'
                      >
                        <Plus className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Checkout Button */}
            {cartItems.length > 0 && (
              <div className='shrink-0 border-t bg-white p-4 pb-8 sm:rounded-b-3xl sm:pb-4'>
                {/* Dining Preference Selector */}
                <div className='mb-4'>
                  <span className='mb-2 block text-xs font-extrabold tracking-wide text-slate-700 uppercase'>
                    Dining Preference
                  </span>
                  <div className='grid grid-cols-2 gap-3'>
                    <button
                      type='button'
                      onClick={() => setOrderType('dinein')}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                        orderType === 'dinein'
                          ? 'border-red-600 bg-red-50 text-red-600 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Utensils className='h-4 w-4' />
                      Dine-in
                    </button>
                    <button
                      type='button'
                      onClick={() => setOrderType('takeaway')}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                        orderType === 'takeaway'
                          ? 'border-red-600 bg-red-50 text-red-600 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <ShoppingBag className='h-4 w-4' />
                      Takeaway
                    </button>
                  </div>
                </div>

                <div className='mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4'>
                  <div className='mb-2 flex justify-between text-sm'>
                    <span className='font-medium text-slate-600'>
                      Item Total
                    </span>
                    <span className='font-bold text-slate-800'>
                      ₹{cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className='mb-2 flex justify-between border-b border-dashed border-gray-300 pb-2 text-sm'>
                    <span className='font-medium text-slate-600'>
                      Taxes &amp; Charges
                    </span>
                    <span className='font-bold text-emerald-600 text-slate-800'>
                      Calculated at next step
                    </span>
                  </div>
                  <div className='mt-2 flex items-center justify-between'>
                    <span className='text-base font-black text-slate-800'>
                      Grand Total
                    </span>
                    <span className='text-lg font-black text-slate-800'>
                      ₹{cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleProceedClick}
                  className='flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-base font-bold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95'
                >
                  Proceed with the Order
                  <ArrowRight className='h-5 w-5' />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
