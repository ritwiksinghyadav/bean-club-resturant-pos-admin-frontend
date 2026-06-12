'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore, Customer } from './cart-store';
import { Search, ArrowRight, Loader2, Utensils, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import MenuCard from './_components/MenuCard';
import CartDrawer from './_components/CartDrawer';
import CheckoutScreen from './_components/CheckoutScreen';
import SuccessScreen from './_components/SuccessScreen';
import AuthModal from './_components/AuthModal';
import VariantDrawer from './_components/VariantDrawer';
import ProfileConfirmModal from './_components/ProfileConfirmModal';
import SettingsDrawer from './_components/SettingsDrawer';
import { MenuItem, Category, CreatedOrderDetails } from './_components/types';
import { fetchWithAuth } from '@/lib/api-client';
import { isTokenExpired } from '@/lib/jwt';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

export default function CustomerMenu() {
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart & Auth store
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const storeToken = useCartStore((s) => s.token);
  const storeRefreshToken = useCartStore((s) => s.refreshToken);
  const storeCustomer = useCartStore((s) => s.customer);
  const setAuth = useCartStore((s) => s.setAuth);
  const logout = useCartStore((s) => s.logout);

  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Sync store after mount (avoid SSR mismatch)
  useEffect(() => {
    if (mounted) {
      setToken(storeToken);
      setCustomer(storeCustomer);
    }
  }, [mounted, storeToken, storeCustomer]);

  // Silent re-authentication using refresh token
  const silentReauthHelper = async (): Promise<string | null> => {
    try {
      if (!storeRefreshToken) return null;
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storeRefreshToken })
      });
      if (res.status >= 400 && res.status < 500) {
        setAuth(null, null, null);
        setToken(null);
        setCustomer(null);
        return null;
      }
      const data = await res.json();
      if (data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        setToken(accessToken);
        setCustomer(user);
        return accessToken;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (isTokenExpired(storeToken) && storeRefreshToken) {
      silentReauthHelper();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, storeToken, storeRefreshToken]);

  // UI flow
  const [currentScreen, setCurrentScreen] = useState<
    'menu' | 'checkout' | 'success'
  >('menu');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] =
    useState<CreatedOrderDetails | null>(null);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);

  // Offers & Promo Codes State
  const [offers, setOffers] = useState<any[]>([]);
  const [appliedOfferCode, setAppliedOfferCode] = useState<string | null>(null);
  const [appliedOfferDiscount, setAppliedOfferDiscount] = useState<number>(0);
  const [appliedOffer, setAppliedOffer] = useState<any | null>(null);

  // Modals
  const [selectedItemForVariants, setSelectedItemForVariants] =
    useState<MenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Auth form
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch menu on mount
  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/users/menu`);
        const data = await res.json();
        if (data.success && data.result?.menu) setMenu(data.result.menu);
        else toast.error('Failed to load menu. Please refresh.');
      } catch {
        toast.error('Network error. Failed to load menu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch loyalty balance
  const fetchLoyaltyBalance = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAuth(`${apiUrl}/users/loyalty`);
      if (res.status === 401) {
        if (storeToken || token) {
          logout();
        } else {
          setIsAuthOpen(true);
        }
        return;
      }
      const data = await res.json();
      if (data.success && data.result)
        setLoyaltyBalance(data.result.balance || 0);
    } catch {
      // silent
    }
  };

  // Fetch active offers
  const fetchActiveOffers = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAuth(`${apiUrl}/users/offers`);
      const data = await res.json();
      if (data.success && data.result?.offers) {
        setOffers(data.result.offers);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (token) {
      fetchLoyaltyBalance();
      fetchActiveOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Listen to custom pull-to-refresh event
  useEffect(() => {
    const handlePortalRefresh = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/users/menu`);
        const data = await res.json();
        if (data.success && data.result?.menu) {
          setMenu(data.result.menu);
        }
        if (storeToken || token) {
          fetchLoyaltyBalance();
          fetchActiveOffers();
        }
      } catch (err) {
        console.error('Menu refresh failed:', err);
      }
    };

    window.addEventListener('users-portal-refresh', handlePortalRefresh);
    return () => {
      window.removeEventListener('users-portal-refresh', handlePortalRefresh);
    };
  }, [token, storeToken]);

  // Filter out 'Others' or 'Other' categories for the horizontal navigation pills
  const pillCategories = menu.filter(
    (c) => c.name.toLowerCase() !== 'others' && c.name.toLowerCase() !== 'other'
  );

  // Derived data - include all items (including those in 'Others' category)
  const allItems = menu.flatMap((c) => c.menuItems);
  const filteredItems = (
    selectedCategory === 'all'
      ? allItems
      : (menu.find((c) => c.id === selectedCategory)?.menuItems ?? [])
  ).filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) =>
        t.tag?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartItemCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const getItemQuantity = (id: string) =>
    cartItems
      .filter((i) => i.menuItemId === id)
      .reduce((s, i) => s + i.quantity, 0);

  // Pricing
  const offerDiscountAmount = appliedOfferDiscount;
  const amountAfterOffer = Math.max(0, cartSubtotal - offerDiscountAmount);
  const maxPointsToRedeem = Math.min(
    loyaltyBalance,
    Math.floor(amountAfterOffer)
  );
  const pointsDiscount = redeemPointsChecked ? maxPointsToRedeem : 0;
  const netAmount = Math.max(0, amountAfterOffer - pointsDiscount);
  const taxAmount = netAmount * 0.05;
  const finalAmountToPay = netAmount + taxAmount;

  // Re-validate coupon code if cart items subtotal changes
  useEffect(() => {
    if (appliedOfferCode && appliedOffer) {
      const minBill = parseFloat(appliedOffer.minBillAmount);
      if (cartSubtotal < minBill) {
        setAppliedOfferCode(null);
        setAppliedOfferDiscount(0);
        setAppliedOffer(null);
      } else {
        // Re-calculate percentage discount based on new subtotal
        if (appliedOffer.discountType === 'percentage') {
          let calculated =
            (cartSubtotal * parseFloat(appliedOffer.discountValue)) / 100;
          if (
            appliedOffer.maxDiscount &&
            parseFloat(appliedOffer.maxDiscount) > 0
          ) {
            calculated = Math.min(
              calculated,
              parseFloat(appliedOffer.maxDiscount)
            );
          }
          setAppliedOfferDiscount(calculated);
        } else if (appliedOffer.discountType === 'fixed') {
          setAppliedOfferDiscount(
            Math.min(parseFloat(appliedOffer.discountValue), cartSubtotal)
          );
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal, appliedOfferCode, appliedOffer]);

  const handleApplyOffer = async (code: string) => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetchWithAuth(`${apiUrl}/users/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, billAmount: cartSubtotal })
    });
    const data = await res.json();
    if (res.ok && data.success && data.result) {
      setAppliedOfferCode(data.result.offer.code);
      setAppliedOfferDiscount(parseFloat(data.result.discountAmount));
      setAppliedOffer(data.result.offer);
    } else {
      throw new Error(data.message || 'Failed to apply coupon');
    }
  };

  const handleRemoveOffer = () => {
    setAppliedOfferCode(null);
    setAppliedOfferDiscount(0);
    setAppliedOffer(null);
  };

  if (!mounted) return null;

  // Handlers
  const handleMinusClick = (item: MenuItem) => {
    const forItem = cartItems.filter((i) => i.menuItemId === item.id);
    if (!forItem.length) return;
    const target = forItem[forItem.length - 1];
    updateQuantity(target.menuItemId, target.quantity - 1, target.variantId);
  };

  const handlePlusClick = (item: MenuItem) => {
    if (item.variants?.length) {
      setSelectedItemForVariants(item);
      setSelectedVariantId(item.variants[0].id);
    } else {
      const target = cartItems.find((i) => i.menuItemId === item.id);
      if (target) updateQuantity(item.id, target.quantity + 1);
      else
        addItem({
          menuItemId: item.id,
          name: item.name,
          price: parseFloat(item.basePrice),
          imageUrl: item.imageUrl
        });
    }
  };

  const handleAddVariantConfirm = () => {
    if (!selectedItemForVariants) return;
    const rel = selectedItemForVariants.variants.find(
      (v) => v.id === selectedVariantId
    );
    if (!rel) return;
    addItem({
      menuItemId: selectedItemForVariants.id,
      name: selectedItemForVariants.name,
      price: parseFloat(rel.price),
      imageUrl: selectedItemForVariants.imageUrl,
      variantId: rel.id,
      variantName: rel.variant.name
    });
    setSelectedItemForVariants(null);
  };

  const handleProceedClick = () => {
    // Proceed directly to checkout since authentication is already verified at layout level
    fetchLoyaltyBalance();
    setCurrentScreen('checkout');
    setIsCartOpen(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authPhone) {
      toast.error('Please enter name and phone number');
      return;
    }
    setAuthLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const requestPayload = { name: authName, phoneNumber: authPhone };
      console.log(
        `[Customer Legacy Login API Request]: URL=${apiUrl}/users/auth/login, Payload=`,
        requestPayload
      );
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const data = await res.json();
      console.log(
        `[Customer Legacy Login API Response]: Status=${res.status}, Body=`,
        data
      );
      if (data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        setToken(accessToken);
        setCustomer(user);
        toast.success(`Verified profile: ${user.name}`);
        setIsAuthOpen(false);
        fetchLoyaltyBalance();
        setCurrentScreen('checkout');
        setIsCartOpen(false);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch {
      toast.error('Failed to authenticate. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePlaceOrderAndPayCounter = async (type: 'dinein' | 'takeaway') => {
    setIsPlacingOrder(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const pointsRedeemed = redeemPointsChecked ? maxPointsToRedeem : 0;
      const res = await fetchWithAuth(`${apiUrl}/users/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            menuItemId: i.menuItemId,
            variantId: i.variantId || null,
            quantity: i.quantity
          })),
          pointsRedeemed,
          offerCode: appliedOfferCode,
          type
        })
      });

      if (res.status === 401) {
        setIsPlacingOrder(false);
        if (storeToken || token) {
          logout();
        } else {
          setIsAuthOpen(true);
        }
        return;
      }

      const data = await res.json();
      if (data.success && data.result) {
        clearCart();
        toast.success('Order placed successfully! Redirecting to tracking...');
        window.location.href = '/users/orders';
      } else {
        toast.error(data.message || 'Failed to place order.');
      }
    } catch {
      toast.error('Network error. Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 ${currentScreen === 'menu' && cartItemCount > 0 ? 'pb-24' : 'pb-8'}`}
    >
      <AnimatePresence mode='wait'>
        {/* ── MENU SCREEN ─────────────────────────────── */}
        {currentScreen === 'menu' && (
          <motion.div
            key='menu'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className='flex w-full flex-1 flex-col'
          >
            {/* Header — Glassmorphism sticky */}
            <header
              className='sticky top-0 z-30 flex items-center justify-between px-4 py-3.5'
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.55)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
              }}
            >
              <div className='flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-md shadow-red-500/30'>
                  <Utensils className='h-4 w-4 text-white' />
                </div>
                <div>
                  <h1 className='text-lg leading-none font-black tracking-tight text-slate-900'>
                    Bean Club
                  </h1>
                  <p className='mt-0.5 text-[10px] leading-none font-semibold tracking-wider text-red-500'>
                    FRESH BREWS
                  </p>
                </div>
              </div>
              <div>
                {customer ? (
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title='Profile Settings'
                    className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm font-black text-white shadow-md shadow-red-500/30 transition-all hover:shadow-lg hover:shadow-red-500/40 active:scale-95'
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className='text-sm font-bold text-slate-500 transition-colors hover:text-red-600'
                  >
                    Log in
                  </button>
                )}
              </div>
            </header>

            {/* Search Bar */}
            <div
              className='px-4 pt-3 pb-2'
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
            >
              <div className='relative flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2.5 shadow-sm transition-all focus-within:border-red-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/20'>
                <Search className='mr-2.5 h-4 w-4 shrink-0 text-red-400' />
                <input
                  type='text'
                  placeholder='Search menu, drinks, food...'
                  className='w-full bg-transparent text-sm font-medium text-slate-800 placeholder-slate-400 outline-none'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='ml-1 p-0.5 text-slate-400 hover:text-slate-600'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div
              className='no-scrollbar sticky top-[68px] z-20 flex gap-2 overflow-x-auto px-4 py-2.5'
              style={{
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(226,232,240,0.6)'
              }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 rounded-2xl px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-100/80 text-slate-500 hover:bg-red-50 hover:text-red-600'
                }`}
                style={
                  selectedCategory === 'all'
                    ? { boxShadow: '0 3px 12px rgba(220,38,38,0.32)' }
                    : {}
                }
              >
                All Items
              </button>
              {pillCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-2xl px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-slate-100/80 text-slate-500 hover:bg-red-50 hover:text-red-600'
                  }`}
                  style={
                    selectedCategory === cat.id
                      ? { boxShadow: '0 3px 12px rgba(220,38,38,0.32)' }
                      : {}
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div className='mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4'>
              {loading ? (
                <div className='flex flex-col items-center justify-center space-y-3 py-20 text-slate-500'>
                  <Loader2 className='h-8 w-8 animate-spin text-red-500' />
                  <p className='text-sm font-medium'>Fetching menu...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className='rounded-2xl border border-gray-100 bg-white p-6 py-20 text-center text-slate-500 shadow-sm'>
                  <Search className='mx-auto mb-3 h-12 w-12 text-gray-300' />
                  <p className='text-base font-semibold text-slate-700'>
                    No items found
                  </p>
                  <p className='mt-1 text-sm'>
                    Try a different search term or category.
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='show'
                  className='space-y-4'
                >
                  {filteredItems.map((item) => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      qty={getItemQuantity(item.id)}
                      onPlus={handlePlusClick}
                      onMinus={handleMinusClick}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Floating Checkout Bar */}
            <AnimatePresence>
              {cartItemCount > 0 && !isCartOpen && (
                <motion.div
                  initial={{ y: 100, opacity: 0, scale: 0.94 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 100, opacity: 0, scale: 0.94 }}
                  transition={{ type: 'spring', bounce: 0.42, duration: 0.55 }}
                  className='fixed right-4 bottom-[88px] left-4 z-40 mx-auto max-w-md'
                >
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className='relative flex w-full items-center justify-between overflow-hidden rounded-[22px] p-4 text-white transition-all active:scale-[0.97]'
                    style={{
                      background:
                        'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      boxShadow:
                        '0 8px 32px rgba(220,38,38,0.45), 0 2px 8px rgba(220,38,38,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}
                  >
                    {/* Glass shine overlay */}
                    <div className='pointer-events-none absolute inset-0 rounded-[22px] bg-gradient-to-b from-white/10 to-transparent' />
                    <div className='relative z-10 flex items-center gap-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-base font-black backdrop-blur-sm'>
                        {cartItemCount}
                      </div>
                      <div className='flex flex-col items-start'>
                        <span className='text-sm leading-none font-extrabold tracking-wide'>
                          {cartItemCount} item{cartItemCount > 1 ? 's' : ''} in
                          cart
                        </span>
                        <span className='mt-0.5 text-[11px] leading-none font-bold text-red-100'>
                          ₹{cartSubtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className='relative z-10 flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-sm font-black tracking-wide backdrop-blur-sm'>
                      View Cart
                      <ArrowRight className='h-4 w-4' />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── CHECKOUT SCREEN ──────────────────────────── */}
        {currentScreen === 'checkout' && (
          <CheckoutScreen
            cartItems={cartItems}
            cartSubtotal={cartSubtotal}
            taxAmount={taxAmount}
            finalAmountToPay={finalAmountToPay}
            pointsDiscount={pointsDiscount}
            loyaltyBalance={loyaltyBalance}
            maxPointsToRedeem={maxPointsToRedeem}
            redeemPointsChecked={redeemPointsChecked}
            isPlacingOrder={isPlacingOrder}
            customer={customer}
            onBack={() => setCurrentScreen('menu')}
            onChangeCustomer={() => setIsAuthOpen(true)}
            onAddEditItems={() => {
              setCurrentScreen('menu');
              setIsCartOpen(true);
            }}
            onRedeemChange={setRedeemPointsChecked}
            onPlaceOrder={handlePlaceOrderAndPayCounter}
            offers={offers}
            appliedOfferCode={appliedOfferCode}
            offerDiscount={offerDiscountAmount}
            onApplyOffer={handleApplyOffer}
            onRemoveOffer={handleRemoveOffer}
          />
        )}

        {/* ── SUCCESS SCREEN ───────────────────────────── */}
        {currentScreen === 'success' && createdOrderDetails && (
          <SuccessScreen
            orderDetails={createdOrderDetails}
            onTrackOrder={() => {
              setCurrentScreen('menu');
              setCreatedOrderDetails(null);
              window.location.href = '/users/orders';
            }}
          />
        )}
      </AnimatePresence>

      {/* ── CART DRAWER ─────────────────────────────────── */}
      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cartItems}
        cartSubtotal={cartSubtotal}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onProceed={handleProceedClick}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* ── VARIANT DRAWER ──────────────────────────────── */}
      {selectedItemForVariants && (
        <VariantDrawer
          item={selectedItemForVariants}
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
          onClose={() => setSelectedItemForVariants(null)}
          onConfirm={handleAddVariantConfirm}
        />
      )}
    </div>
  );
}
