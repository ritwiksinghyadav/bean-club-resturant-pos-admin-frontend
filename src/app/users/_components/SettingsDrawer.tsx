'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Phone,
  Coins,
  ClipboardList,
  Loader2,
  Save,
  KeyRound,
  LogOut,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../cart-store';
import { fetchWithAuth } from '@/lib/api-client';

const RATING_LABELS: Record<number, string> = {
  1: 'Terrible 😡',
  2: 'Poor 🙁',
  3: 'Average 😐',
  4: 'Good! 😊',
  5: 'Love it! 😍'
};

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose
}: SettingsDrawerProps) {
  const customer = useCartStore((s) => s.customer);
  const setAuth = useCartStore((s) => s.setAuth);
  const logout = useCartStore((s) => s.logout);

  // States
  const [name, setName] = useState(customer?.name || '');
  const [newPhone, setNewPhone] = useState('');
  const [otpVal, setOtpVal] = useState<string[]>(Array(6).fill(''));

  // Feedback states
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Stats states
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);

  // Logic states
  const [updatingName, setUpdatingName] = useState(false);
  const [showPhoneUpdate, setShowPhoneUpdate] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
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
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(`${apiUrl}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(
        `${apiUrl}/users/profile/change-phone-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPhoneNumber: newPhone })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          `Verification Code Sent! (Test Code: ${data.result.code})`,
          {
            duration: 10000
          }
        );
        setOtpSent(true);
        setCountdown(30);
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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(
        `${apiUrl}/users/profile/verify-phone-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeStr })
        }
      );

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

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
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

  const handleSaveFeedback = async () => {
    if (!feedbackSubject.trim() || feedbackSubject.length < 3) {
      toast.error('Subject must be at least 3 characters');
      return;
    }
    if (!feedbackDescription.trim() || feedbackDescription.length < 5) {
      toast.error('Description must be at least 5 characters');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetchWithAuth(`${apiUrl}/users/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: feedbackSubject,
          description: feedbackDescription,
          rating: feedbackRating
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(
          'Thank you! Your feedback has been submitted successfully.'
        );
        setFeedbackSubject('');
        setFeedbackDescription('');
        setFeedbackRating(5);
      } else {
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
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
            className='pb-safe fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4'
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className='flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-w-md sm:rounded-3xl'
            >
              {/* Header */}
              <div className='flex shrink-0 items-center justify-between border-b bg-white p-4'>
                <h3 className='flex items-center gap-2 text-lg font-black text-slate-800'>
                  <User className='h-5 w-5 text-red-600' />
                  Profile Settings
                </h3>
                <button
                  onClick={onClose}
                  className='rounded-full bg-gray-100 p-2 text-slate-600 transition-all hover:bg-gray-200 active:scale-95'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className='no-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5'>
                {/* Profile Avatar Card */}
                <div className='flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-sm'>
                  <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-50 bg-red-100 text-2xl font-extrabold text-red-600'>
                    {customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <h4 className='text-base leading-snug font-black text-slate-800'>
                    {customer?.name}
                  </h4>
                  <p className='mt-1 text-xs font-semibold text-slate-500'>
                    {customer?.phoneNumber}
                  </p>
                </div>

                {/* Statistics Grid */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
                    <div className='flex shrink-0 items-center justify-center rounded-2xl bg-amber-50 p-2.5 text-amber-600'>
                      <Coins className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                        Points Balance
                      </p>
                      <p className='mt-0.5 text-sm font-black text-slate-800'>
                        {pointsBalance !== null ? `${pointsBalance} pts` : '--'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm'>
                    <div className='flex shrink-0 items-center justify-center rounded-2xl bg-red-50 p-2.5 text-red-600'>
                      <ClipboardList className='h-5 w-5' />
                    </div>
                    <div>
                      <p className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                        Orders Placed
                      </p>
                      <p className='mt-0.5 text-sm font-black text-slate-800'>
                        {orderCount !== null ? `${orderCount} Orders` : '--'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name Editor Section */}
                <div className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
                  <h3 className='text-xs font-black tracking-wider text-slate-700 uppercase'>
                    Edit Profile Name
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500'>
                      <User className='mr-2.5 h-4 w-4 text-slate-400' />
                      <input
                        type='text'
                        className='w-full bg-transparent text-sm font-bold text-slate-800 outline-none'
                        placeholder='Your name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <button
                      type='button'
                      onClick={handleSaveName}
                      disabled={updatingName || name === customer?.name}
                      className='flex w-full items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400'
                    >
                      {updatingName ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <Save className='h-3.5 w-3.5' />
                      )}
                      Save Profile Name
                    </button>
                  </div>
                </div>

                {/* Secure Phone Editor Section */}
                <div className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-xs font-black tracking-wider text-slate-700 uppercase'>
                      Registered Phone Number
                    </h3>
                    {!showPhoneUpdate && (
                      <button
                        onClick={() => setShowPhoneUpdate(true)}
                        className='cursor-pointer text-xs font-extrabold text-red-600 hover:underline'
                      >
                        Update
                      </button>
                    )}
                  </div>

                  {!showPhoneUpdate ? (
                    <div className='flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-sm font-bold text-slate-800'>
                      <Phone className='h-4 w-4 text-slate-400' />
                      {customer?.phoneNumber}
                    </div>
                  ) : (
                    <div className='animate-in slide-in-from-top-3 space-y-4 pt-1 duration-250'>
                      {/* Enter Phone number block */}
                      {!otpSent ? (
                        <div className='space-y-3'>
                          <div className='flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500'>
                            <Phone className='mr-2.5 h-4 w-4 text-slate-400' />
                            <input
                              type='tel'
                              className='w-full bg-transparent text-sm font-bold text-slate-800 outline-none'
                              placeholder='Enter new phone number'
                              value={newPhone}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/\D/g, '')
                                  .slice(0, 10);
                                setNewPhone(val);
                              }}
                            />
                          </div>
                          <div className='flex gap-2'>
                            <button
                              type='button'
                              onClick={() => setShowPhoneUpdate(false)}
                              className='flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]'
                            >
                              Cancel
                            </button>
                            <button
                              type='button'
                              onClick={handleSendPhoneOtp}
                              disabled={otpLoading || !newPhone}
                              className='flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400'
                            >
                              {otpLoading && (
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              )}
                              Request OTP
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Verify Phone Number OTP Block */
                        <div className='space-y-4'>
                          <p className='text-xs leading-normal font-semibold text-slate-500'>
                            Enter 6-digit verification code sent to{' '}
                            <span className='font-extrabold text-slate-800'>
                              {newPhone}
                            </span>
                            :
                          </p>

                          <div className='flex justify-between gap-1.5'>
                            {otpVal.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => {
                                  otpRefs.current[i] = el;
                                }}
                                type='text'
                                maxLength={1}
                                inputMode='numeric'
                                pattern='[0-9]*'
                                className='h-12 w-10 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-center text-lg font-black transition-all outline-none focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600'
                                value={digit}
                                onChange={(e) =>
                                  handleOtpChange(i, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                onPaste={handlePaste}
                                disabled={verifyingPhone}
                              />
                            ))}
                          </div>

                          <div className='text-center text-xs font-bold text-slate-400'>
                            {canResend ? (
                              <button
                                type='button'
                                onClick={handleSendPhoneOtp}
                                className='text-red-600 transition-colors hover:text-red-700'
                              >
                                Resend code
                              </button>
                            ) : (
                              <span>Resend in {countdown}s</span>
                            )}
                          </div>

                          <div className='flex gap-2'>
                            <button
                              type='button'
                              onClick={() => {
                                setOtpSent(false);
                                setOtpVal(Array(6).fill(''));
                              }}
                              className='flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]'
                            >
                              Back
                            </button>
                            <button
                              type='button'
                              onClick={handleVerifyPhoneOtp}
                              disabled={
                                verifyingPhone || otpVal.join('').length !== 6
                              }
                              className='flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400'
                            >
                              {verifyingPhone && (
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              )}
                              Verify & Update
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Feedback Section */}
                <div className='space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm'>
                  <h3 className='flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-700 uppercase'>
                    <Star className='h-4 w-4 animate-bounce fill-amber-500 text-amber-500' />{' '}
                    Share Your Feedback
                  </h3>
                  <div className='space-y-3'>
                    <div className='flex flex-col gap-2'>
                      <div className='flex items-center justify-between'>
                        <label className='text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                          Rating
                        </label>
                        <span className='animate-in fade-in slide-in-from-top-1 rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-600 duration-250'>
                          {RATING_LABELS[feedbackRating]}
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 py-1'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type='button'
                            onClick={() => setFeedbackRating(star)}
                            className='cursor-pointer transition-transform hover:scale-110 focus:outline-none active:scale-95'
                          >
                            <Star
                              className={`h-7 w-7 transition-colors duration-200 ${
                                star <= feedbackRating
                                  ? 'scale-110 fill-amber-400 text-amber-400'
                                  : 'text-slate-300 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className='flex items-center rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500'>
                      <input
                        type='text'
                        className='w-full bg-transparent text-sm font-bold text-slate-800 outline-none'
                        placeholder='Subject of your feedback'
                        value={feedbackSubject}
                        onChange={(e) => setFeedbackSubject(e.target.value)}
                      />
                    </div>

                    <div className='flex items-start rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-red-500'>
                      <textarea
                        rows={3}
                        className='w-full resize-none bg-transparent text-sm font-bold text-slate-800 outline-none'
                        placeholder='Tell us what you think...'
                        value={feedbackDescription}
                        onChange={(e) => setFeedbackDescription(e.target.value)}
                      />
                    </div>

                    <button
                      type='button'
                      onClick={handleSaveFeedback}
                      disabled={
                        submittingFeedback ||
                        !feedbackSubject.trim() ||
                        !feedbackDescription.trim()
                      }
                      className='flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white transition-all hover:bg-red-700 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400'
                    >
                      {submittingFeedback ? (
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      ) : (
                        <Save className='h-3.5 w-3.5' />
                      )}
                      Submit Feedback
                    </button>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type='button'
                  onClick={handleLogoutClick}
                  className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-rose-100 py-3.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-50/30 active:scale-[0.98]'
                >
                  <LogOut className='h-4 w-4' />
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
                className='fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className='flex w-full max-w-xs flex-col items-center rounded-3xl border border-slate-100/50 bg-white p-6 text-center shadow-2xl'
                >
                  <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600'>
                    <LogOut className='h-5 w-5 animate-pulse' />
                  </div>
                  <h3 className='mb-1 text-base font-black text-slate-800'>
                    Sign Out
                  </h3>
                  <p className='mb-5 px-2 text-xs font-semibold text-slate-500'>
                    Are you sure you want to sign out of Bean Club?
                  </p>
                  <div className='flex w-full gap-3'>
                    <button
                      type='button'
                      onClick={() => setShowLogoutConfirm(false)}
                      className='flex-1 cursor-pointer rounded-2xl bg-slate-100 py-3 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-[0.98]'
                    >
                      Cancel
                    </button>
                    <button
                      type='button'
                      onClick={handleConfirmLogout}
                      className='flex-1 cursor-pointer rounded-2xl bg-rose-600 py-3 text-xs font-bold text-white transition-all hover:bg-rose-700 active:scale-[0.98]'
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
