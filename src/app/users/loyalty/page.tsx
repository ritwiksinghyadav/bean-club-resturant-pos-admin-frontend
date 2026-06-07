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

interface LedgerEntry {
  id: string;
  points: number;
  description: string;
  createdAt: string;
}

export default function CustomerLoyalty() {
  const storeToken = useCartStore((state) => state.token);
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

  const silentReauthHelper = async (phoneNumber: string): Promise<string | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      if (res.status >= 400 && res.status < 500) {
        setAuth(null, null);
        setToken(null);
        setCustomer(null);
        return null;
      }

      const data = await res.json();
      if (data.success && data.result) {
        const { accessToken, user } = data.result;
        setAuth(accessToken, user);
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

  const fetchLoyalty = async (authToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/loyalty`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.status === 401 && storeCustomer?.phoneNumber) {
        const newToken = await silentReauthHelper(storeCustomer.phoneNumber);
        if (newToken) {
          const retryRes = await fetch(`${apiUrl}/users/loyalty`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          const retryData = await retryRes.json();
          if (retryData.success && retryData.result) {
            setBalance(retryData.result.balance || 0);
            setLedger(retryData.result.ledger || []);
          }
        }
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
    if (!storeToken && storeCustomer?.phoneNumber) {
      silentReauthHelper(storeCustomer.phoneNumber);
    }
  }, [mounted, storeToken, storeCustomer]);

  useEffect(() => {
    if (token) {
      fetchLoyalty(token);
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
        const { accessToken, user } = data.result;
        const newToken = accessToken;
        setAuth(newToken, user);
        toast.success(`Welcome, ${user.name}!`);
        setIsAuthOpen(false);
        fetchLoyalty(newToken);
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
            onClick={() => fetchLoyalty(token)}
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
        {!token ? (
          /* Place Order First CTA Screen */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">You need to place an order first</h3>
              <p className="text-xs text-slate-500 mt-2 max-w-[250px] mx-auto leading-relaxed">
                You need to place an order first to register your profile and see order logs/loyalty points.
              </p>
            </div>
            <Link
              href="/users"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10 active:scale-95 flex items-center justify-center gap-1.5"
            >
              Browse Menu & Order
            </Link>
          </div>
        ) : loading && ledger.length === 0 ? (
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
                  <p className="text-xs font-bold text-emerald-600">₹ 0.10 / pt</p>
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
              Please enter your details to view your loyalty logs.
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
                  'Confirm & Verify'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
