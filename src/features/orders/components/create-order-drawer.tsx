'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  UserCheck,
  UserPlus,
  Coins,
  Ticket,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Variant {
  id: string;
  price: string;
  variant: {
    name: string;
  };
}

interface MenuItem {
  id: string;
  name: string;
  basePrice: string;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
}

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  pointsBalance: number;
}

interface CreateOrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onOrderCreated: () => void;
}

export default function CreateOrderDrawer({
  isOpen,
  onClose,
  token,
  onOrderCreated
}: CreateOrderDrawerProps) {
  // Customer details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCustomerLookupLoading, setIsCustomerLookupLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Menu and Cart details
  const [menuCategories, setMenuCategories] = useState<Category[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dinein' | 'takeaway'>('takeaway');

  // Offers and Loyalty details
  const [offersList, setOffersList] = useState<any[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedOffer, setAppliedOffer] = useState<any | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch menu and active offers on mount
  useEffect(() => {
    if (isOpen) {
      fetchMenu();
      fetchOffers();
      // Reset state on open
      setPhoneNumber('');
      setCustomerName('');
      setSelectedCustomer(null);
      setIsNewCustomer(false);
      setCartItems([]);
      setOrderType('takeaway');
      setPromoCodeInput('');
      setAppliedOffer(null);
      setPointsToRedeem(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchMenu = async () => {
    setIsMenuLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/menu`);
      const data = await res.json();
      if (data.success && data.result?.menu) {
        setMenuCategories(data.result.menu);
      }
    } catch (err) {
      toast.error('Failed to load menu items');
    } finally {
      setIsMenuLoading(false);
    }
  };

  const fetchOffers = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/offers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.result?.offers) {
        // Only keep active offers
        setOffersList(data.result.offers.filter((o: any) => o.isActive));
      }
    } catch {
      // silent
    }
  };

  // Trigger customer lookup when phone number reaches 10 digits
  useEffect(() => {
    if (phoneNumber.length === 10) {
      lookupCustomer();
    } else {
      setSelectedCustomer(null);
      setIsNewCustomer(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  const lookupCustomer = async () => {
    setIsCustomerLookupLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/users?name=${phoneNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.result?.customers) {
        const found = data.result.customers.find(
          (c: Customer) => c.phoneNumber === phoneNumber
        );
        if (found) {
          setSelectedCustomer(found);
          setCustomerName(found.name);
          setIsNewCustomer(false);
          toast.success(`Existing Customer Found: ${found.name}`);
        } else {
          setSelectedCustomer(null);
          setCustomerName('');
          setIsNewCustomer(true);
          toast.info('New customer profile will be created.');
        }
      }
    } catch (err) {
      toast.error('Customer lookup failed');
    } finally {
      setIsCustomerLookupLoading(false);
    }
  };

  // Add Item / Variant to Cart
  const handleAddToCart = (item: MenuItem, variantId?: string) => {
    let price = parseFloat(item.basePrice);
    let variantName = null;

    if (variantId) {
      const rel = item.variants.find((v) => v.id === variantId);
      if (rel) {
        price = parseFloat(rel.price);
        variantName = rel.variant.name;
      }
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.menuItemId === item.id && i.variantId === (variantId || null)
      );

      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price,
          quantity: 1,
          variantId: variantId || null,
          variantName
        }
      ];
    });
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    setCartItems((prev) => {
      const currentItem = prev[idx];
      if (!currentItem) return prev;
      const newQty = currentItem.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((item, i) =>
        i === idx ? { ...item, quantity: newQty } : item
      );
    });
  };

  const handleRemoveFromCart = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Filter menu items by search query
  const allItems = menuCategories.flatMap((c) => c.menuItems);
  const filteredItems = allItems.filter(
    (item) =>
      item.isActive &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pricing calculations
  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Offer discount calculation
  let offerDiscount = 0;
  if (appliedOffer) {
    const minBill = parseFloat(appliedOffer.minBillAmount);
    if (cartSubtotal >= minBill) {
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
        offerDiscount = calculated;
      } else if (appliedOffer.discountType === 'fixed') {
        offerDiscount = Math.min(
          parseFloat(appliedOffer.discountValue),
          cartSubtotal
        );
      }
    }
  }

  const amountAfterOffer = Math.max(0, cartSubtotal - offerDiscount);
  const maxRedeemablePoints = selectedCustomer
    ? Math.min(selectedCustomer.pointsBalance, Math.floor(amountAfterOffer))
    : 0;

  // Sync points value in case total drops below redeemed points
  useEffect(() => {
    if (pointsToRedeem > maxRedeemablePoints) {
      setPointsToRedeem(maxRedeemablePoints);
    }
  }, [maxRedeemablePoints, pointsToRedeem]);

  const pointsDiscount = pointsToRedeem;
  const netAmount = Math.max(0, amountAfterOffer - pointsDiscount);
  const taxAmount = netAmount * 0.05;
  const finalAmountToPay = netAmount + taxAmount;

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    const offer = offersList.find((o) => o.code === code);
    if (!offer) {
      toast.error('Invalid or inactive promo code');
      setAppliedOffer(null);
      return;
    }

    const minBill = parseFloat(offer.minBillAmount);
    if (cartSubtotal < minBill) {
      toast.error(
        `Minimum bill amount to use this offer is ₹${minBill.toFixed(2)}`
      );
      setAppliedOffer(null);
      return;
    }

    setAppliedOffer(offer);
    toast.success(`Coupon ${code} applied successfully!`);
  };

  const handlePlaceOrder = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (isNewCustomer && !customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const payload = {
        phoneNumber,
        name: customerName.trim(),
        type: orderType,
        items: cartItems.map((i) => ({
          menuItemId: i.menuItemId,
          variantId: i.variantId || null,
          quantity: i.quantity
        })),
        pointsRedeemed: pointsToRedeem,
        offerCode: appliedOffer?.code || null
      };

      const res = await fetch(`${apiUrl}/admin/orders/create-on-behalf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          `Order placed successfully on behalf of customer! Token: #${data.result.order.tokenNumber}`
        );
        onOrderCreated();
        onClose();
      } else {
        toast.error(data.message || 'Failed to place order');
      }
    } catch (err) {
      toast.error('Network error. Failed to create order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='bg-background animate-in slide-in-from-right fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-2xl flex-col overflow-hidden border-l shadow-2xl duration-300'>
        {/* Header */}
        <div className='bg-muted/30 flex items-center justify-between border-b px-6 py-4'>
          <div>
            <p className='text-muted-foreground text-xs font-bold tracking-wider uppercase'>
              POS Counter
            </p>
            <h2 className='text-foreground mt-0.5 text-xl font-black'>
              Create Order on Behalf
            </h2>
          </div>
          <button
            onClick={onClose}
            className='bg-muted hover:bg-muted/80 text-muted-foreground rounded-full p-2 transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        {/* Layout Body: Split screen */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Left Panel: Menu Item Selector */}
          <div className='flex w-1/2 flex-col space-y-3 border-r bg-slate-50/50 p-4'>
            <h3 className='text-sm font-extrabold tracking-wider text-slate-400 uppercase'>
              Menu Selection
            </h3>

            {/* Search Input */}
            <div className='relative'>
              <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-slate-400' />
              <Input
                type='text'
                placeholder='Search menu item...'
                className='pl-9 text-xs'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Menu Items List */}
            <div className='no-scrollbar flex-1 space-y-2 overflow-y-auto pr-1'>
              {isMenuLoading ? (
                <div className='flex flex-col items-center justify-center space-y-2 py-10 text-slate-400'>
                  <Loader2 className='h-6 w-6 animate-spin text-red-500' />
                  <span className='text-xs font-semibold'>Loading menu...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className='py-10 text-center text-xs font-medium text-slate-400'>
                  No active menu items found
                </div>
              ) : (
                filteredItems.map((item) => {
                  const itemQty =
                    cartItems.find(
                      (i) => i.menuItemId === item.id && !i.variantId
                    )?.quantity || 0;

                  return (
                    <div
                      key={item.id}
                      className='space-y-2 rounded-xl border bg-white p-3 shadow-sm transition-all hover:border-red-100'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='text-xs leading-tight font-black text-slate-800'>
                            {item.name}
                          </p>
                          <p className='mt-1 text-[10px] font-bold text-slate-500'>
                            Base: ₹{parseFloat(item.basePrice).toFixed(2)}
                          </p>
                        </div>
                        {/* Simple item add / quantity control (if no variants) */}
                        {item.variants.length === 0 &&
                          (itemQty === 0 ? (
                            <Button
                              size='sm'
                              variant='outline'
                              className='h-7 border-red-200 px-2 text-xs font-bold text-red-600 hover:bg-red-50'
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus className='mr-1 h-3.5 w-3.5' /> Add
                            </Button>
                          ) : (
                            <div className='flex h-7 items-center gap-1.5 rounded-lg bg-red-600 p-0.5 text-white'>
                              <button
                                type='button'
                                onClick={() => {
                                  const idx = cartItems.findIndex(
                                    (i) =>
                                      i.menuItemId === item.id && !i.variantId
                                  );
                                  if (idx > -1) handleUpdateQuantity(idx, -1);
                                }}
                                className='rounded p-1 transition-colors hover:bg-red-700'
                              >
                                <Minus className='h-3 w-3 text-white' />
                              </button>
                              <span className='w-4 text-center text-xs font-black text-white'>
                                {itemQty}
                              </span>
                              <button
                                type='button'
                                onClick={() => {
                                  const idx = cartItems.findIndex(
                                    (i) =>
                                      i.menuItemId === item.id && !i.variantId
                                  );
                                  if (idx > -1) handleUpdateQuantity(idx, 1);
                                }}
                                className='rounded p-1 transition-colors hover:bg-red-700'
                              >
                                <Plus className='h-3 w-3 text-white' />
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Render variant buttons if any */}
                      {item.variants.length > 0 && (
                        <div className='flex flex-wrap gap-1.5 pt-1'>
                          {item.variants.map((v) => {
                            const variantQty =
                              cartItems.find(
                                (i) =>
                                  i.menuItemId === item.id &&
                                  i.variantId === v.id
                              )?.quantity || 0;

                            return variantQty === 0 ? (
                              <button
                                key={v.id}
                                type='button'
                                onClick={() => handleAddToCart(item, v.id)}
                                className='flex items-center gap-1 rounded-lg border bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                              >
                                <span>{v.variant.name}</span>
                                <span className='text-slate-400'>|</span>
                                <span>₹{parseFloat(v.price).toFixed(2)}</span>
                                <Plus className='ml-0.5 h-3 w-3' />
                              </button>
                            ) : (
                              <div
                                key={v.id}
                                className='flex h-6 items-center gap-1 rounded-lg border border-red-600 bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white transition-all'
                              >
                                <span>{v.variant.name}</span>
                                <span className='text-red-300'>|</span>
                                <span>₹{parseFloat(v.price).toFixed(2)}</span>
                                <span className='text-red-300'>|</span>
                                <button
                                  type='button'
                                  onClick={() => {
                                    const idx = cartItems.findIndex(
                                      (i) =>
                                        i.menuItemId === item.id &&
                                        i.variantId === v.id
                                    );
                                    if (idx > -1) handleUpdateQuantity(idx, -1);
                                  }}
                                  className='rounded p-0.5 transition-colors hover:bg-red-700'
                                >
                                  <Minus className='h-2.5 w-2.5 text-white' />
                                </button>
                                <span className='w-3 text-center font-black text-white'>
                                  {variantQty}
                                </span>
                                <button
                                  type='button'
                                  onClick={() => {
                                    const idx = cartItems.findIndex(
                                      (i) =>
                                        i.menuItemId === item.id &&
                                        i.variantId === v.id
                                    );
                                    if (idx > -1) handleUpdateQuantity(idx, 1);
                                  }}
                                  className='rounded p-0.5 transition-colors hover:bg-red-700'
                                >
                                  <Plus className='h-2.5 w-2.5 text-white' />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Customer, Cart & Pricing details */}
          <div className='flex w-1/2 flex-col space-y-4 overflow-y-auto p-5'>
            {/* Customer Lookup Info */}
            <div className='space-y-3 rounded-2xl border bg-slate-50 p-4'>
              <h3 className='text-xs font-extrabold tracking-wider text-slate-400 uppercase'>
                Customer Registration
              </h3>

              <div className='space-y-1.5'>
                <Label
                  htmlFor='phone'
                  className='text-xs font-bold text-slate-700'
                >
                  Phone Number
                </Label>
                <div className='relative'>
                  <Input
                    id='phone'
                    type='text'
                    maxLength={10}
                    placeholder='Enter 10-digit phone number'
                    className='text-xs'
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, ''))
                    }
                  />
                  {isCustomerLookupLoading && (
                    <Loader2 className='absolute top-2.5 right-2.5 h-4 w-4 animate-spin text-red-500' />
                  )}
                </div>
              </div>

              {/* Name Field */}
              {(isNewCustomer || selectedCustomer) && (
                <div className='animate-in fade-in space-y-1.5 duration-200'>
                  <Label
                    htmlFor='name'
                    className='text-xs font-bold text-slate-700'
                  >
                    Customer Name
                  </Label>
                  <Input
                    id='name'
                    type='text'
                    placeholder='Enter customer name'
                    className='text-xs'
                    disabled={!isNewCustomer}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              )}

              {/* Customer Status Info Badge */}
              {selectedCustomer && (
                <div className='flex items-center justify-between rounded-xl border border-green-200 bg-green-50/50 p-2.5 text-[11px] font-bold text-green-800'>
                  <span className='flex items-center gap-1'>
                    <UserCheck className='h-3.5 w-3.5 text-green-600' />{' '}
                    Existing Profile
                  </span>
                  <span>Balance: {selectedCustomer.pointsBalance} pts</span>
                </div>
              )}

              {isNewCustomer && (
                <div className='flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 text-[11px] font-bold text-amber-800'>
                  <UserPlus className='h-3.5 w-3.5 text-amber-600' /> New
                  Profile (No OTP required)
                </div>
              )}
            </div>

            {/* Order Type Toggle */}
            <div className='space-y-2'>
              <Label className='text-xs font-bold text-slate-700'>
                Order Option
              </Label>
              <div className='grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1'>
                <button
                  type='button'
                  onClick={() => setOrderType('dinein')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition-all ${
                    orderType === 'dinein'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🍽️ Dine In
                </button>
                <button
                  type='button'
                  onClick={() => setOrderType('takeaway')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition-all ${
                    orderType === 'takeaway'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🛍️ Takeaway
                </button>
              </div>
            </div>

            {/* Selected Items / Cart */}
            <div className='space-y-2'>
              <Label className='text-xs font-bold text-slate-700'>
                Selected Items ({cartItems.length})
              </Label>
              <div className='max-h-48 divide-y overflow-y-auto rounded-xl border bg-white'>
                {cartItems.length === 0 ? (
                  <p className='py-6 text-center text-xs font-medium text-slate-400'>
                    Cart is empty
                  </p>
                ) : (
                  cartItems.map((item, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between p-3 text-xs'
                    >
                      <div className='space-y-0.5'>
                        <p className='leading-tight font-bold text-slate-800'>
                          {item.name}
                        </p>
                        {item.variantName && (
                          <p className='text-[10px] text-slate-500'>
                            Size: {item.variantName}
                          </p>
                        )}
                        <p className='text-[10px] font-extrabold text-slate-700'>
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>

                      <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2 rounded-lg bg-slate-100 p-1'>
                          <button
                            type='button'
                            onClick={() => handleUpdateQuantity(idx, -1)}
                            className='rounded p-1 transition-colors hover:bg-white'
                          >
                            <Minus className='h-3 w-3 text-slate-600' />
                          </button>
                          <span className='w-4 text-center font-black text-slate-700'>
                            {item.quantity}
                          </span>
                          <button
                            type='button'
                            onClick={() => handleUpdateQuantity(idx, 1)}
                            className='rounded p-1 transition-colors hover:bg-white'
                          >
                            <Plus className='h-3 w-3 text-slate-600' />
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => handleRemoveFromCart(idx)}
                          className='p-1 text-slate-400 transition-colors hover:text-rose-600'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Promo Code Input */}
            <div className='space-y-1.5'>
              <Label
                htmlFor='promo'
                className='text-xs font-bold text-slate-700'
              >
                Promo Code
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='promo'
                  type='text'
                  placeholder='WELCOME50'
                  className='text-xs uppercase'
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                />
                <Button
                  type='button'
                  variant='outline'
                  className='h-9 border-red-200 text-xs font-bold text-red-600 hover:bg-red-50'
                  onClick={handleApplyPromo}
                >
                  Apply
                </Button>
              </div>
              {appliedOffer && (
                <div className='flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700'>
                  <span>Offer #{appliedOffer.code} applied!</span>
                  <button
                    type='button'
                    onClick={() => {
                      setAppliedOffer(null);
                      setPromoCodeInput('');
                    }}
                    className='text-rose-600 hover:underline'
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Points Redemption */}
            {selectedCustomer && selectedCustomer.pointsBalance > 0 && (
              <div className='space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/20 p-3.5'>
                <Label
                  htmlFor='redeem-points'
                  className='flex items-center gap-1 text-xs font-bold text-slate-700'
                >
                  <Coins className='h-4 w-4 text-amber-500' /> Redeem Loyalty
                  Points
                </Label>
                <div className='flex items-center gap-3'>
                  <Input
                    id='redeem-points'
                    type='number'
                    min={0}
                    max={maxRedeemablePoints}
                    placeholder={`Max ${maxRedeemablePoints} points`}
                    className='text-xs'
                    value={pointsToRedeem || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setPointsToRedeem(Math.min(val, maxRedeemablePoints));
                    }}
                  />
                  <span className='text-[10px] font-bold whitespace-nowrap text-slate-500'>
                    1 pt = ₹1
                  </span>
                </div>
                <p className='mt-1 text-[9px] font-semibold text-slate-400'>
                  Customer has {selectedCustomer.pointsBalance} pts available.
                </p>
              </div>
            )}

            {/* Billing Summary */}
            <div className='space-y-2 rounded-2xl border bg-slate-50/50 p-4 text-xs'>
              <div className='flex justify-between font-semibold text-slate-600'>
                <span>Subtotal</span>
                <span className='font-bold text-slate-800'>
                  ₹{cartSubtotal.toFixed(2)}
                </span>
              </div>
              {offerDiscount > 0 && (
                <div className='flex justify-between font-bold text-emerald-600'>
                  <span>Offer Discount</span>
                  <span>-₹{offerDiscount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className='flex justify-between font-bold text-emerald-600'>
                  <span>Points Discount</span>
                  <span>-₹{pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className='flex justify-between font-semibold text-slate-600'>
                <span>Taxes &amp; Charges (5%)</span>
                <span className='font-bold text-slate-800'>
                  ₹{taxAmount.toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-black'>
                <span>Grand Total</span>
                <span className='text-red-600'>
                  ₹{finalAmountToPay.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submission Button */}
            <Button
              className='flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/10 hover:bg-red-700 active:scale-95'
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Creating Order...
                </>
              ) : (
                <>Create Order (Pending Pay)</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
