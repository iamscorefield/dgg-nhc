'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Building,
  User,
  Gavel,
  Check,
  X,
  FileText
} from 'lucide-react';

interface DisputeCase {
  id: string;
  placementId: string;
  milestoneId?: string;
  internId: string;
  internName: string;
  nhcId: string;
  startupName: string;
  roleTitle: string;
  disputedAmount: number;
  reason: string;
  status: 'OPEN' | 'RESOLVED_INTERN' | 'RESOLVED_STARTUP';
  createdAt: string;
  evidenceUrl?: string;
}

export default function AdminDisputesArbitrationPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<DisputeCase | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);

    try {
      // 1. Fetch placements and milestones flagged with disputes or rejections
      const [
        { data: disputedPlacements, error: plErr },
        { data: rejectedMilestones, error: mErr }
      ] = await Promise.all([
        supabase
          .from('placements')
          .select('*')
          .or('status.eq.DISPUTED,pipeline_stage.eq.DISPUTED')
          .order('created_at', { ascending: false }),
        supabase
          .from('sprint_milestones')
          .select('*')
          .eq('status', 'REJECTED')
          .order('created_at', { ascending: false })
      ]);

      if (plErr) console.error('Placements query notice:', plErr.message || plErr);
      if (mErr) console.error('Milestones query notice:', mErr.message || mErr);

      const validPlacements = disputedPlacements || [];
      const validMilestones = rejectedMilestones || [];

      // Extract IDs for bulk lookups
      const allInternIds = Array.from(new Set([
        ...validPlacements.map((p: any) => p.intern_id),
        ...validMilestones.map((m: any) => m.intern_id)
      ].filter(Boolean)));

      const allPlacementIds = Array.from(new Set([
        ...validPlacements.map((p: any) => p.id),
        ...validMilestones.map((m: any) => m.placement_id)
      ].filter(Boolean)));

      // 2. Fetch supporting placement context if milestones had placements not already fetched
      const { data: milestonePlacements } = allPlacementIds.length > 0
        ? await supabase.from('placements').select('*').in('id', allPlacementIds)
        : { data: [] };

      const compiledPlacements = [...validPlacements, ...(milestonePlacements || [])];
      const allStartupIds = Array.from(new Set(compiledPlacements.map((p: any) => p.startup_id).filter(Boolean)));

      // 3. Parallel fetch of startup names, intern NHC IDs, and user profiles
      const [
        { data: startupsData },
        { data: internProfilesData },
        { data: profilesData }
      ] = await Promise.all([
        allStartupIds.length > 0
          ? supabase.from('startup_profiles').select('id, company_name').in('id', allStartupIds)
          : Promise.resolve({ data: [] }),
        allInternIds.length > 0
          ? supabase.from('intern_profiles').select('id, nhc_id').in('id', allInternIds)
          : Promise.resolve({ data: [] }),
        allInternIds.length > 0
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', allInternIds)
          : Promise.resolve({ data: [] })
      ]);

      const startupMap = new Map((startupsData || []).map((s: any) => [s.id, s.company_name]));
      const internMap = new Map((internProfilesData || []).map((i: any) => [i.id, i.nhc_id]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));
      const placementMap = new Map(compiledPlacements.map((p: any) => [p.id, p]));

      const mappedCases: DisputeCase[] = [];

      // Add direct placement disputes
      validPlacements.forEach((p: any) => {
        mappedCases.push({
          id: `DSP-${p.id.substring(0, 6).toUpperCase()}`,
          placementId: p.id,
          internId: p.intern_id,
          internName: profileMap.get(p.intern_id) || 'Apprentice Developer',
          nhcId: internMap.get(p.intern_id) || 'DGG-NHC-2026',
          startupName: startupMap.get(p.startup_id) || 'Enterprise Partner',
          roleTitle: p.role_title || 'Apprentice Specialist',
          disputedAmount: Number(p.pre_agreed_stipend) || 0,
          reason: 'Escrow release contested or non-responsive engagement during active runway.',
          status: 'OPEN',
          createdAt: new Date(p.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
      });

      // Add rejected milestones needing arbitration
      validMilestones.forEach((m: any) => {
        const placement = placementMap.get(m.placement_id);
        mappedCases.push({
          id: `DSP-ML-${m.id.substring(0, 6).toUpperCase()}`,
          placementId: m.placement_id,
          milestoneId: m.id,
          internId: m.intern_id,
          internName: profileMap.get(m.intern_id) || 'Apprentice Developer',
          nhcId: internMap.get(m.intern_id) || 'DGG-NHC-2026',
          startupName: placement ? startupMap.get(placement.startup_id) || 'Enterprise Partner' : 'Enterprise Partner',
          roleTitle: placement?.role_title || 'Weekly Sprint Milestone',
          disputedAmount: placement ? Number(placement.pre_agreed_stipend) || 0 : 0,
          reason: `Milestone "${m.title}" rejected by supervisor. Apprentice requested arbitration on code quality.`,
          status: 'OPEN',
          createdAt: new Date(m.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          evidenceUrl: m.deliverable_url || '',
        });
      });

      setCases(mappedCases);
    } catch (err) {
      console.error('Failed to load disputes ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleArbitrate = async (dispute: DisputeCase, resolution: 'INTERN' | 'STARTUP') => {
    if (resolution === 'INTERN') {
      // Clear milestone if attached
      if (dispute.milestoneId) {
        await supabase
          .from('sprint_milestones')
          .update({ status: 'APPROVED' })
          .eq('id', dispute.milestoneId);
      }

      // Ensure placement remains active
      await supabase
        .from('placements')
        .update({ status: 'ACTIVE', pipeline_stage: 'IN_TRIAL' })
        .eq('id', dispute.placementId);

      setCases((prev) =>
        prev.map((c) => (c.id === dispute.id ? { ...c, status: 'RESOLVED_INTERN' } : c))
      );
      setActionNotice(`Adjudicated in favor of Apprentice. Deliverable marked approved and escrow runway retained.`);
    } else {
      // Terminate/Refund placement
      await supabase
        .from('placements')
        .update({ status: 'CANCELLED' })
        .eq('id', dispute.placementId);

      setCases((prev) =>
        prev.map((c) => (c.id === dispute.id ? { ...c, status: 'RESOLVED_STARTUP' } : c))
      );
      setActionNotice(`Adjudicated in favor of Startup. Trial placement terminated and escrow refund released.`);
    }

    if (selectedCase && selectedCase.id === dispute.id) {
      setSelectedCase({
        ...selectedCase,
        status: resolution === 'INTERN' ? 'RESOLVED_INTERN' : 'RESOLVED_STARTUP',
      });
    }

    setTimeout(() => setActionNotice(null), 3500);
  };

  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesSearch =
      c.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nhcId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING DISPUTE ARBITRATION TELEMETRY...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f041d] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Gavel className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Judicial Clearance & Mediation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Apprenticeship Disputes & Arbitration Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Adjudicate contested weekly deliverables, mediate non-responsive trial terms, and enforce fair tripartite escrow settlements.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Contested Cases</span>
            <span className="text-xl font-black font-mono text-amber-200">
              {cases.filter((c) => c.status === 'OPEN').length} Active
            </span>
          </div>
          <button
            type="button"
            onClick={fetchDisputes}
            title="Refresh Cases"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case ID, intern name, startup, or role..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Case Statuses</option>
            <option value="OPEN">Open & Pending Ruling</option>
            <option value="RESOLVED_INTERN">Resolved (Intern Favored)</option>
            <option value="RESOLVED_STARTUP">Resolved (Startup Refunded)</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Contested Placements & Deliverable Docket
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review filed claims, examine repository pull requests, and deliver final arbitration judgments.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredCases.length} Disputed Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">CASE ID</th>
                <th className="pb-3.5">APPRENTICE</th>
                <th className="pb-3.5">ENTERPRISE</th>
                <th className="pb-3.5">STIPEND ESCROW</th>
                <th className="pb-3.5">DISPUTE REASON</th>
                <th className="pb-3.5">STATE</th>
                <th className="pb-3.5 text-right">ARBITRATION ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Zero disputes logged. All tripartite placements are progressing harmoniously.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
                      {c.id}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{c.internName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{c.nhcId}</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-700">
                      {c.startupName}
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-700">
                      ₦{c.disputedAmount.toLocaleString()}
                    </td>
                    <td className="py-4 text-slate-600 max-w-xs truncate">
                      {c.reason}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          c.status === 'OPEN'
                            ? 'bg-rose-100 text-rose-800'
                            : c.status === 'RESOLVED_INTERN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {c.status === 'OPEN' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {c.status === 'RESOLVED_INTERN' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {c.status === 'RESOLVED_STARTUP' && <Clock className="w-3 h-3 text-purple-600" />}
                        <span>{c.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {c.status === 'OPEN' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleArbitrate(c, 'INTERN')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                            title="Rule for Apprentice (Disburse Escrow)"
                          >
                            Approve Work
                          </button>
                          <button
                            type="button"
                            onClick={() => handleArbitrate(c, 'STARTUP')}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                            title="Rule for Enterprise (Refund Escrow)"
                          >
                            Refund Enterprise
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Adjudicated</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arbitration Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Judicial Docket Forensic Review
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedCase.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary Intern:</span>
                <span className="font-bold text-slate-900">{selectedCase.internName} ({selectedCase.nhcId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enterprise Party:</span>
                <span className="font-bold text-slate-900">{selectedCase.startupName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Committed Stipend at Risk:</span>
                <span className="font-mono font-bold text-emerald-700">₦{selectedCase.disputedAmount.toLocaleString()}</span>
              </div>
              {selectedCase.evidenceUrl && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Deliverable PR Evidence:</span>
                  <Link
                    href={selectedCase.evidenceUrl}
                    target="_blank"
                    className="font-mono font-bold text-[#512d7c] hover:underline inline-flex items-center space-x-1"
                  >
                    <span>View Artifact</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Contested Claims & Cause</span>
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans">
                {selectedCase.reason}
              </p>
            </div>

            {selectedCase.status === 'OPEN' ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleArbitrate(selectedCase, 'INTERN')}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Rule for Intern (Clear PR)
                </button>
                <button
                  type="button"
                  onClick={() => handleArbitrate(selectedCase, 'STARTUP')}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Rule for Startup (Refund)
                </button>
              </div>
            ) : (
              <div className="p-3 text-center bg-slate-100 rounded-xl text-slate-500 font-mono text-xs">
                Case marked as {selectedCase.status}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}