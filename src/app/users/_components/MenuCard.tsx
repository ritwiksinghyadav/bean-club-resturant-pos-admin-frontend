'use client';

import React from 'react';
import { Plus, Minus, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { MenuItem } from './types';

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

interface MenuCardProps {
  item: MenuItem;
  qty: number;
  onPlus: (item: MenuItem) => void;
  onMinus: (item: MenuItem) => void;
}

export default function MenuCard({ item, qty, onPlus, onMinus }: MenuCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 relative"
    >
      {/* Item Details */}
      <div className="flex-1 flex flex-col justify-between pr-2">
        <div>
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center border border-red-100"
                >
                  {idx === 0 && (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse" />
                  )}
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
          <span className="text-sm font-semibold text-slate-700 block mb-1.5">
            {item.variants && item.variants.length > 0
              ? `₹${Math.min(...item.variants.map((v) => parseFloat(v.price))).toFixed(2)}`
              : `₹${parseFloat(item.basePrice).toFixed(2)}`}
          </span>
          {item.description && item.description.trim() !== '' && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>
      </div>

      {/* Item Image & Controls */}
      <div className="w-[100px] flex flex-col items-center shrink-0">
        <div className="w-[100px] h-[100px] rounded-xl bg-slate-100 overflow-hidden relative shadow-inner mb-[-16px] border border-gray-100">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
              <Utensils className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Inline Quantity Controls */}
        <div className="relative z-10 w-[90px]">
          {qty === 0 ? (
            <button
              onClick={() => onPlus(item)}
              className="w-full bg-white text-red-600 font-extrabold text-sm py-1.5 rounded-lg border shadow-sm border-gray-200 hover:bg-gray-50 hover:shadow uppercase transition-all flex items-center justify-center gap-1"
            >
              ADD
            </button>
          ) : (
            <div className="w-full bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-200 shadow-sm flex items-center justify-between overflow-hidden">
              <button
                onClick={() => onMinus(item)}
                className="p-1.5 hover:bg-red-100 active:bg-red-200 transition-colors px-2"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center bg-transparent pointer-events-none">{qty}</span>
              <button
                onClick={() => onPlus(item)}
                className="p-1.5 hover:bg-red-100 active:bg-red-200 transition-colors px-2"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {item.variants && item.variants.length > 0 && (
          <span className="text-[9px] text-slate-500 font-medium mt-1">Customizable</span>
        )}
      </div>
    </motion.div>
  );
}
