'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Activity,
  Users,
  Building2,
  Lock,
  Share2,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Clock,
  RefreshCw
} from 'lucide-react';

interface MetricState {
  grossTransactionVolume: number;
  platformRevenueRetained: number;
  lockedEscrowBalance: number;
  pendingAffiliatePayouts: number;
  verifiedInternsCount: number;
  accreditedStartupsCount: number;
  activePlacementsCount: number;
  totalOffersExtendedCount: number;
}

interface LiveAuditEvent {
  id: string;
  title: string;
  entity: string;
  detail: string;
  time: string;
  type: 'escrow' | 'intern' | 'startup' | 'offer';
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricState>({
    grossTransactionVolume: 0,
    platformRevenueRetained: 0,
    lockedEscrowBalance: 0,
    pendingAffiliatePayouts: 0,
    verifiedInternsCount: 0,
    accreditedStartupsCount: 0,
    activePlacementsCount: 0,
    totalOffersExtendedCount: 0,
  });
  const [liveEvents, setLiveEvents] = useState<LiveAuditEvent[]>([]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // 1. Parallel Database Queries across Core Operational Tables
      const [
        { data: allPlacements },
        { count: internsCount },
        { count: startupsCount },
        { data: affiliateReferrals }
      ] = await Promise.all([
        supabase
          .from('placements')
          .select(`
            id,
            startup_id,
            intern_id,
            role_title,
            pre_agreed_stipend,
            status,
            pipeline_stage,
            created_at,
            startup_profiles:startup_id ( company_name ),
            profiles:intern_id ( first_name, last_name )
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('intern_profiles')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('startup_profiles')
          .select('*', { count: 'exact', head: true }),

        supabase
          .from('referral_transactions')
          .select('amount, status')
      ]);

      // 2. Compute Real Financial & Placement Metrics
      let activePlacementsCount = 0;
      let totalOffersExtendedCount = 0;
      let totalEscrowStipends = 0;

      (allPlacements || []).forEach((p: any) => {
        const stipend = Number(p.pre_agreed_stipend) || 0;
        if (p.status === 'ACTIVE' || p.pipeline_stage === 'IN_TRIAL') {
          activePlacementsCount += 1;
          totalEscrowStipends += stipend;
        }
        if (p.pipeline_stage === 'OFFER_EXTENDED' || p.status === 'INVITED') {
          totalOffersExtendedCount += 1;
        }
      });

      // Pending affiliate commission sum
      const pendingAffiliate = (affiliateReferrals || [])
        .filter((r: any) => r.status === 'PENDING')
        .reduce((sum: number, cur: any) => sum + (Number(cur.amount) || 0), 0);

      const platformCut = totalEscrowStipends * 0.10;
      const grossVolume = totalEscrowStipends + platformCut;

      setMetrics({
        grossTransactionVolume: grossVolume,
        platformRevenueRetained: platformCut,
        lockedEscrowBalance: totalEscrowStipends,
        pendingAffiliatePayouts: pendingAffiliate,
        verifiedInternsCount: internsCount || 0,
        accreditedStartupsCount: startupsCount || 0,
        activePlacementsCount,
        totalOffersExtendedCount,
      });

      // 3. Formulate Real Dynamic Audit Ledger from Live DB Placements
      const formattedEvents: LiveAuditEvent[] = (allPlacements || []).slice(0, 8).map((p: any) => {
        const startupName = p.startup_profiles?.company_name || 'Enterprise Partner';
        const internName = `${p.profiles?.first_name || 'Candidate'} ${p.profiles?.last_name || ''}`.trim();
        const stipendFormatted = `₦${(Number(p.pre_agreed_stipend) || 0).toLocaleString()}`;
        
        let type: LiveAuditEvent['type'] = 'offer';
        let title = 'Placement In Negotiation';
        let detail = `${startupName} extended terms to ${internName} (${stipendFormatted}/mo)`;

        if (p.status === 'ACTIVE' || p.pipeline_stage === 'IN_TRIAL') {
          type = 'escrow';
          title = 'Active Trial Placed & Escrow Secured';
          detail = `${stipendFormatted} allocated in escrow for ${internName} at ${startupName}`;
        } else if (p.pipeline_stage === 'SHORTLISTED') {
          type = 'intern';
          title = 'Candidate Shortlisted';
          detail = `${startupName} shortlisted ${internName} for incubation consideration`;
        }

        return {
          id: `EVT-${p.id.substring(0, 6).toUpperCase()}`,
          title,
          entity: startupName,
          detail,
          time: new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          type,
        };
      });

      setLiveEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to load real admin operational telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING MASTER CLEARINGHOUSE TELEMETRY...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Operations Banner */}
      <div className="bg-gradient-to-r from-[#0f041d] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Live Governance & Tripartite Clearinghouse
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Master Command & Operations Pulse
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Real-time platform oversight: governing apprentice verification passes, CAC corporate accreditations, multi-domain affiliate attributions, and 10% milestone escrow releases.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">10% Platform Cut</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              ₦{metrics.platformRevenueRetained.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            title="Refresh Pulse"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Primary Real Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Gross Contract Volume</span>
            <TrendingUp className="w-4 h-4 text-[#512d7c]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            ₦{metrics.grossTransactionVolume.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">
            Live Tripartite Contract Total
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Active Escrow Vault</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            ₦{metrics.lockedEscrowBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Securing {metrics.activePlacementsCount} active monthly trials
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Active Trial Desks</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            {metrics.activePlacementsCount} Placed
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {metrics.totalOffersExtendedCount} offers currently in negotiation
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Accredited Ecosystem</span>
            <Users className="w-4 h-4 text-[#ff7a00]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {metrics.verifiedInternsCount + metrics.accreditedStartupsCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {metrics.verifiedInternsCount} Talents • {metrics.accreditedStartupsCount} Startups
          </span>
        </div>
      </div>

      {/* 2-Column Section: Real-Time Event Audit Stream & Department Portals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Real-Time Platform Event Stream (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-[#512d7c]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Live Placement & Contract Ledger
              </h2>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-3">
            {liveEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                No active placement transactions recorded yet.
              </div>
            ) : (
              liveEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                        {evt.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          evt.type === 'escrow'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : evt.type === 'intern'
                            ? 'bg-purple-50 text-[#512d7c] border border-purple-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {evt.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      <span className="font-bold text-slate-800">{evt.entity}</span> &bull; {evt.detail}
                    </p>
                  </div>

                  <div className="self-end sm:self-center">
                    <Link
                      href="/admin/escrow"
                      className="text-xs font-bold text-[#512d7c] hover:underline inline-flex items-center space-x-1"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rapid Department Portals (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Operational Department Desks
            </h3>

            <div className="space-y-2.5">
              <Link
                href="/admin/interns"
                className="w-full p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Apprentice Registry</span>
                  <span className="text-[10px] text-slate-500">{metrics.verifiedInternsCount} verified NHC IDs</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/startups"
                className="w-full p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Startup Accreditation</span>
                  <span className="text-[10px] text-slate-500">{metrics.accreditedStartupsCount} registered enterprises</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/escrow"
                className="w-full p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Escrow & Disbursals</span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    ₦{metrics.lockedEscrowBalance.toLocaleString()} locked funds
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/affiliates"
                className="w-full p-3 bg-slate-50 hover:bg-purple-50/50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center justify-between transition-all"
              >
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Affiliate Attributions</span>
                  <span className="text-[10px] text-slate-500">Multi-domain tracking</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="bg-[#120324] text-white rounded-3xl p-6 border border-purple-500/30 space-y-3">
            <span className="text-[9px] font-mono uppercase font-bold text-amber-300 block">
              10% Tri-Party Escrow Rule
            </span>
            <p className="text-xs text-white/80 leading-relaxed">
              Every authorized trial holds the intern stipend in verified escrow with an automated 10% platform facilitation cut applied before milestone sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}