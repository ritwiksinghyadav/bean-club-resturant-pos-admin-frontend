'use client';

import React, { useEffect, useState } from 'react';
import { useCartStore } from '../cart-store';
import { 
  Award, 
  Loader2, 
  Lock,
  User,
  Phone,
  X,
  Coffee,
  Gift,
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
  const token = useCartStore((state) => state.token);
  const customer = useCartStore((state) => state.customer);
  const setAuth = useCartStore((state) => state.setAuth);
  
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth Dialog state (for unauthenticated users)
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const fetchLoyalty = async (authToken: string) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/users/loyalty`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
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
    if (token) {
      fetchLoyalty(token);
    }
  }, [token]);

  if (!mounted) return null;

  // Handle Authentication for guest
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
        const { token: newToken, user } = data.result;
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-5 bg-gradient-to-b from-[#1c120e] to-transparent border-b border-[#2d1b13]/20">
        <h1 className="text-xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Bean Club Rewards
        </h1>
        <p className="text-xs text-neutral-400">Earn points on every brew</p>
      </header>

      {/* Main Panel */}
      <div className="flex-1 px-6 py-4 space-y-6">
        {!token ? (
          /* Login Screen for Guests */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#1c130f] border border-[#2d1b13]/40 flex items-center justify-center text-amber-500 shadow-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-100">Verification Required</h3>
              <p className="text-xs text-neutral-400 mt-2 max-w-[250px] mx-auto leading-relaxed">
                Log in with your name and phone number to see your order history and earned loyalty points.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-amber-950/20 active:scale-95 transition-all"
            >
              Verify Customer Identity
            </button>
          </div>
        ) : loading && ledger.length === 0 ? (
          /* Loading States */
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm">Fetching points balance...</p>
          </div>
        ) : (
          /* Loyalty Card & Statement */
          <div className="space-y-6">
            {/* Premium Gold Loyalty Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 rounded-[2.5rem] p-6 text-white shadow-xl shadow-amber-950/30 flex flex-col justify-between aspect-[1.7/1] border border-amber-400/20">
              {/* Card Decor */}
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
                <p className="text-[10px] tracking-wider text-amber-100/70 font-semibold uppercase">TOTAL POINTS BALANCE</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-extrabold tracking-tight">{balance}</span>
                  <span className="text-xs font-bold text-amber-200">PTS</span>
                </div>
              </div>
            </div>

            {/* Quick stats/info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium">Earn Rate</p>
                  <p className="text-xs font-bold text-amber-100">1 pt / $1</p>
                </div>
              </div>
              <div className="bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-3xl p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium">Spent Tier</p>
                  <p className="text-xs font-bold text-emerald-500">Gold Status</p>
                </div>
              </div>
            </div>

            {/* Statement Ledger */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-neutral-300">
                <History className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Points Ledger Statement</h3>
              </div>

              {ledger.length === 0 ? (
                <div className="bg-[#18100d]/90 border border-[#2d1b13]/40 rounded-3xl p-8 text-center text-neutral-500">
                  <p className="text-xs">No ledger statements found.</p>
                  <p className="text-[10px] text-neutral-600 mt-1">Order coffee to earn your first loyalty points!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-[#18100d]/90 border border-[#2d1b13]/40 rounded-2xl p-4 flex justify-between items-center hover:border-[#4d3225]/45 transition-all duration-300"
                    >
                      <div>
                        <p className="text-xs font-bold text-amber-100">{entry.description}</p>
                        <p className="text-[10px] text-neutral-500 mt-1">
                          {formatLedgerDate(entry.createdAt)}
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold ${entry.points >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#160f0c] border border-[#2d1b13]/60 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-amber-100 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                Customer Verification
              </h3>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="p-1 rounded-full bg-neutral-800/50 hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Verify your name and phone number to earn loyalty points and view your orders.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="relative flex items-center bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-all">
                <User className="w-4 h-4 text-neutral-500 mr-2" />
                <input
                  type="text"
                  placeholder="Your Name"
                  className="bg-transparent text-xs w-full outline-none text-neutral-100 placeholder-neutral-500"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </div>

              <div className="relative flex items-center bg-[#1c130f]/60 border border-[#2d1b13]/40 rounded-2xl px-4 py-3 focus-within:border-amber-500/50 transition-all">
                <Phone className="w-4 h-4 text-neutral-500 mr-2" />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="bg-transparent text-xs w-full outline-none text-neutral-100 placeholder-neutral-500"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white py-3.5 rounded-2xl font-bold text-xs transition-all duration-200 flex justify-center items-center gap-1.5"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Authenticating...
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
