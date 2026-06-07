'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore, Customer } from './cart-store';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Loader2,
  Lock,
  Phone,
  User,
  Utensils,
  ArrowLeft,
  Gift,
  Coins,
  Check,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface Variant {
  id: string;
  name: string;
}

interface ItemVariant {
  id: string;
  price: string;
  sku?: string;
  isActive: boolean;
  variant: Variant;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  basePrice: string;
  imageUrl: string;
  isActive: boolean;
  variants: ItemVariant[];
  tags: { tag: { name: string } }[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  menuItems: MenuItem[];
}

export default function CustomerMenu() {
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Cart & Auth Zustand Store
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const storeToken = useCartStore((state) => state.token);
  const storeCustomer = useCartStore((state) => state.customer);
  const setAuth = useCartStore((state) => state.setAuth);

  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Sync store auth with client states after mounting to avoid Next.js hydration mismatch
  useEffect(() => {
    if (mounted) {
      setToken(storeToken);
      setCustomer(storeCustomer);
    }
  }, [mounted, storeToken, storeCustomer]);

  // UI Flow States
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'checkout' | 'success'>('menu');
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [redeemPointsChecked, setRedeemPointsChecked] = useState<boolean>(false);
  const [createdOrderDetails, setCreatedOrderDetails] = useState<any | null>(null);
  const [showProfileConfirm, setShowProfileConfirm] = useState<boolean>(false);

  // Modals & Action States
  const [selectedItemForVariants, setSelectedItemForVariants] = useState<MenuItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Auth Form State
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Fetch Menu
  useEffect(() => {
    setMounted(true);
    const fetchMenu = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/users/menu`);
        const data = await res.json();
        if (data.success && data.result?.menu) {
          setMenu(data.result.menu);
        } else {
          toast.error('Failed to load menu. Please refresh.');
        }
      } catch (err) {
        console.error('Menu load error:', err);
        toast.error('Network error. Failed to load menu.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // Fetch loyalty balance if token exists
  const fetchLoyaltyBalance = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/loyalty`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (data.success && data.result) {
        setLoyaltyBalance(data.result.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching loyalty balance:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLoyaltyBalance(token);
    }
  }, [token]);

  if (!mounted) return null;

  const allItems = menu.flatMap((cat) => cat.menuItems);
  const filteredItems = (selectedCategory === 'all' 
    ? allItems 
    : menu.find((cat) => cat.id === selectedCategory)?.menuItems || []
  ).filter((item) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags?.some((t) => t.tag?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getItemQuantity = (menuItemId: string) => {
    return cartItems.filter(item => item.menuItemId === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleMinusClick = (item: MenuItem) => {
    const cartItemsForItem = cartItems.filter(i => i.menuItemId === item.id);
    if (cartItemsForItem.length === 0) return;
    const target = cartItemsForItem[cartItemsForItem.length - 1]; // Remove from last added variant
    updateQuantity(target.menuItemId, target.quantity - 1, target.variantId);
  };

  const handlePlusClick = (item: MenuItem) => {
    if (item.variants && item.variants.length > 0) {
      setSelectedItemForVariants(item);
      setSelectedVariantId(item.variants[0].id);
    } else {
      const target = cartItems.find(i => i.menuItemId === item.id);
      if (target) {
        updateQuantity(item.id, target.quantity + 1);
      } else {
        addItem({
          menuItemId: item.id,
          name: item.name,
          price: parseFloat(item.basePrice),
          imageUrl: item.imageUrl,
        });
      }
    }
  };

  const handleAddVariantConfirm = () => {
    if (!selectedItemForVariants) return;
    const selectedVariantRel = selectedItemForVariants.variants.find(
      (v) => v.id === selectedVariantId
    );

    if (!selectedVariantRel) return;

    addItem({
      menuItemId: selectedItemForVariants.id,
      name: selectedItemForVariants.name,
      price: parseFloat(selectedVariantRel.price),
      imageUrl: selectedItemForVariants.imageUrl,
      variantId: selectedVariantRel.id,
      variantName: selectedVariantRel.variant.name,
    });

    setSelectedItemForVariants(null);
  };

  // Flow Step 2: "Proceed with the order" button clicked in Cart
  const handleProceedClick = () => {
    if (token && customer) {
      setShowProfileConfirm(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleProceedWithSameUser = () => {
    setShowProfileConfirm(false);
    if (token) {
      fetchLoyaltyBalance(token);
    }
    setCurrentScreen('checkout');
    setIsCartOpen(false);
  };

  const handleUseDifferentProfile = () => {
    setAuth(null, null);
    setShowProfileConfirm(false);
    setIsAuthOpen(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authPhone) {
      toast.error('Please enter name and phone number');
      return;
    }

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
        const { accessToken, user } = data.result;
        const newToken = accessToken;
        setAuth(newToken, user);
        setToken(newToken);
        setCustomer(user);
        toast.success(`Verified profile: ${user.name}`);
        setIsAuthOpen(false);
        fetchLoyaltyBalance(newToken);
        setCurrentScreen('checkout');
        setIsCartOpen(false);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('Failed to authenticate. Try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Calculate Loyalty Offset: 1 point = $0.10 offset
  const maxPointsToRedeem = Math.min(loyaltyBalance, Math.floor(cartSubtotal * 10));
  const pointsDiscount = redeemPointsChecked ? (maxPointsToRedeem * 0.10) : 0;
  const netAmount = Math.max(0, cartSubtotal - pointsDiscount);
  const taxAmount = netAmount * 0.05; // 5% GST/Tax
  const finalAmountToPay = netAmount + taxAmount;

  // Flow Step 4: Call backend placeOrder with pointsRedeemed
  const handlePlaceOrderAndPayCounter = async () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const pointsRedeemed = redeemPointsChecked ? maxPointsToRedeem : 0;
      
      const res = await fetch(`${apiUrl}/users/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId || null,
            quantity: item.quantity
          })),
          pointsRedeemed
        }),
      });
      const data = await res.json();

      if (data.success && data.result) {
        clearCart();
        toast.success('Order placed successfully! Redirecting to tracking...');
        window.location.href = '/users/orders';
      } else {
        toast.error(data.message || 'Failed to place order.');
      }
    } catch (err) {
      console.error('Order error:', err);
      toast.error('Network error. Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      
      {currentScreen === 'menu' && (
        <>
          {/* Header */}
          <header className="px-4 py-3 bg-white shadow-sm flex justify-between items-center sticky top-0 z-30">
            <div className="flex items-center gap-2 text-red-600">
              <Utensils className="w-6 h-6" />
              <h1 className="text-xl font-black tracking-tight">Bean Club</h1>
            </div>
            <div className="flex items-center gap-4">
              {customer ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                </div>
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
                selectedCategory === 'all'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-slate-600 border-gray-200 hover:bg-gray-50'
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
              filteredItems.map((item) => {
                const qty = getItemQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 pb-6 flex gap-4 shadow-sm border border-gray-100 relative"
                  >
                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between pr-2">
                      <div>
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {item.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center border border-red-100">
                                {idx === 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>}
                                {t.tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-base font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                        <span className="text-sm font-semibold text-slate-700 block mb-1.5">${parseFloat(item.basePrice).toFixed(2)}</span>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    {/* Item Image & Controls */}
                    <div className="w-[110px] flex flex-col items-center">
                      <div className="w-[110px] h-[110px] rounded-xl bg-slate-100 overflow-hidden relative shadow-inner mb-[-18px] border border-gray-100">
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
                            onClick={() => handlePlusClick(item)}
                            className="w-full bg-white text-red-600 font-extrabold text-sm py-1.5 rounded-lg border shadow-sm border-gray-200 hover:bg-gray-50 hover:shadow uppercase transition-all flex items-center justify-center gap-1"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="w-full bg-red-50 text-red-600 font-bold text-sm rounded-lg border border-red-200 shadow-sm flex items-center justify-between overflow-hidden">
                            <button onClick={() => handleMinusClick(item)} className="p-1.5 hover:bg-red-100 active:bg-red-200 transition-colors px-2">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center bg-transparent pointer-events-none">{qty}</span>
                            <button onClick={() => handlePlusClick(item)} className="p-1.5 hover:bg-red-100 active:bg-red-200 transition-colors px-2">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-[9px] text-slate-500 font-medium mt-1">Customizable</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Checkout Bar */}
          {cartItemCount > 0 && !isCartOpen && (
            <div className="fixed bottom-24 left-4 right-4 z-40 max-w-2xl mx-auto animate-in slide-in-from-bottom-5 duration-300">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-red-600 shadow-xl shadow-red-600/40 text-white p-4 rounded-2xl flex items-center justify-between transition-all active:scale-95 border border-red-500"
              >
                <div className="flex flex-col items-start">
                  <span className="font-extrabold text-sm tracking-wide">{cartItemCount} item{cartItemCount > 1 ? 's' : ''} added</span>
                  <span className="font-bold text-xs text-red-100 mt-0.5">Subtotal: ${cartSubtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center gap-2 font-black text-base tracking-wide bg-white/20 px-4 py-2 rounded-xl">
                  Next
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
        </>
      )}

      {/* Checkout Summary Screen */}
      {currentScreen === 'checkout' && (
        <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentScreen('menu')}
              className="p-2 rounded-full bg-white border border-gray-200 text-slate-700 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-black text-slate-800">Checkout</h2>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Order Customer</span>
              <button onClick={() => setIsAuthOpen(true)} className="text-xs font-bold text-red-600">Change</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{customer?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{customer?.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Order Details List */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Order Summary</h3>
              <button
                onClick={() => {
                  setCurrentScreen('menu');
                  setIsCartOpen(true);
                }}
                className="text-xs font-bold text-red-600 hover:underline transition-all"
              >
                Add/Edit Items
              </button>
            </div>
            <div className="space-y-3">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-xs text-slate-500 bg-gray-100 px-1.5 py-0.5 rounded-md ml-2">x{item.quantity}</span>
                    {item.variantName && (
                      <span className="text-slate-500 text-xs block mt-0.5">Size: {item.variantName}</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Loyalty Points Section */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Gift className="w-5 h-5" />
              <h3 className="text-sm font-bold">Loyalty Points Rewards</h3>
            </div>

            {loyaltyBalance > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <Coins className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold">AVAILABLE POINTS</p>
                      <p className="text-sm font-extrabold text-slate-800">{loyaltyBalance} pts</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">${(loyaltyBalance * 0.10).toFixed(2)} Value</span>
                </div>

                {maxPointsToRedeem > 0 && (
                  <label className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-red-300 transition-all select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300"
                      checked={redeemPointsChecked}
                      onChange={(e) => setRedeemPointsChecked(e.target.checked)}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Redeem loyalty points</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Use {maxPointsToRedeem} points to save ${(maxPointsToRedeem * 0.10).toFixed(2)}
                      </p>
                    </div>
                  </label>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                You have 0 loyalty points. Place this order to start earning rewards!
              </p>
            )}
          </div>

          {/* Offers & Promo Codes Section */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Gift className="w-5 h-5" />
              <h3 className="text-sm font-bold">Offers & Promo Codes</h3>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-between text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-slate-700">No active promo codes applied</span>
                <span className="text-[10px] text-slate-500">Apply coupon in future updates</span>
              </div>
              <button disabled className="px-3 py-1.5 bg-slate-200 text-slate-400 rounded-lg font-bold cursor-not-allowed">
                Apply
              </button>
            </div>
          </div>

          {/* Pricing Calculations */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>Order Subtotal</span>
              <span className="font-bold text-slate-800">${cartSubtotal.toFixed(2)}</span>
            </div>
            {redeemPointsChecked && maxPointsToRedeem > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Loyalty Points Discount</span>
                <span>-${pointsDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>Taxes & Charges (5%)</span>
              <span className="font-bold text-slate-800">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-base pt-3 border-t border-dashed border-gray-200">
              <span className="font-black text-slate-800">Grand Total</span>
              <span className="text-xl font-black text-slate-800">${finalAmountToPay.toFixed(2)}</span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePlaceOrderAndPayCounter}
            disabled={isPlacingOrder}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
          >
            {isPlacingOrder ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Order...
              </>
            ) : (
              <>
                Place Order & Pay at Counter
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Bill & Token Receipt Screen */}
      {currentScreen === 'success' && createdOrderDetails && (
        <div className="flex-1 px-4 py-8 max-w-sm mx-auto w-full text-center space-y-6">
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
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
            <p className="text-[10px] tracking-widest text-red-100 font-bold uppercase">PICKUP TOKEN CODE</p>
            <p className="text-5xl font-black tracking-wider">
              #{createdOrderDetails.order.tokenNumber}
            </p>
          </div>

          {/* Order Details Invoice */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4 text-left">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-gray-100 pb-2">Receipt Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Original Total</span>
                <span>${createdOrderDetails.originalAmount.toFixed(2)}</span>
              </div>
              {createdOrderDetails.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Loyalty Discount ({createdOrderDetails.order.pointsRedeemed || 0} pts)</span>
                  <span>-${createdOrderDetails.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 pt-2 border-t border-dashed border-gray-200">
                <span>Final Amount to Pay</span>
                <span className="text-base text-red-600">${createdOrderDetails.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left flex gap-3 text-amber-800 shadow-sm">
            <Coins className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[11px] leading-normal font-medium">
              Your order is currently <strong>Pending Payment</strong>. Go to the cashier counter, show this token code, and pay <strong>${createdOrderDetails.finalAmount.toFixed(2)}</strong>. Once paid, the cashier will approve your order and the kitchen will begin preparation.
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentScreen('menu');
              setCreatedOrderDetails(null);
              window.location.href = '/users/orders';
            }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
          >
            Track Order Status
          </button>
        </div>
      )}

      {/* Cart Bottom Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 pb-safe">
          <div className="w-full sm:max-w-md bg-slate-50 sm:rounded-3xl rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            {/* Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center sm:rounded-t-3xl rounded-t-3xl shrink-0">
              <h3 className="text-xl font-black text-slate-800">Your Cart</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {cartItems.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-bold text-lg text-slate-700">Your cart is empty</p>
                  <p className="text-sm mt-1">Looks like you haven&apos;t added anything yet.</p>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 border border-red-500 rounded-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        </div>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{item.name}</p>
                      </div>
                      {item.variantName && (
                        <p className="text-[11px] text-slate-500 font-medium ml-5">{item.variantName}</p>
                      )}
                      <p className="text-sm font-bold text-slate-800 mt-2 ml-5">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-1.5 py-1 mt-1">
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1, item.variantId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-sm font-bold text-red-600 w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1, item.variantId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total & Checkout Button */}
            {cartItems.length > 0 && (
              <div className="p-4 bg-white border-t sm:rounded-b-3xl shrink-0 pb-8 sm:pb-4">
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">Item Total</span>
                    <span className="text-slate-800 font-bold">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2 border-b border-dashed border-gray-300 pb-2">
                    <span className="text-slate-600 font-medium">Taxes & Charges</span>
                    <span className="text-slate-800 font-bold text-emerald-600">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-base font-black text-slate-800">Grand Total</span>
                    <span className="text-lg font-black text-slate-800">${cartSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedClick}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
                >
                  Proceed with the Order
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Confirmation Popup */}
      {showProfileConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-red-600" />
              Verify Profile
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-normal">
              We found your profile saved in this browser. Proceed with:
              <br />
              <strong>{customer?.name} ({customer?.phoneNumber})</strong>?
            </p>
            <div className="space-y-2">
              <button
                onClick={handleProceedWithSameUser}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Yes, Proceed
              </button>
              <button
                onClick={handleUseDifferentProfile}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all"
              >
                No, Use Different Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guest Authentication Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Your Details
              </h3>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-6">
              Please enter your details to complete your order.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Full Name</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
                  <User className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Phone Number</label>
                <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all bg-white">
                  <Phone className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                    type="tel"
                    placeholder="Enter phone number..."
                    className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-medium"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
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
      )}

      {/* Variant Selection Bottom Drawer */}
      {selectedItemForVariants && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 pb-safe">
          <div className="w-full sm:max-w-md bg-slate-50 sm:rounded-3xl rounded-t-3xl flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            {/* Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center sm:rounded-t-3xl rounded-t-3xl shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">Choose Option</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItemForVariants.name}</p>
              </div>
              <button
                onClick={() => setSelectedItemForVariants(null)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variants List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {selectedItemForVariants.variants?.map((v) => (
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
                      onChange={() => setSelectedVariantId(v.id)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <span className="text-xs font-bold text-slate-800">{v.variant.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-700">${parseFloat(v.price).toFixed(2)}</span>
                </label>
              ))}
            </div>

            {/* Action Button */}
            <div className="p-4 bg-white border-t sm:rounded-b-3xl shrink-0 pb-8 sm:pb-4">
              <button
                onClick={handleAddVariantConfirm}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-red-600/20 flex justify-center items-center gap-2 active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
