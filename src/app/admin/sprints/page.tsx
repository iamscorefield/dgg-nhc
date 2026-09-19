'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  FolderGit2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Check,
  X,
  Building,
  User,
  GitPullRequest
} from 'lucide-react';

interface AdminMilestone {
  id: string;
  placementId: string;
  internName: string;
  nhcId: string;
  companyName: string;
  title: string;
  description: string;
  deliverableUrl: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PENDING';
  createdAt: string;
}

export default function AdminSprintsOversightPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [milestones, setMilestones] = useState<AdminMilestone[]>([]);
  const [selectedMilestone, setSelectedMilestone] = useState<AdminMilestone | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchSprintMilestones = async () => {
    setLoading(true);

    try {
      // 1. Fetch live sprint milestone submissions
      const { data: rawMilestones, error: mError } = await supabase
        .from('sprint_milestones')
        .select('*')
        .order('created_at', { ascending: false });

      if (mError) {
        console.error('Sprint milestones query notice:', mError.message || mError);
        setMilestones([]);
        return;
      }

      const validMilestones = rawMilestones || [];
      const placementIds = Array.from(new Set(validMilestones.map((m: any) => m.placement_id).filter(Boolean)));
      const internIds = Array.from(new Set(validMilestones.map((m: any) => m.intern_id).filter(Boolean)));

      // 2. Fetch corresponding placement and user details in parallel
      const [
        { data: placementsData },
        { data: internProfilesData },
        { data: profilesData }
      ] = await Promise.all([
        placementIds.length > 0
          ? supabase.from('placements').select('id, startup_id').in('id', placementIds)
          : Promise.resolve({ data: [] }),
        internIds.length > 0
          ? supabase.from('intern_profiles').select('id, nhc_id').in('id', internIds)
          : Promise.resolve({ data: [] }),
        internIds.length > 0
          ? supabase.from('profiles').select('id, first_name, last_name').in('id', internIds)
          : Promise.resolve({ data: [] })
      ]);

      const startupIds = Array.from(new Set((placementsData || []).map((p: any) => p.startup_id).filter(Boolean)));

      const { data: startupsData } = startupIds.length > 0
        ? await supabase.from('startup_profiles').select('id, company_name').in('id', startupIds)
        : { data: [] };

      const startupMap = new Map((startupsData || []).map((s: any) => [s.id, s.company_name]));
      const placementStartupMap = new Map((placementsData || []).map((p: any) => [p.id, startupMap.get(p.startup_id) || 'Enterprise Partner']));
      const internMap = new Map((internProfilesData || []).map((i: any) => [i.id, i.nhc_id]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));

      const mapped: AdminMilestone[] = validMilestones.map((m: any) => ({
        id: m.id,
        placementId: m.placement_id,
        internName: profileMap.get(m.intern_id) || 'Apprentice Developer',
        nhcId: internMap.get(m.intern_id) || 'DGG-NHC-2026',
        companyName: placementStartupMap.get(m.placement_id) || 'Enterprise Partner',
        title: m.title || 'Sprint Deliverable',
        description: m.description || 'No submission notes provided.',
        deliverableUrl: m.deliverable_url || '',
        status: m.status || 'SUBMITTED',
        createdAt: new Date(m.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      }));

      setMilestones(mapped);
    } catch (err) {
      console.error('Failed to load sprint milestones ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintMilestones();
  }, []);

  const handleUpdateStatus = async (milestoneId: string, nextStatus: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
      .from('sprint_milestones')
      .update({ status: nextStatus })
      .eq('id', milestoneId);

    if (error) {
      alert(`Milestone update failed: ${error.message}`);
      return;
    }

    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, status: nextStatus } : m))
    );

    if (selectedMilestone && selectedMilestone.id === milestoneId) {
      setSelectedMilestone({ ...selectedMilestone, status: nextStatus });
    }

    setActionNotice(`Milestone successfully marked as ${nextStatus}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredMilestones = milestones.filter((m) => {
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesSearch =
      m.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nhcId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING SPRINT REVIEW TELEMETRY...
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
            <GitPullRequest className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Sprint Execution Registry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Global Sprint Deliverables Oversight
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Direct root access to pull requests, live staging links, and weekly sprint milestones submitted across all accredited enterprise trials.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Total Submissions</span>
            <span className="text-xl font-black font-mono text-amber-200">
              {milestones.length} Sprints
            </span>
          </div>
          <button
            type="button"
            onClick={fetchSprintMilestones}
            title="Refresh Ledger"
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
            placeholder="Search by sprint title, apprentice name, enterprise, or NHC ID..."
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
            <option value="ALL">All Submission States</option>
            <option value="SUBMITTED">Under Supervisor Review</option>
            <option value="APPROVED">Cleared & Approved</option>
            <option value="REJECTED">Revision Requested</option>
          </select>
        </div>
      </div>

      {/* Milestones Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Live Deliverable Review Desk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect code submissions, review staging environments, and execute admin intervention approvals.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredMilestones.length} Deliverables
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">SPRINT MILESTONE</th>
                <th className="pb-3.5">APPRENTICE</th>
                <th className="pb-3.5">ENTERPRISE</th>
                <th className="pb-3.5">ARTIFACT URL</th>
                <th className="pb-3.5">STATUS</th>
                <th className="pb-3.5">SUBMISSION DATE</th>
                <th className="pb-3.5 text-right">ADMIN SIGN-OFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMilestones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No weekly sprint deliverables match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredMilestones.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMilestone(m)}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 font-bold text-slate-900 group-hover:text-[#512d7c]">
                      {m.title}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{m.internName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.nhcId}</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-700">
                      {m.companyName}
                    </td>
                    <td className="py-4 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                      {m.deliverableUrl ? (
                        <Link
                          href={m.deliverableUrl}
                          target="_blank"
                          className="text-[#512d7c] font-bold hover:underline inline-flex items-center space-x-1"
                        >
                          <span className="max-w-[140px] truncate">{m.deliverableUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 italic">None attached</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          m.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : m.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {m.status === 'SUBMITTED' && <Clock className="w-3 h-3 text-blue-600" />}
                        {m.status === 'REJECTED' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        <span>{m.status}</span>
                      </span>
                    </td>
                    <td className="py-4 font-mono text-slate-600">
                      {m.createdAt}
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          disabled={m.status === 'APPROVED'}
                          onClick={() => handleUpdateStatus(m.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer disabled:opacity-40"
                          title="Force Approve Milestone"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={m.status === 'REJECTED'}
                          onClick={() => handleUpdateStatus(m.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer disabled:opacity-40"
                          title="Reject for Revision"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deliverable Inspection Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Sprint Deliverable Forensic Inspector
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedMilestone.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Apprentice Candidate:</span>
                <span className="font-bold text-slate-900">{selectedMilestone.internName} ({selectedMilestone.nhcId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enterprise Partner:</span>
                <span className="font-bold text-slate-900">{selectedMilestone.companyName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Deliverable Link:</span>
                <Link
                  href={selectedMilestone.deliverableUrl}
                  target="_blank"
                  className="font-mono font-bold text-[#512d7c] hover:underline inline-flex items-center space-x-1"
                >
                  <span className="max-w-[200px] truncate">{selectedMilestone.deliverableUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </Link>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Apprentice Summary & Context Notes</span>
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans">
                {selectedMilestone.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedMilestone.id, 'APPROVED')}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Force Approve Milestone
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedMilestone.id, 'REJECTED')}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Return for Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}