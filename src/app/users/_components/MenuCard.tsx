'use client';

import React from 'react';
import { Plus, Minus, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { MenuItem } from './types';

const itemVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 }
  }
};

interface MenuCardProps {
  item: MenuItem;
  qty: number;
  onPlus: (item: MenuItem) => void;
  onMinus: (item: MenuItem) => void;
}

export default function MenuCard({
  item,
  qty,
  onPlus,
  onMinus
}: MenuCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className='card-hover group relative flex gap-3 overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-3.5 shadow-sm'
    >
      {/* Subtle red gradient shimmer on hover */}
      <div className='pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 via-red-500/0 to-red-500/0 transition-all duration-500 group-hover:from-red-500/[0.02] group-hover:to-red-500/[0.04]' />

      {/* Item Details */}
      <div className='flex min-w-0 flex-1 flex-col justify-between pr-1'>
        <div>
          {item.tags?.length > 0 && (
            <div className='mb-1.5 flex flex-wrap items-center gap-1.5'>
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className='flex items-center rounded-md border border-red-100/70 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-red-600 uppercase'
                >
                  {idx === 0 && (
                    <span className='pulse-dot mr-1.5 h-1.5 w-1.5 rounded-full bg-red-500' />
                  )}
                  {t.tag.name}
                </span>
              ))}
            </div>
          )}
          <h3 className='mb-1 truncate text-[15px] leading-tight font-bold text-slate-800'>
            {item.name}
          </h3>
          <span className='mb-1.5 block text-sm font-extrabold text-red-600'>
            {item.variants && item.variants.length > 0
              ? `from ₹${Math.min(...item.variants.map((v) => parseFloat(v.price))).toFixed(0)}`
              : `₹${parseFloat(item.basePrice).toFixed(0)}`}
          </span>
          {item.description && item.description.trim() !== '' && (
            <p className='line-clamp-2 text-[11px] leading-relaxed text-slate-400'>
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Item Image & Controls */}
      <div className='flex w-[96px] shrink-0 flex-col items-center'>
        {/* Image */}
        <div className='relative mb-[-14px] h-[96px] w-[96px] overflow-hidden rounded-xl border border-slate-100 bg-slate-100 shadow-sm'>
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300'>
              <Utensils className='h-7 w-7' />
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className='relative z-10 w-[86px]'>
          {qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => onPlus(item)}
              className='flex w-full items-center justify-center gap-0.5 rounded-xl border-2 border-red-500 bg-white py-1.5 text-xs font-extrabold tracking-wide text-red-600 uppercase shadow-sm transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-500/30'
            >
              + Add
            </motion.button>
          ) : (
            <div className='flex w-full items-center justify-between overflow-hidden rounded-xl bg-red-600 text-sm font-bold text-white shadow-md shadow-red-500/30'>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onMinus(item)}
                className='p-1.5 px-2.5 transition-colors hover:bg-red-700 active:bg-red-800'
              >
                <Minus className='h-3.5 w-3.5' />
              </motion.button>
              <span className='pointer-events-none flex-1 text-center text-sm font-black'>
                {qty}
              </span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onPlus(item)}
                className='p-1.5 px-2.5 transition-colors hover:bg-red-700 active:bg-red-800'
              >
                <Plus className='h-3.5 w-3.5' />
              </motion.button>
            </div>
          )}
        </div>

        {item.variants && item.variants.length > 0 && (
          <span className='mt-1.5 text-[9px] font-semibold tracking-wide text-slate-400'>
            Customizable
          </span>
        )}
      </div>
    </motion.div>
  );
}
