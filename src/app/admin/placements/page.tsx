'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  RefreshCw,
  FolderGit2,
  Check,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';

interface AdminPlacement {
  id: string;
  roleTitle: string;
  companyName: string;
  internName: string;
  nhcId: string;
  stipend: number;
  internTier: string;
  contractTerm: string;
  pipelineStage: string;
  status: string;
  createdAt: string;
}

export default function AdminPlacementsDeskPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [placements, setPlacements] = useState<AdminPlacement[]>([]);
  const [selectedPlacement, setSelectedPlacement] = useState<AdminPlacement | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchPlacements = async () => {
    setLoading(true);

    try {
      const { data: rawPlacements, error: plError } = await supabase
        .from('placements')
        .select('*')
        .order('created_at', { ascending: false });

      if (plError) {
        console.error('Placements query notice:', plError.message || plError);
        setPlacements([]);
        return;
      }

      const validPlacements = rawPlacements || [];
      const startupIds = Array.from(new Set(validPlacements.map((p: any) => p.startup_id).filter(Boolean)));
      const internIds = Array.from(new Set(validPlacements.map((p: any) => p.intern_id).filter(Boolean)));

      const [
        { data: startupsData },
        { data: internProfilesData },
        { data: profilesData }
      ] = await Promise.all([
        startupIds.length > 0
          ? supabase.from('startup_profiles').select('id, company_name').in('id', startupIds)
          : Promise.resolve({ data: [] }),
        internIds.length > 0
          ? supabase.from('intern_profiles').select('id, nhc_id').in('id', internIds)
          : Promise.resolve({ data: [] }),
        internIds.length > 0
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', internIds)
          : Promise.resolve({ data: [] })
      ]);

      const startupMap = new Map((startupsData || []).map((s: any) => [s.id, s.company_name]));
      const internMap = new Map((internProfilesData || []).map((i: any) => [i.id, i.nhc_id]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));

      const mapped: AdminPlacement[] = validPlacements.map((p: any) => {
        let stage = p.pipeline_stage;
        if (!stage || stage === 'BOOKMARKED') stage = 'SHORTLISTED';
        if (stage === 'INVITED') stage = 'OFFER_EXTENDED';
        if (stage === 'TRIAL_ACTIVE' || p.status === 'ACTIVE') stage = 'IN_TRIAL';
        if (stage === 'HIRED_CONTRACTED' || p.status === 'COMPLETED') stage = 'RETAINED';

        return {
          id: p.id,
          roleTitle: p.role_title || 'Specialist Associate',
          companyName: p.is_direct_admin_placement
            ? 'D-Global Growthfield Operations'
            : startupMap.get(p.startup_id) || 'Enterprise Partner',
          internName: profileMap.get(p.intern_id) || 'Apprentice Candidate',
          nhcId: internMap.get(p.intern_id) || 'DGG-NHC-2026',
          stipend: Number(p.pre_agreed_stipend) || 150000,
          internTier: p.intern_tier || 'Associate (2-month trial)',
          contractTerm: p.contract_term || '1_YEAR',
          pipelineStage: stage,
          status: p.status || 'INVITED',
          createdAt: new Date(p.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      });

      setPlacements(mapped);
    } catch (err) {
      console.error('Failed to load placements desk:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleForceAdvance = async (placementId: string, nextStage: string, nextStatus: string) => {
    const { error } = await supabase
      .from('placements')
      .update({
        pipeline_stage: nextStage,
        status: nextStatus,
      })
      .eq('id', placementId);

    if (error) {
      alert(`Update failed: ${error.message}`);
      return;
    }

    setPlacements((prev) =>
      prev.map((p) => (p.id === placementId ? { ...p, pipelineStage: nextStage, status: nextStatus } : p))
    );

    if (selectedPlacement && selectedPlacement.id === placementId) {
      setSelectedPlacement({ ...selectedPlacement, pipelineStage: nextStage, status: nextStatus });
    }

    setActionNotice(`Placement manually advanced to ${nextStage}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredPlacements = placements.filter((p) => {
    const matchesStage = stageFilter === 'ALL' || p.pipelineStage === stageFilter;
    const matchesSearch =
      p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nhcId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING PLACEMENTS DESK...
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
            <Briefcase className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Tripartite Contract Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Global Placement Pipeline Oversight
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Monitor and govern every apprenticeship contract from first enterprise shortlist to final retained employment.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Total Placements</span>
            <span className="text-xl font-black font-mono text-amber-200">
              {placements.length} Contracts
            </span>
          </div>
          <button
            type="button"
            onClick={fetchPlacements}
            title="Refresh Desk"
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
            placeholder="Search by company, intern name, NHC ID, or role..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="SHORTLISTED">Shortlisted Talent</option>
            <option value="OFFER_EXTENDED">Offers Extended</option>
            <option value="IN_TRIAL">In Active Trial</option>
            <option value="RETAINED">Retained & Contracted</option>
          </select>
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Active Tripartite Handshakes Master Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any placement to inspect the contract breakdown or manually override stage transitions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredPlacements.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">ENTERPRISE</th>
                <th className="pb-3.5">APPRENTICE</th>
                <th className="pb-3.5">ROLE TITLE</th>
                <th className="pb-3.5">MONTHLY ESCROW</th>
                <th className="pb-3.5">PIPELINE STAGE</th>
                <th className="pb-3.5">CONTRACT TERM</th>
                <th className="pb-3.5 text-right">ADMIN OVERRIDE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlacements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No placement contracts match the selected query.
                  </td>
                </tr>
              ) : (
                filteredPlacements.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPlacement(p)}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 font-bold text-slate-900">
                      {p.companyName}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{p.internName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{p.nhcId}</span>
                    </td>
                    <td className="py-4 font-semibold text-[#512d7c]">
                      {p.roleTitle}
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-700">
                      ₦{p.stipend.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          p.pipelineStage === 'IN_TRIAL'
                            ? 'bg-purple-100 text-purple-800'
                            : p.pipelineStage === 'RETAINED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.pipelineStage === 'OFFER_EXTENDED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.pipelineStage}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-slate-600">
                      {p.contractTerm.replace('_', ' ')}
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {p.pipelineStage === 'OFFER_EXTENDED' ? (
                        <button
                          type="button"
                          onClick={() => handleForceAdvance(p.id, 'IN_TRIAL', 'ACTIVE')}
                          className="px-3 py-1 bg-[#512d7c] hover:bg-[#3d205e] text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                        >
                          Authorize Trial
                        </button>
                      ) : p.pipelineStage === 'IN_TRIAL' ? (
                        <button
                          type="button"
                          onClick={() => handleForceAdvance(p.id, 'RETAINED', 'COMPLETED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                        >
                          Disburse & Retain
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPlacement && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Tripartite Placement Inspector
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedPlacement.roleTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlacement(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Enterprise:</span>
                <span className="font-bold text-slate-900">{selectedPlacement.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Apprentice Candidate:</span>
                <span className="font-bold text-slate-900">{selectedPlacement.internName} ({selectedPlacement.nhcId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trial Runway:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPlacement.internTier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agreed Post-Trial Term:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPlacement.contractTerm.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Pre-Agreed Monthly Stipend:</span>
                <span className="font-mono font-bold text-emerald-700">₦{selectedPlacement.stipend.toLocaleString()} / mo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleForceAdvance(selectedPlacement.id, 'IN_TRIAL', 'ACTIVE')}
                className="py-2.5 bg-[#512d7c] hover:bg-[#3d205e] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Force Move to Active Trial
              </button>
              <button
                type="button"
                onClick={() => handleForceAdvance(selectedPlacement.id, 'RETAINED', 'COMPLETED')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Force Complete & Retain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}