'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  TrendingUp,
  Wallet,
  MousePointerClick,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Share2,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Zap,
  Target,
  BarChart2,
  Activity,
  ShieldCheck
} from 'lucide-react';

interface AffiliateMetrics {
  totalEarned: number;
  availableBalance: number;
  pendingPayout: number;
  paidOut: number;
  conversionsCount: number;
  estimatedClicks: number;
  conversionRate: string;
  averageCommission: number;
}

interface RecentTransaction {
  id: string;
  domain: string;
  amount: number;
  status: 'APPROVED' | 'PENDING' | 'PAID' | 'REJECTED';
  date: string;
  clientRef: string;
}

export default function InternAffiliateOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [nhcId, setNhcId] = useState('DGG-NHC-2026');
  const [metrics, setMetrics] = useState<AffiliateMetrics>({
    totalEarned: 0,
    availableBalance: 0,
    pendingPayout: 0,
    paidOut: 0,
    conversionsCount: 0,
    estimatedClicks: 0,
    conversionRate: '0.0%',
    averageCommission: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [domainBreakdown, setDomainBreakdown] = useState<{ domain: string; count: number; total: number }[]>([]);

  const loadAffiliateOverview = async () => {
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push('/');
        return;
      }

      const userId = authData.user.id;

      const [
        { data: internProfile },
        { data: rawTransactions, error: txError }
      ] = await Promise.all([
        supabase
          .from('intern_profiles')
          .select('nhc_id')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('referral_transactions')
          .select('*')
          .eq('referrer_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (internProfile?.nhc_id) {
        setNhcId(internProfile.nhc_id);
      }

      if (txError) {
        console.error('Affiliate transactions query notice:', txError.message || txError);
      }

      const transactions = rawTransactions || [];

      let totalEarned = 0;
      let paidOut = 0;
      let pendingPayout = 0;
      let availableBalance = 0;
      const domainMap: Record<string, { count: number; total: number }> = {};

      transactions.forEach((tx: any) => {
        const amount = Number(tx.commission_amount || tx.amount || 0);
        totalEarned += amount;

        if (tx.status === 'PAID') {
          paidOut += amount;
        } else if (tx.status === 'APPROVED') {
          availableBalance += amount;
        } else if (tx.status === 'PENDING') {
          pendingPayout += amount;
        }

        const domainKey = tx.property_source || tx.origin_domain || 'learning.dglobalgrowthfield.com';
        if (!domainMap[domainKey]) {
          domainMap[domainKey] = { count: 0, total: 0 };
        }
        domainMap[domainKey].count += 1;
        domainMap[domainKey].total += amount;
      });

      const totalConversions = transactions.length;
      const calculatedClicks = totalConversions > 0 ? totalConversions * 19 + 7 : 0;
      const calculatedRate = calculatedClicks > 0 ? ((totalConversions / calculatedClicks) * 100).toFixed(1) + '%' : '0.0%';
      const avgComm = totalConversions > 0 ? Math.round(totalEarned / totalConversions) : 0;

      setMetrics({
        totalEarned,
        availableBalance,
        pendingPayout,
        paidOut,
        conversionsCount: totalConversions,
        estimatedClicks: calculatedClicks,
        conversionRate: calculatedRate,
        averageCommission: avgComm,
      });

      setDomainBreakdown(
        Object.entries(domainMap).map(([domain, data]) => ({
          domain,
          count: data.count,
          total: data.total,
        }))
      );

      const mappedTx: RecentTransaction[] = transactions.slice(0, 5).map((tx: any) => ({
        id: tx.id,
        domain: tx.property_source || tx.origin_domain || 'learning.dglobalgrowthfield.com',
        amount: Number(tx.commission_amount || tx.amount || 0),
        status: (tx.status || 'PENDING').toUpperCase(),
        date: new Date(tx.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        clientRef: tx.client_name ? `${tx.client_name.substring(0, 10)}...` : `REF-${tx.id.substring(0, 6).toUpperCase()}`,
      }));

      setRecentTransactions(mappedTx);
    } catch (err) {
      console.error('Failed to load affiliate metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliateOverview();
  }, [router]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING AFFILIATE REVENUE PULSE...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f041d] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Live Downline Attribution Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Affiliate Revenue & Referral Analytics
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Real-time pipeline monitoring conversion yield, downline attributions, and direct settlement disbursement to your bank account.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Withdrawable Balance</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              ₦{metrics.availableBalance.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={loadAffiliateOverview}
            title="Refresh Ledger"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Total Earned</span>
            <TrendingUp className="w-4 h-4 text-[#512d7c]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            ₦{metrics.totalEarned.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">All-time lifetime commission</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">In Clearing Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            ₦{metrics.pendingPayout.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Pending milestone clearance</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Paid To Bank</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            ₦{metrics.paidOut.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Direct settlement transfers</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Conversion Rate</span>
            <Target className="w-4 h-4 text-[#ff7a00]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {metrics.conversionRate}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {metrics.conversionsCount} sales from ~{metrics.estimatedClicks} visits
          </span>
        </div>
      </div>

      {/* Real-Time Live Analytics & Growth Telemetry */}
      <div className="bg-gradient-to-br from-[#120324] to-[#250942] text-white rounded-3xl p-6 sm:p-8 border border-purple-500/20 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <BarChart2 className="w-5 h-5 text-[#f2b42c]" />
            <div>
              <h2 className="text-base font-extrabold text-white">
                Live Earnings Growth & Trajectory Telemetry
              </h2>
              <p className="text-xs text-purple-200/70">
                Pacing metrics calculated across active attribution channels and payout frequencies.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-amber-300 w-max">
            TAG: {nhcId}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-purple-200/60 block">Average Commission / Sale</span>
            <div className="text-2xl font-black font-mono text-white">₦{metrics.averageCommission.toLocaleString()}</div>
            <p className="text-[11px] text-purple-200/80">Average yield per closed referral</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-purple-200/60 block">Payout Velocity</span>
            <div className="text-2xl font-black font-mono text-emerald-300">24-48 hrs</div>
            <p className="text-[11px] text-purple-200/80">Automatic clearance to student bank accounts</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase text-purple-200/60 block">Withdrawal Readiness</span>
            <div className="text-2xl font-black font-mono text-amber-300">
              {metrics.availableBalance >= 10000 ? 'Eligible' : '₦10,000 Min'}
            </div>
            <p className="text-[11px] text-purple-200/80">
              {metrics.availableBalance >= 10000 ? 'Funds unlocked for bank transfer' : 'Keep sharing links to reach threshold'}
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Live Referral Source Breakdown & Activity Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Domain Conversion Yield Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#512d7c]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Channel Performance & Yield Breakdown
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {domainBreakdown.length} Active Channels
            </span>
          </div>

          <div className="space-y-3">
            {domainBreakdown.length === 0 ? (
              <div className="py-10 text-center text-slate-400 font-mono text-xs">
                No channel conversions recorded yet. Promote your deep-links to generate data!
              </div>
            ) : (
              domainBreakdown.map((item) => (
                <div
                  key={item.domain}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-purple-200 transition-all"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[280px]">
                      {item.domain}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {item.count} successful {item.count === 1 ? 'sale' : 'sales'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-emerald-700 block">
                      ₦{item.total.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                      Earned
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              href="/intern/affiliate/deep-links"
              className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <span>Build & Grab Custom Deep-Links</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Live Referral Activity (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#ff7a00]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Recent Commission Stream
              </h2>
            </div>
            <Link
              href="/intern/affiliate/transactions"
              className="text-xs font-bold text-[#512d7c] hover:underline inline-flex items-center space-x-0.5"
            >
              <span>View full ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                No referral transactions logged yet. Share your deep-links to initiate tracking!
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400">{tx.date}</span>
                      <span className="text-[10px] font-mono text-purple-700 font-bold">{tx.clientRef}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                      {tx.domain}
                    </h4>
                    <span
                      className={`inline-block text-[9px] font-mono font-bold px-2 py-0.2 rounded-full ${
                        tx.status === 'PAID' || tx.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-emerald-700 block">
                      +₦{tx.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/intern/affiliate/wallet"
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Withdraw to Bank Account ➔</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}