'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Receipt, Award, ShoppingBag } from 'lucide-react';
import { useCartStore } from './cart-store';
import { Toaster } from 'sonner';

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const customer = useCartStore((state) => state.customer);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  // Paths mapping for active tabs
  const isMenu = pathname === '/users' || pathname === '/';
  const isOrders = pathname?.startsWith('/users/orders');
  const isLoyalty = pathname?.startsWith('/users/loyalty');

  return (
    <div className="h-[100dvh] bg-slate-100 flex justify-center items-stretch font-sans text-slate-900 antialiased selection:bg-red-600 selection:text-white">
      {/* Mobile-first frame container */}
      <div className="w-full max-w-md bg-white border-x border-slate-200 flex flex-col relative overflow-hidden shadow-xl h-full">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-40 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </main>

        {/* Bottom Nav Bar */}
        {mounted && customer && (
          <nav className="absolute bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center px-4 z-40">
            <Link
              href="/users"
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                isMenu
                  ? 'text-red-600 scale-110 bg-red-50 border border-red-100 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Coffee className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-wide">Menu</span>
            </Link>

            <Link
              href="/users/orders"
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 relative ${
                isOrders
                  ? 'text-red-600 scale-110 bg-red-50 border border-red-100 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Receipt className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-wide">Orders</span>
            </Link>

            <Link
              href="/users/loyalty"
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
                isLoyalty
                  ? 'text-red-600 scale-110 bg-red-50 border border-red-100 font-bold'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Award className="w-5 h-5 mb-1" />
              <span className="text-[10px] tracking-wide">Rewards</span>
            </Link>
          </nav>
        )}
      </div>
      <Toaster position="top-center" theme="dark" closeButton />
    </div>
  );
}
