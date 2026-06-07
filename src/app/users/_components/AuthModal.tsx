'use client';

import React from 'react';
import { User, Loader2, X, Phone } from 'lucide-react';

interface AuthModalProps {
  authName: string;
  authPhone: string;
  authLoading: boolean;
  onClose: () => void;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AuthModal({
  authName,
  authPhone,
  authLoading,
  onClose,
  onNameChange,
  onPhoneChange,
  onSubmit,
}: AuthModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            Your Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Please enter your details to complete your order.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name</label>
            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
              <User className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="John Doe"
                className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                value={authName}
                onChange={(e) => onNameChange(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number</label>
            <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
              <Phone className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="tel"
                placeholder="Enter phone number..."
                className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                value={authPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3.5 rounded-xl font-bold text-sm transition-all mt-6 shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Confirm & Checkout'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
