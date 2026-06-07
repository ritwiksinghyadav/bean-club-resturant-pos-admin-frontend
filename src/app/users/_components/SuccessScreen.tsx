'use client';

import React from 'react';
import { Coins, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreatedOrderDetails } from './types';

interface SuccessScreenProps {
  orderDetails: CreatedOrderDetails;
  onTrackOrder: () => void;
}

export default function SuccessScreen({ orderDetails, onTrackOrder }: SuccessScreenProps) {
  return (
    <motion.div
      key="success"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="flex-1 px-4 py-8 max-w-sm mx-auto w-full text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-200 shadow-inner">
          <Check className="w-10 h-10 text-green-500" />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-black text-slate-800">Order Sent to Counter</h2>
        <p className="text-xs text-slate-500 font-medium">Please present token code to pay</p>
      </div>

      {/* Big Token Pickup Box */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 text-white rounded-3xl p-6 shadow-xl border border-red-500 space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg" />
        <p className="text-[10px] tracking-widest text-red-100 font-bold uppercase">PICKUP TOKEN CODE</p>
        <p className="text-5xl font-black tracking-wider">#{orderDetails.order.tokenNumber}</p>
      </div>

      {/* Order Details Invoice */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-gray-100 pb-2">
          Receipt Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Original Total</span>
            <span>₹{orderDetails.originalAmount.toFixed(2)}</span>
          </div>
          {orderDetails.discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Loyalty Discount ({orderDetails.order.pointsRedeemed || 0} pts)</span>
              <span>-₹{orderDetails.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-2 border-t border-dashed border-gray-200">
            <span>Final Amount to Pay</span>
            <span className="text-base text-red-600">₹{orderDetails.finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex gap-3 text-amber-800 shadow-sm">
        <Coins className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
        <p className="text-[11px] leading-normal font-medium">
          Your order is currently <strong>Pending Payment</strong>. Go to the cashier counter, show
          this token code, and pay <strong>₹{orderDetails.finalAmount.toFixed(2)}</strong>. Once
          paid, the cashier will approve your order and the kitchen will begin preparation.
        </p>
      </div>

      <button
        onClick={onTrackOrder}
        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
      >
        Track Order Status
      </button>
    </motion.div>
  );
}
