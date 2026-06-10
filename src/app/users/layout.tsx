'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, Receipt, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from './cart-store';
import SignInPage from './_components/SignInPage';

export default function UsersLayout({
  children
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

  const totalItems = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const isMenu = pathname === '/users' || pathname === '/';
  const isOrders = pathname?.startsWith('/users/orders');
  const isLoyalty = pathname?.startsWith('/users/loyalty');

  const navLinks = [
    {
      href: '/users',
      icon: Coffee,
      label: 'Menu',
      active: isMenu
    },
    {
      href: '/users/orders',
      icon: Receipt,
      label: 'Orders',
      active: isOrders,
      badge: totalItems > 0 && isMenu ? undefined : undefined
    },
    {
      href: '/users/loyalty',
      icon: Award,
      label: 'Rewards',
      active: isLoyalty
    }
  ];

  return (
    <div className='flex h-[100dvh] items-stretch justify-center bg-gradient-to-br from-rose-50 via-white to-red-50/30 font-sans text-slate-900 antialiased selection:bg-red-600 selection:text-white'>
      {/* Mobile-first frame container */}
      <div className='relative flex h-full w-full max-w-md flex-col overflow-hidden border-x border-white/50 bg-white/60 shadow-2xl shadow-black/10 backdrop-blur-sm'>
        {mounted && !customer ? (
          <SignInPage />
        ) : (
          <>
            <main className='flex-1 overflow-x-hidden overflow-y-auto pb-28 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
              {children}
            </main>

            {mounted && customer && (
              <AnimatePresence>
                <motion.div
                  initial={{ y: 40, opacity: 0, scale: 0.92 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.38, duration: 0.65 }}
                  className='pointer-events-none absolute right-0 bottom-0 left-0 z-40 flex justify-center pt-2 pb-5'
                >
                  {/* Island Pill Nav */}
                  <nav
                    className='island-nav pointer-events-auto flex items-center gap-1 rounded-[32px] px-2 py-2'
                    style={{ minWidth: 220 }}
                  >
                    {navLinks.map(({ href, icon: Icon, label, active }) => (
                      <Link
                        key={href}
                        href={href}
                        className='relative flex flex-col items-center justify-center outline-none'
                      >
                        <motion.div
                          whileTap={{ scale: 0.88 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 28
                          }}
                          className={`flex flex-col items-center justify-center gap-0.5 rounded-[22px] px-5 py-2.5 transition-all duration-300 ${
                            active
                              ? 'bg-red-600 text-white shadow-lg'
                              : 'text-slate-400 hover:bg-red-50/60 hover:text-red-500'
                          } `}
                          style={
                            active
                              ? {
                                  boxShadow:
                                    '0 4px 16px rgba(220,38,38,0.38), 0 1px 4px rgba(220,38,38,0.2)'
                                }
                              : {}
                          }
                        >
                          <Icon
                            className={`h-[18px] w-[18px] ${active ? 'stroke-[2.5]' : 'stroke-2'}`}
                          />
                          <span
                            className={`mt-0.5 text-[10px] leading-none font-bold tracking-wide ${active ? 'text-white' : ''}`}
                          >
                            {label}
                          </span>
                        </motion.div>
                      </Link>
                    ))}
                  </nav>
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}
