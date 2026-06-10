'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, ArrowLeft, Loader2, Sparkles, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../cart-store';

interface SignInPageProps {
  onSuccess?: () => void;
}

export default function SignInPage({ onSuccess }: SignInPageProps) {
  const setAuth = useCartStore((s) => s.setAuth);

  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  // Form values
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpVal, setOtpVal] = useState<string[]>(Array(6).fill(''));
  
  // Timer & loading
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Input refs for auto-shifting focus in OTP code blocks
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count down timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Handler to send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const isPhoneValid = /^\d{10}$/.test(phone);
    if (!isPhoneValid) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (activeTab === 'register' && !name) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/users/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          name: activeTab === 'register' ? name : undefined,
          mode: activeTab,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`OTP Sent! (Test Code: ${data.result.code})`, {
          duration: 10000, // Show longer so dev/user can see code
        });
        setStep('otp');
        setCountdown(60);
        setOtpVal(Array(6).fill(''));
        // Focus first OTP input on transition
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 300);
      } else {
        toast.error(data.message || 'Failed to send OTP. Try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handler to verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const codeStr = otpVal.join('');
    if (codeStr.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const response = await fetch(`${apiUrl}/users/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          name: activeTab === 'register' ? name : undefined,
          code: codeStr,
          mode: activeTab,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success && data.result) {
        const { accessToken, refreshToken, user } = data.result;
        setAuth(accessToken, refreshToken, user);
        toast.success(`Welcome, ${user.name}!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error. Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle single digit changes
  const handleOtpChange = (index: number, val: string) => {
    // Only allow numbers
    if (val && !/^\d$/.test(val)) return;

    const newOtp = [...otpVal];
    newOtp[index] = val;
    setOtpVal(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits are entered
    if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === 6) {
      // Small timeout to allow input state updating
      setTimeout(() => {
        // Trigger verification
        setLoading(true);
        const codeStr = newOtp.join('');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        fetch(`${apiUrl}/users/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            name: activeTab === 'register' ? name : undefined,
            code: codeStr,
            mode: activeTab,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.result) {
              const { accessToken, refreshToken, user } = data.result;
              setAuth(accessToken, refreshToken, user);
              toast.success(`Welcome, ${user.name}!`);
              if (onSuccess) onSuccess();
            } else {
              toast.error(data.message || 'Invalid OTP. Try again.');
              setLoading(false);
            }
          })
          .catch(() => {
            toast.error('Verification error.');
            setLoading(false);
          });
      }, 50);
    }
  };

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpVal[index] && index > 0) {
        // Shift focus to previous and clear it
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

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtpVal(newOtp);
    otpRefs.current[5]?.focus();
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-red-50/50 via-white to-red-50/20 px-6 py-8 justify-center select-none">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        
        {/* Coffee Brand Mascot Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-xl shadow-red-500/30 transform rotate-12 transition-transform hover:rotate-0 duration-300">
            <Coffee className="w-10 h-10 text-white transform -rotate-12" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 p-1.5 rounded-full border-2 border-white shadow">
            <Sparkles className="w-3.5 h-3.5 text-red-700" />
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-slate-800 text-center">
          Bean Club POS
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 mb-8 text-center max-w-[240px] leading-normal font-medium">
          Fresh brews, loyalty rewards, and instant counter payments.
        </p>

        {/* Outer Login Card Frame */}
        <div className="w-full bg-white/80 backdrop-blur-md border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-100/50">
          <AnimatePresence mode="wait">
            
            {/* ──── STEP 1: INPUT DETAILS ────────────────── */}
            {step === 'input' && (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Modern Custom Segmented Tab Controller */}
                <div className="relative flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200/40">
                  {/* Slider Background Pill */}
                  <motion.div
                    className="absolute top-1 bottom-1 bg-white rounded-xl shadow-sm border border-slate-200/30"
                    layout
                    initial={false}
                    animate={{
                      left: activeTab === 'register' ? '4px' : '50%',
                      right: activeTab === 'register' ? '50%' : '4px',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-2.5 text-xs font-bold text-center z-10 transition-colors duration-300 rounded-xl relative ${
                      activeTab === 'register' ? 'text-red-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    First time here
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className={`flex-1 py-2.5 text-xs font-bold text-center z-10 transition-colors duration-300 rounded-xl relative ${
                      activeTab === 'login' ? 'text-red-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Already have account
                  </button>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  {/* Conditionally show name only for Register Mode */}
                  <AnimatePresence initial={false}>
                    {activeTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                          Full Name
                        </label>
                        <div className="flex items-center border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:bg-white transition-all">
                          <User className="w-5 h-5 text-slate-400 mr-2.5" />
                          <input
                            type="text"
                            placeholder="John Doe"
                            className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-bold bg-transparent"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={activeTab === 'register'}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Phone input field (common) */}
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                      Phone Number
                    </label>
                    <div className="flex items-center border border-slate-200 bg-slate-50/50 rounded-2xl px-4 py-3 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 focus-within:bg-white transition-all">
                      <Phone className="w-5 h-5 text-slate-400 mr-2.5" />
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        className="w-full outline-none text-slate-800 text-sm placeholder-slate-400 font-bold bg-transparent"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setPhone(val);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white py-3.5 rounded-2xl font-black text-sm transition-all mt-6 shadow-lg shadow-red-600/20 hover:shadow-red-600/35 flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Sending code...
                      </>
                    ) : (
                      'Request Verification Code'
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* ──── STEP 2: ENTER OTP CODE ───────────────── */}
            {step === 'otp' && (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex flex-col"
              >
                {/* Back Arrow button */}
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors self-start mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Change details
                </button>

                <h3 className="text-base font-extrabold text-slate-800 mb-1">
                  Enter verification code
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-normal mb-6">
                  We sent a 6-digit verification code to <span className="font-extrabold text-slate-700">{phone}</span>.
                </p>

                {/* 6 Digit Block Inputs */}
                <div className="flex justify-between gap-2 mb-6">
                  {otpVal.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-12 h-14 border-2 border-slate-200 bg-slate-50/50 rounded-2xl text-center text-xl font-black focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 outline-none transition-all"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      disabled={loading}
                    />
                  ))}
                </div>

                {/* Timer details */}
                <div className="text-center text-xs mb-6 font-bold text-slate-500">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      Resend code
                    </button>
                  ) : (
                    <span>Resend code in {countdown}s</span>
                  )}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpVal.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-red-600/10 disabled:shadow-none flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enter Bean Club'
                  )}
                </button>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
