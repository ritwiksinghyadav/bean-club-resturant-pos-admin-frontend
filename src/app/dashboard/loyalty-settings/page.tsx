'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Settings, Coins, Loader2, RefreshCw, AlertCircle, Percent } from 'lucide-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoyaltySettingsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [earningRatioPercentage, setEarningRatioPercentage] = useState<number>(10);
  const [maxEarningPoints, setMaxEarningPoints] = useState<number>(100);

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.result) {
        setEarningRatioPercentage(data.result.earningRatioPercentage ?? 10);
        setMaxEarningPoints(data.result.maxEarningPoints ?? 100);
      }
    } catch {
      toast.error('Failed to load loyalty settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (earningRatioPercentage < 0 || earningRatioPercentage > 100) {
      toast.error('Earning ratio percentage must be between 0% and 100%');
      return;
    }

    if (maxEarningPoints < 0) {
      toast.error('Max earning points cap must be a non-negative number');
      return;
    }

    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          earningRatioPercentage,
          maxEarningPoints
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        toast.success('Loyalty configurations updated successfully');
        setEarningRatioPercentage(data.result.earningRatioPercentage);
        setMaxEarningPoints(data.result.maxEarningPoints);
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch {
      toast.error('Network error. Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-6 max-w-2xl mx-auto w-full pb-10">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-red-600 animate-spin-slow" />
              Loyalty Rule Config Settings
            </h1>
            <p className="text-sm text-muted-foreground">Configure global checkout points earning thresholds and limits</p>
          </div>
          <Button onClick={fetchSettings} disabled={loading} size="sm" variant="outline" className="flex items-center gap-1.5 font-semibold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-sm font-semibold">Loading Config Variables...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border shadow-sm p-6 space-y-6">
            
            {/* Explanatory Info Card */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-4 flex gap-3 text-amber-900 text-xs leading-normal font-semibold">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>How do Earning Threshold Calculations work?</p>
                <ul className="list-disc list-inside space-y-1 font-medium mt-1 pl-1 text-[11px] text-amber-800">
                  <li>Points are calculated purely on the <strong>net cash amount paid</strong> at the counter (after points discounts).</li>
                  <li>Earning percentage (e.g. 50%) gives ₹1 cash paid = 0.5 points. Paid ₹100 cash ➜ Client earns 50 points.</li>
                  <li>If the order is paid 100% with points (cash amount is ₹0), the client earns 0 points.</li>
                  <li>Earnings are capped per order at the specified Max limit.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {/* Earning Ratio Percentage */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-red-500" /> Earning Ratio Percentage (%)
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter ratio percentage (e.g. 50)..."
                    value={earningRatioPercentage}
                    onChange={(e) => setEarningRatioPercentage(parseInt(e.target.value, 10) || 0)}
                    required
                    className="rounded-xl border-muted/80 focus-visible:ring-red-500"
                  />
                  <span className="absolute right-3 font-bold text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Percentage of net bill paid on cash to credit as points. Set 100% for 1:1 reward matching.</p>
              </div>

              {/* Max Earning Points */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> Max Earning Points Limit Per Order
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter maximum points cap per order (e.g. 100)..."
                  value={maxEarningPoints}
                  onChange={(e) => setMaxEarningPoints(parseInt(e.target.value, 10) || 0)}
                  required
                  className="rounded-xl border-muted/80 focus-visible:ring-red-500"
                />
                <p className="text-[10px] text-muted-foreground">The maximum number of loyalty points that can be earned on a single order, regardless of bill size.</p>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-4 border-t flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-6 flex items-center gap-1.5 active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Settings Config'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageContainer>
  );
}
