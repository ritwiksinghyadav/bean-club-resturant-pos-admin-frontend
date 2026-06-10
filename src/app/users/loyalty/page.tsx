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
    } catch (err) {
      console.error('Silent reauth helper network/server error:', err);
      return null;
    }
  };

  const fetchLoyalty = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
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
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="px-4 py-3 bg-white shadow-sm flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2 text-red-600">
          <Award className="w-5 h-5" />
          <h1 className="text-xl font-black tracking-tight">Bean Club Rewards</h1>
        </div>
        {token && (
          <button
            onClick={() => fetchLoyalty()}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all"
          >
            <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </header>

      {/* Main Panel */}
      <div className="flex-1 px-4 py-4 max-w-2xl mx-auto w-full space-y-6">
        {loading && ledger.length === 0 ? (
          /* Loading States */
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm font-medium">Fetching points balance...</p>
          </div>
        ) : (
          /* Loyalty Card & Statement */
          <div className="space-y-6">
            {/* Premium Gold Loyalty Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl shadow-amber-600/10 flex flex-col justify-between aspect-[1.7/1] border border-amber-400/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-lg"></div>

              <div className="flex justify-between items-start z-10">
                <div>
                  <p className="text-[10px] tracking-widest text-amber-100/80 font-bold uppercase">GOLD MEMBER</p>
                  <h3 className="text-lg font-black tracking-tight mt-1">{customer?.name}</h3>
                </div>
                <div className="bg-white/10 p-2.5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <Coffee className="w-5 h-5 text-amber-200" />
                </div>
              </div>

              <div className="mt-8 z-10">
                <p className="text-[10px] tracking-wider text-amber-100/70 font-bold uppercase">TOTAL POINTS BALANCE</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-extrabold tracking-tight">{balance}</span>
                  <span className="text-xs font-bold text-amber-200">PTS</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Earn Rate</p>
                  <p className="text-xs font-bold text-slate-700">1 pt / ₹1</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Value Rate</p>
                  <p className="text-xs font-bold text-emerald-600">₹ 1.00 / pt</p>
                </div>
              </div>
            </div>

            {/* Statement Ledger */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700">
                <History className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Points Ledger Statement</h3>
              </div>

              {ledger.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-slate-500 shadow-sm">
                  <p className="text-xs">No points statements found.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Order coffee to earn your first loyalty points!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white border border-gray-100 rounded-2xl p-4 flex justify-between items-center hover:border-red-200 shadow-sm transition-all duration-300"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{entry.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                          {formatLedgerDate(entry.createdAt)}
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold ${entry.points >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {entry.points >= 0 ? `+${entry.points}` : entry.points} pts
                      </span>
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
