'use client';

import React from 'react';
import { X } from 'lucide-react';
import { MenuItem } from './types';

interface VariantDrawerProps {
  item: MenuItem;
  selectedVariantId: string;
  onVariantChange: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function VariantDrawer({
  item,
  selectedVariantId,
  onVariantChange,
  onClose,
  onConfirm,
}: VariantDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 pb-safe">
      <div className="w-full sm:max-w-md bg-slate-50 sm:rounded-3xl rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-full duration-200">
        {/* Header */}
        <div className="p-4 bg-white border-b flex justify-between items-center sm:rounded-t-3xl rounded-t-3xl shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-800">Choose Option</h3>
            <p className="text-xs text-slate-500 mt-0.5">{item.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {item.variants?.map((v) => (
            <label
              key={v.id}
              className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all select-none bg-white ${
                selectedVariantId === v.id
                  ? 'border-red-500 bg-red-50/20 ring-1 ring-red-500'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="item-variant"
                  value={v.id}
                  checked={selectedVariantId === v.id}
                  onChange={() => onVariantChange(v.id)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="text-xs font-bold text-slate-800">{v.variant.name}</span>
              </div>
              <span className="text-xs font-black text-slate-700">
                ₹{parseFloat(v.price).toFixed(2)}
              </span>
            </label>
          ))}
        </div>

        {/* Action Button */}
        <div className="p-4 bg-white border-t sm:rounded-b-3xl shrink-0 pb-8 sm:pb-4">
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
