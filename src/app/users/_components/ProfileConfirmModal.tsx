'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Customer } from '../cart-store';

interface ProfileConfirmModalProps {
  customer: Customer | null;
  onProceed: () => void;
  onUseDifferent: () => void;
}

export default function ProfileConfirmModal({
  customer,
  onProceed,
  onUseDifferent,
}: ProfileConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-red-600" />
          Verify Profile
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-normal">
          We found your profile saved in this browser. Proceed with:
          <br />
          <strong>
            {customer?.name} ({customer?.phoneNumber})
          </strong>
          ?
        </p>
        <div className="space-y-2">
          <button
            onClick={onProceed}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            Yes, Proceed
          </button>
          <button
            onClick={onUseDifferent}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all"
          >
            No, Use Different Profile
          </button>
        </div>
      </div>
    </div>
  );
}
