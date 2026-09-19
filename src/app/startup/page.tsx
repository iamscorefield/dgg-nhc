'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Clock,
  Wallet,
  FileCheck,
  ChevronRight,
  KanbanSquare,
  LifeBuoy,
  Building,
  CheckCircle2
} from 'lucide-react';

export default function StartupOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeTrials: 0,
    pendingMilestones: 0,
    bookmarkedCount: 0,
    openTickets: 0,
    escrowLocked: 0,
  });

  useEffect(() => {
    async function loadStartupData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const uid = authData.user.id;

      // 1. Placements in trial
      const { count: trialsCount } = await supabase
        .from('placements')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', uid)
        .in('status', ['INVITED', 'TRIAL_ACTIVE']);

      // 2. Bookmarked talent
      const { count: bookmarksCount } = await supabase
        .from('candidate_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', uid);

      // 3. Pending sprint milestones
      const { count: pendingReviews } = await supabase
        .from('sprint_milestones')
        .select('*', { count: 'exact', head: true })
        .eq('review_status', 'PENDING_REVIEW');

      // 4. Open dispute & support tickets
      const { count: ticketCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', uid)
        .in('status', ['OPEN', 'IN_REVIEW']);

      // 5. Escrow balances
      const { data: escrowRows } = await supabase
        .from('startup_payroll_escrow')
        .select('amount, surcharge_fee')
        .eq('startup_id', uid)
        .eq('status', 'HELD_IN_ESCROW');

      const totalEscrow = (escrowRows || []).reduce(
        (acc, curr) => acc + (Number(curr.amount) || 0) + (Number(curr.surcharge_fee) || 0),
        0
      );

      setMetrics({
        activeTrials: trialsCount || 0,
        pendingMilestones: pendingReviews || 0,
        bookmarkedCount: bookmarksCount || 0,
        openTickets: ticketCount || 0,
        escrowLocked: totalEscrow,
      });

      setLoading(false);
    }

    loadStartupData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <span className="animate-pulse font-bold">LOADING ENTERPRISE OVERVIEW...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3d1e63] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
            <Building className="w-3.5 h-3.5" />
            <span>Incubation Management Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Enterprise Talent Desk</h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Monitor zero-risk apprentice trials, inspect weekly sprint deliverables, and manage milestone approvals.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/startup/pipeline"
            className="px-5 py-3 bg-[#f2b42c] hover:bg-[#e0a21f] text-slate-900 font-black text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
          >
            <KanbanSquare className="w-4 h-4" />
            <span>Open Pipeline Board</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Active Runway Trials</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.activeTrials}</div>
          <span className="text-[11px] text-emerald-600 font-bold block">Apprentices in active evaluation</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Pending Sprint Reviews</span>
            <FileCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.pendingMilestones}</div>
          <Link href="/startup/sprints" className="text-[11px] text-[#512d7c] font-bold hover:underline block">
            Inspect weekly submissions ➔
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Shortlisted Talent</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{metrics.bookmarkedCount}</div>
          <span className="text-[11px] text-slate-500 font-medium block">Bookmarked for future cycles</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold">Escrow Funds Reserved</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">₦{metrics.escrowLocked.toLocaleString()}</div>
          <Link href="/startup/escrow" className="text-[11px] text-emerald-600 font-bold hover:underline block">
            View escrow ledger ➔
          </Link>
        </div>
      </div>

      {/* Quick Launchpad Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <KanbanSquare className="w-4 h-4 text-[#512d7c]" />
              <span>Hiring Pipeline Workflow</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400">DRAG & DROP KANBAN</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Move talent from initial bookmark through extended offers, active trial runs, and post-trial retained contracts.
          </p>
          <Link
            href="/startup/pipeline"
            className="w-full py-2.5 bg-slate-100 hover:bg-[#512d7c] hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Manage Candidates</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <LifeBuoy className="w-4 h-4 text-rose-500" />
              <span>Admin Mediation & Dispute Desk</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-rose-600">
              {metrics.openTickets > 0 ? `${metrics.openTickets} ACTION NEEDED` : 'STATUS NORMAL'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Submit milestone disputes or request admin mediation before payroll escrow releases occur.
          </p>
          <Link
            href="/startup/support"
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Open Support & Mediation Desk</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}