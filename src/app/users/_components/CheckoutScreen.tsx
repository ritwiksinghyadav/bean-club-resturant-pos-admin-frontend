'use client';

import React, { useState } from 'react';
import { ArrowLeft, Gift, Coins, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CartItem } from '../cart-store';
import { Customer } from '../cart-store';

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
  onPlaceOrder: () => void;
  
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
  onRemoveOffer,
}: CheckoutScreenProps) {
  const [promoInput, setPromoInput] = useState('');
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return (
    <motion.div
      key="checkout"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-white border border-gray-200 text-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-black text-slate-800">Checkout</h2>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Order Customer
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600">
            <span className="text-base font-black">{customer?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{customer?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{customer?.phoneNumber}</p>
          </div>
        </div>
      </div>

      {/* Order Details List */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Order Summary
          </h3>
          <button
            onClick={onAddEditItems}
            className="text-xs font-bold text-red-600 hover:underline transition-all"
          >
            Add/Edit Items
          </button>
        </div>
        <div className="space-y-3">
          {cartItems.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-slate-800">{item.name}</span>
                <span className="text-xs text-slate-500 bg-gray-100 px-1.5 py-0.5 rounded-md ml-2">
                  x{item.quantity}
                </span>
                {item.variantName && (
                  <span className="text-slate-500 text-xs block mt-0.5">Size: {item.variantName}</span>
                )}
              </div>
              <span className="font-bold text-slate-700">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Offers & Promo Codes */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <Gift className="w-5 h-5" />
          <h3 className="text-sm font-bold">Offers &amp; Promo Codes</h3>
        </div>
        
        {!appliedOfferCode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code (e.g. WELCOME50)"
                className="flex-1 px-4 py-2 border rounded-xl text-xs outline-none focus:border-red-500 font-semibold uppercase placeholder:normal-case"
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
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {loadingOffer ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {errorMsg && (
              <p className="text-[10px] text-rose-500 font-semibold">{errorMsg}</p>
            )}
            
            {offers.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Available Coupons</p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 no-scrollbar">
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
                        className={`p-3 border rounded-2xl flex justify-between items-center text-xs transition-all ${
                          isEligible 
                            ? 'bg-slate-50/50 border-gray-200 cursor-pointer hover:border-red-200 hover:bg-red-50/10' 
                            : 'bg-slate-100/30 border-gray-100 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-red-600 uppercase">#{offer.code}</span>
                          <span className="text-[10px] text-slate-600 font-medium">{offer.description}</span>
                          {!isEligible && (
                            <span className="text-[9px] text-rose-500 font-bold mt-0.5">Add ₹{(minBill - cartSubtotal).toFixed(2)} more to unlock</span>
                          )}
                        </div>
                        {isEligible && (
                          <span className="text-[10px] font-bold text-red-600 shrink-0 bg-red-50 px-2 py-1 rounded-lg border border-red-100">Apply</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs animate-in zoom-in-95 duration-150">
            <div className="flex flex-col gap-0.5">
              <span className="font-black text-emerald-800 flex items-center gap-1">
                Coupon #{appliedOfferCode} Applied
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Saved ₹{offerDiscount.toFixed(2)} on this order
              </span>
            </div>
            <button
              onClick={() => {
                setPromoInput('');
                onRemoveOffer();
              }}
              className="px-3 py-1.5 bg-white border border-emerald-200 text-rose-600 rounded-xl font-bold active:scale-95 transition-all shadow-sm hover:bg-rose-50 hover:border-rose-200"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Loyalty Points Section */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <Coins className="w-5 h-5" />
          <h3 className="text-sm font-bold">Loyalty Points Rewards</h3>
        </div>

        {loyaltyBalance > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">AVAILABLE POINTS</p>
                  <p className="text-sm font-extrabold text-slate-800">{loyaltyBalance} pts</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                ₹{(loyaltyBalance).toFixed(2)} Value
              </span>
            </div>
 
            {maxPointsToRedeem > 0 && (
              <label className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-red-300 transition-all select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                  checked={redeemPointsChecked}
                  onChange={(e) => onRedeemChange(e.target.checked)}
                />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Redeem loyalty points</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Use {maxPointsToRedeem} points to save ₹{(maxPointsToRedeem).toFixed(2)}
                  </p>
                </div>
              </label>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            You have 0 loyalty points. Place this order to start earning rewards!
          </p>
        )}
      </div>

      {/* Pricing Calculations */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Order Subtotal</span>
          <span className="font-bold text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
        </div>
        {appliedOfferCode && offerDiscount > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-bold">
            <span>Offer Discount ({appliedOfferCode})</span>
            <span>-₹{offerDiscount.toFixed(2)}</span>
          </div>
        )}
        {redeemPointsChecked && maxPointsToRedeem > 0 && (
          <div className="flex justify-between text-sm text-emerald-600 font-bold">
            <span>Loyalty Points Discount</span>
            <span>-₹{pointsDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>Taxes &amp; Charges (5%)</span>
          <span className="font-bold text-slate-800">₹{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-base pt-3 border-t border-dashed border-gray-200">
          <span className="font-black text-slate-800">Grand Total</span>
          <span className="text-xl font-black text-slate-800">₹{finalAmountToPay.toFixed(2)}</span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={onPlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
      >
        {isPlacingOrder ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting Order...
          </>
        ) : (
          <>
            Place Order &amp; Pay at Counter
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </motion.div>
  );
}
