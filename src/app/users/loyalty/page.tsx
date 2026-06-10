'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../cart-store';
import {
  Award,
  Loader2,
  Lock,
  User,
  Phone,
  X,
  Coffee,
  Coins,
  History,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/api-client';

interface LedgerEntry {
  id: string;
  points: number;
  description: string;
  createdAt: string;
}

export default function CustomerLoyalty() {
  const storeToken = useCartStore((state) => state.token);
  const storeRefreshToken = useCartStore((state) => state.refreshToken);
  const storeCustomer = useCartStore((state) => state.customer);
  const setAuth = useCartStore((state) => state.setAuth);

  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth Dialog state (for unauthenticated users)
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
    } catch (err) {
      console.error('Silent reauth helper network/server error:', err);
      return null;
    }
  };

  const fetchLoyalty = async () => {
    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetchWithAuth(`${apiUrl}/users/loyalty`);

      if (res.status === 401) {
        setIsAuthOpen(true);
        return;
      }

      const data = await res.json();
      if (data.success && data.result) {
        setBalance(data.result.balance || 0);
        setLedger(data.result.ledger || []);
      } else {
        toast.error('Failed to load rewards balance.');
      }
    } catch (err) {
      console.error('Fetch loyalty error:', err);
      toast.error('Network error. Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setToken(storeToken);
      setCustomer(storeCustomer);
    }
  }, [mounted, storeToken, storeCustomer]);

  // Silent re-authentication check on mount
  useEffect(() => {
    if (!mounted) return;
    if (!storeToken && storeRefreshToken) {
      silentReauthHelper();
    }
  }, [mounted, storeToken, storeRefreshToken]);

  useEffect(() => {
    if (token) {
      fetchLoyalty();
    }
  }, [token]);

  if (!mounted) return null;

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
        toast.success(`Welcome, ${user.name}!`);
        setIsAuthOpen(false);
        fetchLoyalty();
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

  const formatLedgerDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className='flex min-h-screen flex-col bg-slate-50 pb-24 font-sans text-slate-900'>
      {/* Header — Glassmorphism */}
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
          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-400/30'>
            <Award className='h-4 w-4 text-white' />
          </div>
          <div>
            <h1 className='text-lg leading-none font-black tracking-tight text-slate-900'>
              Bean Club Rewards
            </h1>
            <p className='mt-0.5 text-[10px] leading-none font-semibold tracking-wider text-amber-500'>
              LOYALTY PROGRAM
            </p>
          </div>
        </div>
        {token && (
          <button
            onClick={() => fetchLoyalty()}
            disabled={loading}
            className='flex items-center gap-1.5 rounded-2xl bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-500 transition-all hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50'
          >
            <Loader2
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className='mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-4'>
        {loading && ledger.length === 0 ? (
          /* Loading States */
          <div className='flex flex-col items-center justify-center space-y-3 py-20 text-slate-500'>
            <Loader2 className='h-8 w-8 animate-spin text-red-500' />
            <p className='text-sm font-medium'>Fetching points balance...</p>
          </div>
        ) : (
          /* Loyalty Card & Statement */
          <div className='space-y-6'>
            {/* Premium Gold Loyalty Card with gloss */}
            <div
              className='relative flex aspect-[1.7/1] flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-xl'
              style={{
                background:
                  'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                boxShadow:
                  '0 12px 40px rgba(245,158,11,0.35), 0 4px 16px rgba(180,83,9,0.2)'
              }}
            >
              {/* Decorative orbs */}
              <div className='pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/8 blur-2xl' />
              <div className='pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-black/10 blur-xl' />
              {/* Gloss sheen */}
              <div className='pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-b from-white/15 via-transparent to-transparent' />
              {/* Top shine strip */}
              <div className='pointer-events-none absolute top-0 right-8 left-8 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent' />

              <div className='z-10 flex items-start justify-between'>
                <div>
                  <p className='text-[10px] font-bold tracking-widest text-amber-100/80 uppercase'>
                    GOLD MEMBER
                  </p>
                  <h3 className='mt-1 text-lg font-black tracking-tight'>
                    {customer?.name}
                  </h3>
                </div>
                <div className='rounded-2xl border border-white/15 bg-white/15 p-2.5 backdrop-blur-md'>
                  <Coffee className='h-5 w-5 text-amber-200' />
                </div>
              </div>

              <div className='z-10 mt-6'>
                <p className='text-[10px] font-bold tracking-wider text-amber-100/70 uppercase'>
                  TOTAL POINTS BALANCE
                </p>
                <div className='mt-1 flex items-baseline gap-1.5'>
                  <span className='text-5xl font-extrabold tracking-tight'>
                    {balance}
                  </span>
                  <span className='text-sm font-bold text-amber-200'>PTS</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className='grid grid-cols-2 gap-3'>
              <div className='card-hover flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-center rounded-xl bg-amber-50 p-2.5 text-amber-600'>
                  <Coins className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-[10px] font-semibold text-slate-400'>
                    Earn Rate
                  </p>
                  <p className='text-xs font-extrabold text-slate-700'>
                    1 pt / ₹1
                  </p>
                </div>
              </div>
              <div className='card-hover flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-center rounded-xl bg-emerald-50 p-2.5 text-emerald-600'>
                  <TrendingUp className='h-4 w-4' />
                </div>
                <div>
                  <p className='text-[10px] font-semibold text-slate-400'>
                    Value Rate
                  </p>
                  <p className='text-xs font-extrabold text-emerald-600'>
                    ₹ 1.00 / pt
                  </p>
                </div>
              </div>
            </div>

            {/* Statement Ledger */}
            <div className='space-y-4'>
              <div className='flex items-center gap-2 text-slate-700'>
                <History className='h-4 w-4 text-red-600' />
                <h3 className='text-xs font-extrabold tracking-wider uppercase'>
                  Points Ledger Statement
                </h3>
              </div>

              {ledger.length === 0 ? (
                <div className='rounded-3xl border border-gray-100 bg-white p-8 text-center text-slate-500 shadow-sm'>
                  <p className='text-xs'>No points statements found.</p>
                  <p className='mt-1 text-[10px] text-slate-400'>
                    Order coffee to earn your first loyalty points!
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className='card-hover flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-red-200/60'
                      style={{
                        borderLeft:
                          entry.points >= 0
                            ? '3px solid #10b981'
                            : '3px solid #ef4444'
                      }}
                    >
                      <div>
                        <p className='text-xs font-bold text-slate-800'>
                          {entry.description}
                        </p>
                        <p className='mt-1 text-[10px] font-semibold text-slate-400'>
                          {formatLedgerDate(entry.createdAt)}
                        </p>
                      </div>
                      <div className='flex flex-col items-end gap-0.5'>
                        <span
                          className={`text-sm font-extrabold ${
                            entry.points >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {entry.points >= 0
                            ? `+${entry.points}`
                            : entry.points}{' '}
                          pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
