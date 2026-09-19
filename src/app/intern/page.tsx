'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Globe,
  Wallet,
  Briefcase,
  TrendingUp,
  MousePointerClick,
  Users2,
  CheckCircle2,
  Share2,
  FolderGit2,
  Clock,
  RefreshCw,
  Layers
} from 'lucide-react';

interface ActivePlacementCard {
  id: string;
  companyName: string;
  roleTitle: string;
  stipend: number;
  stage: string;
  status: string;
}

export default function InternDashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    firstName: 'Apprentice',
    lastName: '',
    nhcId: 'DGG-NHC-2026',
    track: 'Engineering Track',
    institution: 'Campus Partner',
    verifiedCertId: null as string | null,
    subdomain: 'apprentice',
  });

  const [metrics, setMetrics] = useState({
    activeEscrowStipend: 0,
    affiliateApproved: 0,
    affiliatePending: 0,
    conversionsCount: 0,
    submittedMilestonesCount: 0,
  });

  const [activePlacements, setActivePlacements] = useState<ActivePlacementCard[]>([]);

  const loadData = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      router.push('/');
      return;
    }

    const userId = authData.user.id;

    try {
      const [
        { data: profile },
        { data: intern },
        { data: placementsData },
        { data: milestonesData },
        { data: referralsData },
        { data: transactionsData }
      ] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name').eq('id', userId).maybeSingle(),
        supabase.from('intern_profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('placements').select('id, startup_id, role_title, pre_agreed_stipend, status, pipeline_stage').eq('intern_id', userId),
        supabase.from('sprint_milestones').select('id, status').eq('intern_id', userId),
        supabase.from('referral_transactions').select('amount, status').eq('intern_id', userId),
        // Fetch financial transactions/disbursements to verify realized escrow funds
        supabase.from('financial_transactions').select('amount_naira, status, transaction_type').eq('startup_id', userId)
      ]);

      if (profile) {
        setUserData({
          firstName: profile.first_name || 'Apprentice',
          lastName: profile.last_name || '',
          nhcId: intern?.nhc_id || 'DGG-NHC-2026',
          track: intern?.specialization_track || 'Full Stack Systems',
          institution: intern?.institution || 'Campus Partner',
          verifiedCertId: intern?.verified_cert_id || null,
          subdomain: intern?.subdomain_handle || 'apprentice',
        });
      }

      const startupIds = Array.from(new Set((placementsData || []).map((p: any) => p.startup_id).filter(Boolean)));
      let startupMap = new Map<string, string>();

      if (startupIds.length > 0) {
        const { data: startups } = await supabase
          .from('startup_profiles')
          .select('id, company_name')
          .in('id', startupIds);

        (startups || []).forEach((s: any) => {
          startupMap.set(s.id, s.company_name);
        });
      }

      // Calculate realized escrow funds from approved milestone releases or escrow funding transactions
      let realizedEscrowStipend = 0;
      (transactionsData || []).forEach((tx: any) => {
        if (tx.status === 'approved' && (tx.transaction_type === 'milestone_release' || tx.transaction_type === 'trial_stipend')) {
          realizedEscrowStipend += Number(tx.amount_naira) || 0;
        }
      });

      const formattedPlacements: ActivePlacementCard[] = (placementsData || []).map((p: any) => {
        const stipendNum = Number(p.pre_agreed_stipend) || 0;
        let stageLabel = p.pipeline_stage || 'INQUIRY';
        if (stageLabel === 'INVITED') stageLabel = 'OFFER EXTENDED';
        if (stageLabel === 'IN_TRIAL' || p.status === 'ACTIVE') stageLabel = 'ACTIVE TRIAL';
        if (stageLabel === 'RETAINED') stageLabel = 'CONTRACTED';

        return {
          id: p.id,
          companyName: startupMap.get(p.startup_id) || 'Enterprise Partner',
          roleTitle: p.role_title || 'Specialist Associate',
          stipend: stipendNum,
          stage: stageLabel,
          status: p.status,
        };
      });

      setActivePlacements(formattedPlacements);

      let affiliateApproved = 0;
      let affiliatePending = 0;

      (referralsData || []).forEach((r: any) => {
        const amt = Number(r.amount) || 0;
        if (r.status === 'APPROVED' || r.status === 'PAID') {
          affiliateApproved += amt;
        } else {
          affiliatePending += amt;
        }
      });

      setMetrics({
        activeEscrowStipend: realizedEscrowStipend,
        affiliateApproved,
        affiliatePending,
        conversionsCount: referralsData?.length || 0,
        submittedMilestonesCount: milestonesData?.length || 0,
      });

    } catch (err) {
      console.error('Failed to load apprentice dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          INITIALIZING APPRENTICE OPERATIONS DESK...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Verified Apprenticeship Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {userData.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Specialization: <span className="font-semibold text-white">{userData.track}</span> &bull; Campus: <span className="font-semibold text-white">{userData.institution}</span> &bull; NHC Pass: <span className="font-mono text-amber-200 font-bold">{userData.nhcId}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Escrow Stipend</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              ₦{metrics.activeEscrowStipend.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Affiliate Wallet</span>
            <span className="text-xl font-black font-mono text-[#f2b42c]">
              ₦{metrics.affiliateApproved.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={loadData}
            title="Refresh Overview"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/intern/incubation/pipeline"
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#512d7c] flex items-center justify-center group-hover:bg-[#512d7c] group-hover:text-white transition-colors">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#512d7c]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Active Sprint Runway</span>
            <h3 className="text-sm font-black text-slate-900">Sprint Delivery Desk</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">{metrics.submittedMilestonesCount} sprint deliverables pushed.</p>
          </div>
        </Link>

        <Link
          href={`/portfolio/${userData.subdomain}`}
          target="_blank"
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#ff7a00] flex items-center justify-center group-hover:bg-[#ff7a00] group-hover:text-white transition-colors">
              <Globe className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#ff7a00]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Personal Dossier</span>
            <h3 className="text-sm font-black text-slate-900">Live Web Subdomain</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">/portfolio/{userData.subdomain}</p>
          </div>
        </Link>

        <Link
          href="/intern/incubation/startup"
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Briefcase className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Enterprise Placement</span>
            <h3 className="text-sm font-black text-slate-900">Offers & Contracts</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Inspect incoming tripartite terms.</p>
          </div>
        </Link>

        <Link
          href="/intern/affiliate/wallet"
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#512d7c] flex items-center justify-center group-hover:bg-[#512d7c] group-hover:text-white transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#512d7c]" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Disbursements</span>
            <h3 className="text-sm font-black text-slate-900">Payout Wallet</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Manage bank details & claims.</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-5 h-5 text-[#512d7c]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Affiliate Traffic & Conversion Pulse
              </h2>
            </div>
            {userData.verifiedCertId ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Verified Hash: {userData.verifiedCertId}</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Pending LMS Audit
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <MousePointerClick className="w-3.5 h-3.5 text-[#512d7c]" />
                <span className="text-[10px] font-mono uppercase font-bold">Conversions</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">{metrics.conversionsCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold">Database Verified</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-mono uppercase font-bold">Pending Review</span>
              </div>
              <div className="text-xl font-black font-mono text-amber-600">₦{metrics.affiliatePending.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">In Clearing</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-mono uppercase font-bold">Paid Out</span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600">₦{metrics.affiliateApproved.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-medium">Bank Settled</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#512d7c]" />
                <span>Monetize While Building Sprints</span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Share verified affiliate deep-links across your network to receive direct commissions into your student wallet.
              </p>
            </div>
            <Link
              href="/intern/affiliate/deep-links"
              className="px-3.5 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shrink-0 transition-all shadow-sm"
            >
              Get Links ➔
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-[#ff7a00]" />
                <h2 className="text-base font-extrabold text-slate-900">Direct Enterprise Desk</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                {activePlacements.length} Live Positions
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {activePlacements.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="text-xs font-bold text-slate-700">No Enterprise Inquiries Active</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Startups reviewing your public portfolio will extend zero-risk trial offers here.
                  </p>
                </div>
              ) : (
                activePlacements.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        item.stage === 'ACTIVE TRIAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.stage}
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        ₦{item.stipend.toLocaleString()} / mo
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.companyName}</h4>
                      <p className="text-[11px] text-[#512d7c] font-medium">{item.roleTitle}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link
              href="/intern/incubation/pipeline"
              className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Open Sprint Runway Pipeline ➔</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}