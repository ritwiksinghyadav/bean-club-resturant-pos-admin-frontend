'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Coins, ClipboardList, Loader2, Save, KeyRound, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../cart-store';
import { fetchWithAuth } from '@/lib/api-client';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const customer = useCartStore((s) => s.customer);
  const setAuth = useCartStore((s) => s.setAuth);
  const logout = useCartStore((s) => s.logout);

  // States
  const [name, setName] = useState(customer?.name || '');
  const [newPhone, setNewPhone] = useState('');
  const [otpVal, setOtpVal] = useState<string[]>(Array(6).fill(''));
  
  // Stats states
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  
  // Logic states
  const [updatingName, setUpdatingName] = useState(false);
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync name with store customer
  useEffect(() => {
    if (customer) {
      setName(customer.name);
    }
  }, [customer]);

  // Fetch stats (orders count and loyalty points balance) on mount/open
  useEffect(() => {
    if (isOpen && customer) {
      // Reset states
      setShowPhoneUpdate(false);
      setOtpSent(false);
      setNewPhone('');
      setOtpVal(Array(6).fill(''));
      setShowLogoutConfirm(false);

      const fetchStats = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
          
          // Fetch orders count
          const ordersRes = await fetchWithAuth(`${apiUrl}/users/orders`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            if (ordersData.success && ordersData.result?.orders) {
              setOrderCount(ordersData.result.orders.length);
            }
          }

          // Fetch loyalty points
          const loyaltyRes = await fetchWithAuth(`${apiUrl}/users/loyalty`);
          if (loyaltyRes.ok) {
            const loyaltyData = await loyaltyRes.json();
            if (loyaltyData.success && loyaltyData.result) {
              setPointsBalance(loyaltyData.result.balance || 0);
            }
          }
        } catch (err) {
          console.error('Error fetching settings stats:', err);
        }
      };

      fetchStats();
    }
  }, [isOpen, customer]);

  // Countdown timer for phone update OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  // Update Name handler
  const handleSaveName = async () => {
    if (!name.trim() || name.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    setUpdatingName(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.result?.user) {
        // Update store credentials
        const currentToken = useCartStore.getState().token;
        const currentRefreshToken = useCartStore.getState().refreshToken;
        setAuth(currentToken, currentRefreshToken, data.result.user);
        
        toast.success('Profile name updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update name');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to update name.');
    } finally {
      setUpdatingName(false);
    }
  };

  // Send Change Phone OTP handler
  const handleSendPhoneOtp = async () => {
    const isPhoneValid = /^\d{10}$/.test(newPhone);
    if (!isPhoneValid) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (newPhone === customer?.phoneNumber) {
      toast.error('Please enter a different phone number');
      return;
    }

    setOtpLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(`${apiUrl}/users/profile/change-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhoneNumber: newPhone }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`Verification Code Sent! (Test Code: ${data.result.code})`, {
          duration: 10000,
        });
        setOtpSent(true);
        setCountdown(60);
        setOtpVal(Array(6).fill(''));
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 300);
      } else {
        toast.error(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to request OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify and Update Phone number handler
  const handleVerifyPhoneOtp = async () => {
    const codeStr = otpVal.join('');
    if (codeStr.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code');
      return;
    }

    setVerifyingPhone(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(`${apiUrl}/users/profile/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.result?.user) {
        // Update store credentials
        const currentToken = useCartStore.getState().token;
        const currentRefreshToken = useCartStore.getState().refreshToken;
        setAuth(currentToken, currentRefreshToken, data.result.user);

        toast.success('Phone number updated successfully!');
        setShowPhoneUpdate(false);
        setOtpSent(false);
        setNewPhone('');
      } else {
        toast.error(data.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to verify code.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val && !/^\d$/.test(val)) return;

    const newOtp = [...otpVal];
    newOtp[index] = val;
    setOtpVal(newOtp);

    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpVal[index] && index > 0) {
        const newOtp = [...otpVal];
        newOtp[index - 1] = '';
        setOtpVal(newOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpVal];
        newOtp[index] = '';
        setOtpVal(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtpVal(newOtp);
    otpRefs.current[5]?.focus();
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    onClose();
    toast.success('Logged out successfully');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 pb-safe"
          >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md bg-slate-50 sm:rounded-3xl rounded-t-3xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-red-600" />
                Profile Settings
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0 no-scrollbar">
              
              {/* Profile Avatar Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 border-2 border-red-50 rounded-full flex items-center justify-center text-red-600 font-extrabold text-2xl mb-3">
                  {customer?.name?.charAt(0).toUpperCase()}
                </div>
                <h4 className="text-base font-black text-slate-800 leading-snug">{customer?.name}</h4>
                <p className="text-xs text-slate-500 font-semibold mt-1">{customer?.phoneNumber}</p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Points Balance</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      {pointsBalance !== null ? `${pointsBalance} pts` : '--'}
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Placed</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">
                      {orderCount !== null ? `${orderCount} Orders` : '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Name Editor Section */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  Edit Profile Name
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:bg-white transition-all">
                    <User className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type="text"
                      className="w-full outline-none text-slate-800 text-sm font-bold bg-transparent"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={updatingName || name === customer?.name}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 rounded-2xl font-bold text-xs transition-all flex justify-center items-center gap-1.5 active:scale-[0.98]"
                  >
                    {updatingName ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Save Profile Name
                  </button>
                </div>
              </div>

              {/* Secure Phone Editor Section */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase">
                    Registered Phone Number
                  </h3>
                  {!showPhoneUpdate && (
                    <button
                      onClick={() => setShowPhoneUpdate(true)}
                      className="text-xs font-extrabold text-red-600 hover:underline cursor-pointer"
                    >
                      Update
                    </button>
                  )}
                </div>

                {!showPhoneUpdate ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm font-bold text-slate-800">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {customer?.phoneNumber}
                  </div>
                ) : (
                  <div className="space-y-4 pt-1 animate-in slide-in-from-top-3 duration-250">
                    
                    {/* Enter Phone number block */}
                    {!otpSent ? (
                      <div className="space-y-3">
                        <div className="flex items-center border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-2.5 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:bg-white transition-all">
                          <Phone className="w-4 h-4 text-slate-400 mr-2.5" />
                          <input
                            type="tel"
                            className="w-full outline-none text-slate-800 text-sm font-bold bg-transparent"
                            placeholder="Enter new phone number"
                            value={newPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setNewPhone(val);
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPhoneUpdate(false)}
                            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.98]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={otpLoading || !newPhone}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 rounded-2xl font-bold text-xs transition-all flex justify-center items-center gap-1.5 active:scale-[0.98]"
                          >
                            {otpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Request OTP
                          </button>
                        </div>
                      </div>
                    ) : (
                      
                      /* Verify Phone Number OTP Block */
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-semibold leading-normal">
                          Enter 6-digit verification code sent to <span className="font-extrabold text-slate-800">{newPhone}</span>:
                        </p>
                        
                        <div className="flex justify-between gap-1.5">
                          {otpVal.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => { otpRefs.current[i] = el; }}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="w-10 h-12 border-2 border-slate-200 bg-slate-50/50 rounded-xl text-center text-lg font-black focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 outline-none transition-all"
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(i, e)}
                              onPaste={handlePaste}
                              disabled={verifyingPhone}
                            />
                          ))}
                        </div>

                        <div className="text-center text-xs font-bold text-slate-400">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={handleSendPhoneOtp}
                              className="text-red-600 hover:text-red-700 transition-colors"
                            >
                              Resend code
                            </button>
                          ) : (
                            <span>Resend in {countdown}s</span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtpVal(Array(6).fill('')); }}
                            className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.98]"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleVerifyPhoneOtp}
                            disabled={verifyingPhone || otpVal.join('').length !== 6}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 rounded-2xl font-bold text-xs transition-all flex justify-center items-center gap-1.5 active:scale-[0.98]"
                          >
                            {verifyingPhone && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Verify & Update
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full border-2 border-rose-100 hover:bg-rose-50/30 text-rose-600 py-3.5 rounded-2xl font-bold text-sm transition-all flex justify-center items-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out from Bean Club
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Sign Out Confirmation Modal */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 flex flex-col items-center text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-3">
                    <LogOut className="w-5 h-5 animate-pulse" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 mb-1">Sign Out</h3>
                  <p className="text-xs text-slate-500 font-semibold mb-5 px-2">
                    Are you sure you want to sign out of Bean Club?
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLogout}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
