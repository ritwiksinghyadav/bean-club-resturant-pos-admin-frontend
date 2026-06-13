'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Gift,
  Coins,
  Loader2,
  ArrowRight,
  Utensils,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CartItem, Customer, useCartStore } from '../cart-store';

interface CheckoutScreenProps {
  cartItems: CartItem[];
  cartSubtotal: number;
  taxAmount: number;
  finalAmountToPay: number;
  pointsDiscount: number;
  loyaltyBalance: number;
  maxPointsToRedeem: number;
  redeemPointsChecked: boolean;
  isPlacingOrder: boolean;
  customer: Customer | null;
  onBack: () => void;
  onChangeCustomer: () => void;
  onAddEditItems: () => void;
  onRedeemChange: (checked: boolean) => void;
  onPlaceOrder: (type: 'dinein' | 'takeaway') => void;

  // Offers props
  offers: any[];
  appliedOfferCode: string | null;
  offerDiscount: number;
  onApplyOffer: (code: string) => Promise<void>;
  onRemoveOffer: () => void;
}

export default function CheckoutScreen({
  cartItems,
  cartSubtotal,
  taxAmount,
  finalAmountToPay,
  pointsDiscount,
  loyaltyBalance,
  maxPointsToRedeem,
  redeemPointsChecked,
  isPlacingOrder,
  customer,
  onBack,
  onChangeCustomer,
  onAddEditItems,
  onRedeemChange,
  onPlaceOrder,

  offers,
  appliedOfferCode,
  offerDiscount,
  onApplyOffer,
  onRemoveOffer
}: CheckoutScreenProps) {
  const [promoInput, setPromoInput] = useState('');
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const specialNote = useCartStore((s) => s.specialNote);
  const setSpecialNote = useCartStore((s) => s.setSpecialNote);
  const [showInstruction, setShowInstruction] = useState(!!specialNote);
  const orderType = useCartStore((s) => s.orderType) || 'takeaway';
  const setOrderType = useCartStore((s) => s.setOrderType);

  return (
    <motion.div
      key='checkout'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-6'
    >
      {/* Header */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onBack}
          className='rounded-full border border-gray-200 bg-white p-2 text-slate-700 shadow-sm'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h2 className='text-xl font-black text-slate-800'>Checkout</h2>
      </div>

      {/* Customer Info */}
      <div className='space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-[10px] font-extrabold tracking-wider text-slate-400 uppercase'>
            Order Customer
          </span>
        </div>
        <div className='flex items-center gap-3'>
          <div className='rounded-2xl bg-red-50 p-3 text-red-600'>
            <span className='text-base font-black'>
              {customer?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className='text-sm font-bold text-slate-800'>{customer?.name}</p>
            <p className='mt-0.5 text-xs text-slate-500'>
              {customer?.phoneNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Dining Preference Selector */}
      <div className='space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <span className='block text-xs font-extrabold tracking-wide text-slate-700 uppercase'>
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

      {/* Special Instruction Note */}
      <div className='space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <label className='flex cursor-pointer items-center gap-3 select-none'>
          <input
            type='checkbox'
            className='h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500'
            checked={showInstruction}
            onChange={(e) => {
              const checked = e.target.checked;
              setShowInstruction(checked);
              if (!checked) {
                setSpecialNote('');
              }
            }}
          />
          <div className='flex-1'>
            <p className='text-xs font-bold text-slate-800'>
              Add special instructions?
            </p>
            <p className='mt-0.5 text-[10px] text-slate-500'>
              E.g., less sugar, extra hot, no onions, etc.
            </p>
          </div>
        </label>
        {showInstruction && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='overflow-hidden pt-2'
          >
            <textarea
              id='specialNoteCheckout'
              rows={2}
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              placeholder='Enter your instructions here...'
              className='w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 transition-all outline-none placeholder:text-slate-400 focus:border-red-600 focus:ring-1 focus:ring-red-600'
            />
          </motion.div>
        )}
      </div>

      {/* Order Details List */}
      <div className='space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xs font-extrabold tracking-wider text-slate-400 uppercase'>
            Order Summary
          </h3>
          <button
            onClick={onAddEditItems}
            className='text-xs font-bold text-red-600 transition-all hover:underline'
          >
            Add/Edit Items
          </button>
        </div>
        <div className='space-y-3'>
          {cartItems.map((item, idx) => (
            <div
              key={idx}
              className='flex items-center justify-between text-sm'
            >
              <div>
                <span className='font-bold text-slate-800'>{item.name}</span>
                <span className='ml-2 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-slate-500'>
                  x{item.quantity}
                </span>
                {item.variantName && (
                  <span className='mt-0.5 block text-xs text-slate-500'>
                    Size: {item.variantName}
                  </span>
                )}
              </div>
              <span className='font-bold text-slate-700'>
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Offers & Promo Codes */}
      <div className='space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center gap-2 text-red-600'>
          <Gift className='h-5 w-5' />
          <h3 className='text-sm font-bold'>Offers &amp; Promo Codes</h3>
        </div>

        {!appliedOfferCode ? (
          <div className='space-y-3'>
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Enter promo code (e.g. WELCOME50)'
                className='flex-1 rounded-xl border px-4 py-2 text-xs font-semibold uppercase outline-none placeholder:normal-case focus:border-red-500'
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  setErrorMsg(null);
                }}
              />
              <button
                onClick={async () => {
                  if (promoInput.trim()) {
                    setLoadingOffer(true);
                    setErrorMsg(null);
                    try {
                      await onApplyOffer(promoInput.trim().toUpperCase());
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Invalid coupon');
                    } finally {
                      setLoadingOffer(false);
                    }
                  }
                }}
                disabled={loadingOffer || !promoInput.trim()}
                className='rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50'
              >
                {loadingOffer ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {errorMsg && (
              <p className='text-[10px] font-semibold text-rose-500'>
                {errorMsg}
              </p>
            )}

            {offers.length > 0 && (
              <div className='space-y-2 pt-2'>
                <p className='text-[10px] font-extrabold tracking-wider text-slate-400 uppercase'>
                  Available Coupons
                </p>
                <div className='no-scrollbar max-h-40 space-y-2 overflow-y-auto pr-1'>
                  {offers.map((offer) => {
                    const minBill = parseFloat(offer.minBillAmount);
                    const isEligible = cartSubtotal >= minBill;
                    return (
                      <div
                        key={offer.id}
                        onClick={async () => {
                          if (isEligible) {
                            setLoadingOffer(true);
                            setErrorMsg(null);
                            try {
                              await onApplyOffer(offer.code);
                            } catch (err: any) {
                              setErrorMsg(err.message);
                            } finally {
                              setLoadingOffer(false);
                            }
                          }
                        }}
                        className={`flex items-center justify-between rounded-2xl border p-3 text-xs transition-all ${
                          isEligible
                            ? 'cursor-pointer border-gray-200 bg-slate-50/50 hover:border-red-200 hover:bg-red-50/10'
                            : 'cursor-not-allowed border-gray-100 bg-slate-100/30 opacity-60'
                        }`}
                      >
                        <div className='flex flex-col gap-0.5'>
                          <span className='font-extrabold text-red-600 uppercase'>
                            #{offer.code}
                          </span>
                          <span className='text-[10px] font-medium text-slate-600'>
                            {offer.description}
                          </span>
                          {!isEligible && (
                            <span className='mt-0.5 text-[9px] font-bold text-rose-500'>
                              Add ₹{(minBill - cartSubtotal).toFixed(2)} more to
                              unlock
                            </span>
                          )}
                        </div>
                        {isEligible && (
                          <span className='shrink-0 rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600'>
                            Apply
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='animate-in zoom-in-95 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs duration-150'>
            <div className='flex flex-col gap-0.5'>
              <span className='flex items-center gap-1 font-black text-emerald-800'>
                Coupon #{appliedOfferCode} Applied
              </span>
              <span className='text-[10px] font-semibold text-emerald-700'>
                Saved ₹{offerDiscount.toFixed(2)} on this order
              </span>
            </div>
            <button
              onClick={() => {
                setPromoInput('');
                onRemoveOffer();
              }}
              className='rounded-xl border border-emerald-200 bg-white px-3 py-1.5 font-bold text-rose-600 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-95'
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Loyalty Points Section */}
      <div className='space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex items-center gap-2 text-red-600'>
          <Coins className='h-5 w-5' />
          <h3 className='text-sm font-bold'>Loyalty Points Rewards</h3>
        </div>

        {loyaltyBalance > 0 ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-4'>
              <div className='flex items-center gap-3'>
                <Coins className='h-5 w-5 text-amber-500' />
                <div>
                  <p className='text-[10px] font-bold text-slate-500'>
                    AVAILABLE POINTS
                  </p>
                  <p className='text-sm font-extrabold text-slate-800'>
                    {loyaltyBalance} pts
                  </p>
                </div>
              </div>
              <span className='text-xs font-bold text-emerald-600'>
                ₹{loyaltyBalance.toFixed(2)} Value
              </span>
            </div>

            {maxPointsToRedeem > 0 && (
              <label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all select-none hover:border-red-300'>
                <input
                  type='checkbox'
                  className='h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500'
                  checked={redeemPointsChecked}
                  onChange={(e) => onRedeemChange(e.target.checked)}
                />
                <div className='flex-1'>
                  <p className='text-xs font-bold text-slate-800'>
                    Redeem loyalty points
                  </p>
                  <p className='mt-0.5 text-[10px] text-slate-500'>
                    Use {maxPointsToRedeem} points to save ₹
                    {maxPointsToRedeem.toFixed(2)}
                  </p>
                </div>
              </label>
            )}
          </div>
        ) : (
          <p className='text-xs text-slate-500'>
            You have 0 loyalty points. Place this order to start earning
            rewards!
          </p>
        )}
      </div>

      {/* Pricing Calculations */}
      <div className='space-y-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm'>
        <div className='flex justify-between text-sm font-semibold text-slate-600'>
          <span>Order Subtotal</span>
          <span className='font-bold text-slate-800'>
            ₹{cartSubtotal.toFixed(2)}
          </span>
        </div>
        {appliedOfferCode && offerDiscount > 0 && (
          <div className='flex justify-between text-sm font-bold text-emerald-600'>
            <span>Offer Discount ({appliedOfferCode})</span>
            <span>-₹{offerDiscount.toFixed(2)}</span>
          </div>
        )}
        {redeemPointsChecked && maxPointsToRedeem > 0 && (
          <div className='flex justify-between text-sm font-bold text-emerald-600'>
            <span>Loyalty Points Discount</span>
            <span>-₹{pointsDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className='flex justify-between text-sm font-semibold text-slate-600'>
          <span>Taxes &amp; Charges (5%)</span>
          <span className='font-bold text-slate-800'>
            ₹{taxAmount.toFixed(2)}
          </span>
        </div>
        <div className='flex items-center justify-between border-t border-dashed border-gray-200 pt-3 text-base'>
          <span className='font-black text-slate-800'>Grand Total</span>
          <span className='text-xl font-black text-slate-800'>
            ₹{finalAmountToPay.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={() => onPlaceOrder(orderType)}
        disabled={isPlacingOrder}
        className='flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-base font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95 disabled:bg-red-400'
      >
        {isPlacingOrder ? (
          <>
            <Loader2 className='h-5 w-5 animate-spin' />
            Submitting Order...
          </>
        ) : (
          <>
            Place Order &amp; Pay at Counter
            <ArrowRight className='h-5 w-5' />
          </>
        )}
      </button>
    </motion.div>
  );
}
