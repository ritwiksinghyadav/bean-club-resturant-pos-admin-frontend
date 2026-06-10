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

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storeRefreshToken }),
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
    if (!storeToken && storeRefreshToken) {
      silentReauthHelper();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, storeToken, storeRefreshToken]);

  // UI flow
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'checkout' | 'success'>('menu');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState<CreatedOrderDetails | null>(null);
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);

  // Offers & Promo Codes State
  const [offers, setOffers] = useState<any[]>([]);
  const [appliedOfferCode, setAppliedOfferCode] = useState<string | null>(null);
  const [appliedOfferDiscount, setAppliedOfferDiscount] = useState<number>(0);
  const [appliedOffer, setAppliedOffer] = useState<any | null>(null);

  // Modals
  const [selectedItemForVariants, setSelectedItemForVariants] = useState<MenuItem | null>(null);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAuth(`${apiUrl}/users/loyalty`);
      if (res.status === 401) {
        setIsAuthOpen(true);
        return;
      }
      const data = await res.json();
      if (data.success && data.result) setLoyaltyBalance(data.result.balance || 0);
    } catch {
      // silent
    }
  };

  // Fetch active offers
  const fetchActiveOffers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
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



  // Filter out 'Others' or 'Other' categories
  const filteredCategories = menu.filter(
    (c) => c.name.toLowerCase() !== 'others' && c.name.toLowerCase() !== 'other'
  );

  // Derived data
  const allItems = filteredCategories.flatMap((c) => c.menuItems);
  const filteredItems = (
    selectedCategory === 'all' ? allItems : filteredCategories.find((c) => c.id === selectedCategory)?.menuItems ?? []
  ).filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.tag?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartItemCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const getItemQuantity = (id: string) =>
    cartItems.filter((i) => i.menuItemId === id).reduce((s, i) => s + i.quantity, 0);

  // Pricing
  const offerDiscountAmount = appliedOfferDiscount;
  const amountAfterOffer = Math.max(0, cartSubtotal - offerDiscountAmount);
  const maxPointsToRedeem = Math.min(loyaltyBalance, Math.floor(amountAfterOffer));
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
          let calculated = (cartSubtotal * parseFloat(appliedOffer.discountValue)) / 100;
          if (appliedOffer.maxDiscount && parseFloat(appliedOffer.maxDiscount) > 0) {
            calculated = Math.min(calculated, parseFloat(appliedOffer.maxDiscount));
          }
          setAppliedOfferDiscount(calculated);
        } else if (appliedOffer.discountType === 'fixed') {
          setAppliedOfferDiscount(Math.min(parseFloat(appliedOffer.discountValue), cartSubtotal));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal, appliedOfferCode, appliedOffer]);

  const handleApplyOffer = async (code: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetchWithAuth(`${apiUrl}/users/offers/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, billAmount: cartSubtotal }),
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
      else addItem({ menuItemId: item.id, name: item.name, price: parseFloat(item.basePrice), imageUrl: item.imageUrl });
    }
  };

  const handleAddVariantConfirm = () => {
    if (!selectedItemForVariants) return;
    const rel = selectedItemForVariants.variants.find((v) => v.id === selectedVariantId);
    if (!rel) return;
    addItem({
      menuItemId: selectedItemForVariants.id,
      name: selectedItemForVariants.name,
      price: parseFloat(rel.price),
      imageUrl: selectedItemForVariants.imageUrl,
      variantId: rel.id,
      variantName: rel.variant.name,
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
    if (!authName || !authPhone) { toast.error('Please enter name and phone number'); return; }
    setAuthLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, phoneNumber: authPhone }),
      });
      const data = await res.json();
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

  const handlePlaceOrderAndPayCounter = async () => {
    setIsPlacingOrder(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const pointsRedeemed = redeemPointsChecked ? maxPointsToRedeem : 0;
      const res = await fetchWithAuth(`${apiUrl}/users/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({ menuItemId: i.menuItemId, variantId: i.variantId || null, quantity: i.quantity })),
          pointsRedeemed,
          offerCode: appliedOfferCode,
        }),
      });

      if (res.status === 401) {
        setIsPlacingOrder(false);
        setIsAuthOpen(true);
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
    <div className={`flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 ${currentScreen === 'menu' && cartItemCount > 0 ? 'pb-24' : 'pb-8'}`}>
      <AnimatePresence mode="wait">

        {/* ── MENU SCREEN ─────────────────────────────── */}
        {currentScreen === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col flex-1 w-full"
          >
            {/* Header */}
            <header className="px-4 py-3 bg-white shadow-sm flex justify-between items-center sticky top-0 z-30">
              <div className="flex items-center gap-2 text-red-600">
                <Utensils className="w-6 h-6" />
                <h1 className="text-xl font-black tracking-tight">Bean Club</h1>
              </div>
              <div>
                {customer ? (
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    title="Profile Settings"
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 active:scale-95 transition-all rounded-full flex items-center justify-center text-red-600 font-bold text-sm cursor-pointer border border-red-200/50"
                  >
                    {customer.name.charAt(0).toUpperCase()}
                  </button>
                ) : (
                  <button onClick={() => setIsAuthOpen(true)} className="text-sm font-semibold text-slate-600 hover:text-red-600">
                    Log in
                  </button>
                )}
              </div>
            </header>

            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2 bg-white shadow-sm">
              <div className="relative flex items-center bg-white border border-gray-300 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all">
                <Search className="w-5 h-5 text-red-500 mr-2" />
                <input
                  type="text"
                  placeholder="Restaurant menu, items..."
                  className="bg-transparent text-sm w-full outline-none text-slate-800 placeholder-slate-400 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 overflow-x-auto flex gap-3 no-scrollbar sticky top-[68px] z-20">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all ${
                  selectedCategory === 'all' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all ${
                    selectedCategory === cat.id ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm font-medium">Fetching menu...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 text-slate-500 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-700">No items found</p>
                  <p className="text-sm mt-1">Try a different search term or category.</p>
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
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
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
                  className="fixed bottom-24 left-4 right-4 z-40 max-w-2xl mx-auto"
                >
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="w-full bg-red-600 shadow-xl shadow-red-600/40 text-white p-4 rounded-2xl flex items-center justify-between transition-all active:scale-95 border border-red-500"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-extrabold text-sm tracking-wide">
                        {cartItemCount} item{cartItemCount > 1 ? 's' : ''} added
                      </span>
                      <span className="font-bold text-xs text-red-100 mt-0.5">
                        Subtotal: ₹{cartSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-black text-base tracking-wide bg-white/20 px-4 py-2 rounded-xl">
                      Next
                      <ArrowRight className="w-5 h-5" />
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
            onAddEditItems={() => { setCurrentScreen('menu'); setIsCartOpen(true); }}
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
