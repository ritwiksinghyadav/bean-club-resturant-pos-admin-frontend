'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings,
  Coins,
  Loader2,
  RefreshCw,
  AlertCircle,
  Percent,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Link2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRCode from 'qrcode';

export default function SettingsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken;

  // Loyalty Settings State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [earningRatioPercentage, setEarningRatioPercentage] =
    useState<number>(10);
  const [maxEarningPoints, setMaxEarningPoints] = useState<number>(100);

  // QR Code Generator State
  const [targetUrl, setTargetUrl] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize targetUrl base dynamically in the browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTargetUrl(`${window.location.origin}/users`);
    }
  }, []);

  // Generate QR Code dynamically when target URL or Table Number changes
  useEffect(() => {
    const generateQR = async () => {
      if (!targetUrl) return;
      try {
        const fullUrl = getFullUrl();
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 600,
          margin: 2,
          color: {
            dark: '#1e293b', // slate-800
            light: '#ffffff'
          }
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateQR();
  }, [targetUrl, tableNumber]);

  const getFullUrl = () => {
    if (!targetUrl) return '';
    try {
      const url = new URL(targetUrl);
      if (tableNumber.trim()) {
        url.searchParams.set('table', tableNumber.trim());
      }
      return url.toString();
    } catch {
      // Fallback simple concatenation if targetUrl is partially typed/invalid URL
      const separator = targetUrl.includes('?') ? '&' : '?';
      return tableNumber.trim()
        ? `${targetUrl}${separator}table=${encodeURIComponent(tableNumber.trim())}`
        : targetUrl;
    }
  };

  const handleCopyUrl = async () => {
    const fullUrl = getFullUrl();
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('QR Code target URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const label = tableNumber.trim()
      ? `table-${tableNumber.trim()}`
      : 'general';
    link.download = `bean-club-qr-${label}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR Code downloaded successfully');
  };

  const handlePrintQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker enabled. Please allow popups to print.');
      return;
    }

    const formattedTable = tableNumber.trim();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - Table ${formattedTable || 'General'}</title>
          <style>
            @page {
              size: A6;
              margin: 0;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: white;
              color: black;
              text-align: center;
              box-sizing: border-box;
              padding: 20px;
            }
            .card {
              border: 5px solid #dc2626;
              border-radius: 28px;
              padding: 30px 20px;
              width: 100%;
              max-width: 360px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              display: flex;
              flex-direction: column;
              align-items: center;
              box-sizing: border-box;
            }
            .logo {
              font-size: 26px;
              font-weight: 900;
              color: #dc2626;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .sub {
              font-size: 11px;
              font-weight: 700;
              color: #ef4444;
              margin: 0 0 20px 0;
              text-transform: uppercase;
              letter-spacing: 2.5px;
            }
            img {
              width: 260px;
              height: 260px;
              display: block;
              margin: 0 auto;
            }
            .instruction {
              font-size: 16px;
              font-weight: 800;
              margin: 20px 0 10px 0;
              color: #1e293b;
            }
            .table-tag {
              font-size: 13px;
              font-weight: 800;
              padding: 6px 18px;
              background-color: #f1f5f9;
              border-radius: 12px;
              display: inline-block;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1 class="logo">Bean Club</h1>
            <p class="sub">Fresh Brews & Rewards</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="instruction">Scan to Order & Earn Points!</div>
            ${formattedTable ? `<div class="table-tag">Table ${formattedTable}</div>` : `<div class="table-tag">Dine-In / Takeaway</div>`}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchSettings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
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
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
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
      <div className='mx-auto w-full max-w-4xl space-y-6 pb-10'>
        {/* Header */}
        <div className='flex items-center justify-between border-b pb-5'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <Settings className='h-6 w-6 text-red-600' />
              Settings
            </h1>
            <p className='text-muted-foreground text-sm'>
              Manage QR code portals and loyalty config settings
            </p>
          </div>
          <Button
            onClick={fetchSettings}
            disabled={loading}
            size='sm'
            variant='outline'
            className='flex items-center gap-1.5 font-semibold'
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Settings
          </Button>
        </div>

        {/* SECTION 1: QR Code Generator */}
        <div className='bg-card space-y-6 rounded-2xl border p-6 shadow-sm'>
          <div className='border-b pb-4'>
            <h2 className='flex items-center gap-2 text-lg font-bold'>
              <QrCode className='h-5 w-5 text-red-600' />
              Customer Entrance QR Code Generator
            </h2>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              Generate, test, download and print table-top ordering QR codes.
            </p>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-5'>
            {/* Form Controls (Left / 3 cols) */}
            <div className='space-y-5 md:col-span-3'>
              <div className='space-y-1.5'>
                <label className='text-muted-foreground flex items-center gap-1.5 text-xs font-bold uppercase'>
                  <Link2 className='h-3.5 w-3.5 text-slate-500' /> Customer App
                  URL
                </label>
                <Input
                  type='url'
                  placeholder='https://your-domain.com/users'
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  required
                  className='border-muted/80 rounded-xl focus-visible:ring-red-500'
                />
                <p className='text-muted-foreground text-[10px]'>
                  The main menu/ordering page url where users start their
                  session.
                </p>
              </div>

              {/* <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  Table Number (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 5, 12, VIP"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="rounded-xl border-muted/80 focus-visible:ring-red-500"
                />
                <p className="text-[10px] text-muted-foreground">Adding a table number appends a search parameter to track where order originates.</p>
              </div> */}

              {/* URL Preview and Copy */}
              <div className='space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3'>
                <span className='block text-[10px] font-black text-slate-400 uppercase'>
                  Generated Target URL
                </span>
                <div className='flex items-center justify-between gap-2 overflow-hidden rounded-lg border bg-white p-2'>
                  <span className='flex-1 truncate font-mono text-xs text-slate-600 select-all'>
                    {getFullUrl() || 'URL will appear here...'}
                  </span>
                  <div className='flex shrink-0 items-center gap-1'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-7 w-7 text-slate-500 hover:text-slate-700'
                      onClick={handleCopyUrl}
                      title='Copy URL'
                    >
                      {copied ? (
                        <Check className='h-3.5 w-3.5 text-green-600' />
                      ) : (
                        <Copy className='h-3.5 w-3.5' />
                      )}
                    </Button>
                    {getFullUrl() && (
                      <a
                        href={getFullUrl()}
                        target='_blank'
                        rel='noreferrer'
                        className='rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        title='Test Link'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className='grid grid-cols-2 gap-3 pt-2'>
                <Button
                  onClick={handleDownloadQR}
                  disabled={!qrDataUrl}
                  variant='outline'
                  className='flex items-center gap-1.5 rounded-xl border-slate-200 font-bold hover:bg-slate-50'
                >
                  <Download className='h-4 w-4 text-slate-600' />
                  Download PNG
                </Button>
                <Button
                  onClick={handlePrintQR}
                  disabled={!qrDataUrl}
                  className='flex items-center gap-1.5 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 active:scale-95'
                >
                  <Printer className='h-4 w-4' />
                  Print Table Card
                </Button>
              </div>
            </div>

            {/* Live Sign Preview (Right / 2 cols) */}
            <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed bg-slate-50/50 p-4 md:col-span-2'>
              <span className='mb-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase'>
                Live Table Sign Preview
              </span>

              <div className='pointer-events-none flex w-full max-w-[260px] flex-col items-center rounded-[20px] border-[3px] border-red-600 bg-white p-5 text-center shadow-sm select-none'>
                <h3 className='m-0 text-lg font-black tracking-tight text-red-600 uppercase'>
                  Bean Club
                </h3>
                <p className='m-0 -mt-0.5 text-[7px] font-bold tracking-[1.5px] text-red-500 uppercase'>
                  Fresh Brews & Rewards
                </p>

                <div className='my-3 flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white'>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt='QR Code Preview'
                      className='h-[170px] w-[170px] object-contain'
                    />
                  ) : (
                    <Loader2 className='h-6 w-6 animate-spin text-slate-300' />
                  )}
                </div>

                <p className='m-0 text-[10px] font-extrabold text-slate-800'>
                  Scan to Order &amp; Rewards
                </p>

                <div className='mt-2 rounded-lg bg-slate-100 px-3 py-1 text-[8px] font-extrabold text-slate-600'>
                  {tableNumber.trim()
                    ? `Table ${tableNumber.trim()}`
                    : 'Self-Serve Portal'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Loyalty Settings */}
        {loading ? (
          <div className='bg-card text-muted-foreground flex flex-col items-center justify-center space-y-3 rounded-2xl border p-6 py-20 shadow-sm'>
            <Loader2 className='h-8 w-8 animate-spin text-red-500' />
            <p className='text-sm font-semibold'>Loading Config Variables...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className='bg-card space-y-6 rounded-2xl border p-6 shadow-sm'
          >
            <div className='border-b pb-4'>
              <h2 className='flex items-center gap-2 text-lg font-bold'>
                <Coins className='animate-spin-slow h-5 w-5 text-red-600' />
                Loyalty Point &amp; Rule Settings
              </h2>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Configure global points ratios and caps per checkout.
              </p>
            </div>

            {/* Explanatory Info Card */}
            <div className='flex gap-3 rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 text-xs leading-normal font-semibold text-amber-900'>
              <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600' />
              <div className='space-y-1'>
                <p>How do Earning Threshold Calculations work?</p>
                <ul className='mt-1 list-inside list-disc space-y-1 pl-1 text-[11px] font-medium text-amber-800'>
                  <li>
                    Points are calculated purely on the{' '}
                    <strong>net cash amount paid</strong> at the counter (after
                    points discounts).
                  </li>
                  <li>
                    Earning percentage (e.g. 50%) gives ₹1 cash paid = 0.5
                    points. Paid ₹100 cash ➜ Client earns 50 points.
                  </li>
                  <li>
                    If the order is paid 100% with points (cash amount is ₹0),
                    the client earns 0 points.
                  </li>
                  <li>
                    Earnings are capped per order at the specified Max limit.
                  </li>
                </ul>
              </div>
            </div>

            <div className='space-y-4'>
              {/* Earning Ratio Percentage */}
              <div className='space-y-1'>
                <label className='text-muted-foreground flex items-center gap-1.5 text-xs font-black uppercase'>
                  <Percent className='h-3.5 w-3.5 text-red-500' /> Earning Ratio
                  Percentage (%)
                </label>
                <div className='relative flex items-center'>
                  <Input
                    type='number'
                    min='0'
                    max='100'
                    placeholder='Enter ratio percentage (e.g. 50)...'
                    value={earningRatioPercentage}
                    onChange={(e) =>
                      setEarningRatioPercentage(
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    required
                    className='border-muted/80 rounded-xl focus-visible:ring-red-500'
                  />
                  <span className='text-muted-foreground absolute right-3 text-xs font-bold'>
                    %
                  </span>
                </div>
                <p className='text-muted-foreground text-[10px]'>
                  Percentage of net bill paid on cash to credit as points. Set
                  100% for 1:1 reward matching.
                </p>
              </div>

              {/* Max Earning Points */}
              <div className='space-y-1'>
                <label className='text-muted-foreground flex items-center gap-1.5 text-xs font-black uppercase'>
                  <Coins className='h-3.5 w-3.5 text-amber-500' /> Max Earning
                  Points Limit Per Order
                </label>
                <Input
                  type='number'
                  min='0'
                  placeholder='Enter maximum points cap per order (e.g. 100)...'
                  value={maxEarningPoints}
                  onChange={(e) =>
                    setMaxEarningPoints(parseInt(e.target.value, 10) || 0)
                  }
                  required
                  className='border-muted/80 rounded-xl focus-visible:ring-red-500'
                />
                <p className='text-muted-foreground text-[10px]'>
                  The maximum number of loyalty points that can be earned on a
                  single order, regardless of bill size.
                </p>
              </div>
            </div>

            {/* Submit Actions */}
            <div className='flex justify-end border-t pt-4'>
              <Button
                type='submit'
                disabled={submitting}
                className='flex items-center gap-1.5 rounded-xl bg-red-600 px-6 font-bold text-white hover:bg-red-700 active:scale-95'
              >
                {submitting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
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
