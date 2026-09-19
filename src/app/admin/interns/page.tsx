'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  Lock,
  Globe,
  Award,
  CalendarCheck,
  Save,
  Loader2,
  Briefcase
} from 'lucide-react';

interface ApprenticeRecord {
  id: string;
  nhcId: string;
  name: string;
  email: string;
  track: string;
  institution: string;
  subdomain: string;
  certHash: string | null;
  tier: string;
  status: 'Verified LMS' | 'Pending Audit' | 'Suspended';
  enrolledDate: string;
  sprintAttendance: string;
  activePlacement?: {
    companyName: string;
    pipelineStage: string;
    stipend: number;
  } | null;
}

export default function AdminInternsVaultPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedIntern, setSelectedIntern] = useState<ApprenticeRecord | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [updatingTier, setUpdatingTier] = useState(false);

  // Manual Attendance Score Input State
  const [customAttendanceInput, setCustomAttendanceInput] = useState('');
  const [updatingAttendance, setUpdatingAttendance] = useState(false);

  const [apprentices, setApprentices] = useState<ApprenticeRecord[]>([]);

  const fetchAllInterns = async () => {
    setLoading(true);

    try {
      // 1. Fetch intern profiles directly
      const { data: dbInterns, error: internError } = await supabase
        .from('intern_profiles')
        .select(`
          id,
          nhc_id,
          specialization_track,
          institution,
          verified_cert_id,
          subdomain_handle,
          tier,
          sprint_attendance_score,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (internError) {
        console.error('Error querying intern registry:', internError.message || internError);
        setApprentices([]);
        return;
      }

      if (!dbInterns || dbInterns.length === 0) {
        setApprentices([]);
        return;
      }

      const internIds = dbInterns.map((i) => i.id);

      // 2. Fetch corresponding profiles and placements in parallel
      const [{ data: userProfiles }, { data: placementsData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', internIds),
        supabase
          .from('placements')
          .select('intern_id, pipeline_stage, status, pre_agreed_stipend, startup_id')
      ]);

      // 3. Resolve startup names for active placements
      const startupIds = (placementsData || []).map((p) => p.startup_id).filter(Boolean);
      let startupMap: Record<string, string> = {};

      if (startupIds.length > 0) {
        const { data: startups } = await supabase
          .from('startup_profiles')
          .select('id, company_name')
          .in('id', startupIds);

        (startups || []).forEach((s) => {
          startupMap[s.id] = s.company_name;
        });
      }

      const mapped: ApprenticeRecord[] = dbInterns.map((i: any) => {
        const profile = (userProfiles || []).find((p) => p.id === i.id);
        const placement = (placementsData || []).find((p) => p.intern_id === i.id);

        const activePlacement = placement
          ? {
              companyName: startupMap[placement.startup_id] || 'Enterprise Partner',
              pipelineStage: placement.pipeline_stage || placement.status,
              stipend: Number(placement.pre_agreed_stipend) || 0,
            }
          : null;

        return {
          id: i.id,
          nhcId: i.nhc_id || 'DGG-NHC-2026-UNASSIGNED',
          name: `${profile?.first_name || 'Apprentice'} ${profile?.last_name || ''}`.trim(),
          email: profile?.email || 'unregistered@nexus.hub',
          track: i.specialization_track || 'Specialist Track',
          institution: i.institution || 'Academic Partner Campus',
          subdomain: i.subdomain_handle || 'apprentice',
          certHash: i.verified_cert_id || null,
          tier: i.tier || 'Associate (Intermediate: 2-month trial)',
          status: i.verified_cert_id ? 'Verified LMS' : 'Pending Audit',
          sprintAttendance: i.sprint_attendance_score || '100%',
          enrolledDate: i.created_at
            ? new Date(i.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '2026',
          activePlacement,
        };
      });

      setApprentices(mapped);
    } catch (err) {
      console.error('Failed to load apprentice vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInterns();
  }, []);

  // Sync attendance input value whenever an intern card opens
  useEffect(() => {
    if (selectedIntern) {
      setCustomAttendanceInput(selectedIntern.sprintAttendance.replace('%', ''));
    }
  }, [selectedIntern]);

  const handleRegenerateNhcId = async (internId: string) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `DGG-NHC-2026-${randomSuffix}`;

    const { error } = await supabase
      .from('intern_profiles')
      .update({ nhc_id: newId })
      .eq('id', internId);

    if (error) {
      alert(`Failed to update NHC ID: ${error.message}`);
      return;
    }

    setApprentices((prev) =>
      prev.map((i) => (i.id === internId ? { ...i, nhcId: newId } : i))
    );

    if (selectedIntern && selectedIntern.id === internId) {
      setSelectedIntern({ ...selectedIntern, nhcId: newId });
    }

    setActionNotice(`Regenerated NHC ID: ${newId}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleToggleVerification = async (internId: string) => {
    const target = apprentices.find((i) => i.id === internId);
    const isNowVerified = target?.status !== 'Verified LMS';
    const newCertHash = isNowVerified ? `DGG-TN-${Date.now().toString().slice(-8)}` : null;

    const { error } = await supabase
      .from('intern_profiles')
      .update({ verified_cert_id: newCertHash })
      .eq('id', internId);

    if (error) {
      alert(`Accreditation update failed: ${error.message}`);
      return;
    }

    setApprentices((prev) =>
      prev.map((i) =>
        i.id === internId
          ? {
              ...i,
              status: isNowVerified ? 'Verified LMS' : 'Pending Audit',
              certHash: newCertHash,
            }
          : i
      )
    );

    if (selectedIntern && selectedIntern.id === internId) {
      setSelectedIntern({
        ...selectedIntern,
        status: isNowVerified ? 'Verified LMS' : 'Pending Audit',
        certHash: newCertHash,
      });
    }

    setActionNotice(`Updated accreditation status for ${target?.name}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleUpdateTier = async (internId: string, newTier: string) => {
    setUpdatingTier(true);
    const { error } = await supabase
      .from('intern_profiles')
      .update({ tier: newTier })
      .eq('id', internId);

    setUpdatingTier(false);

    if (error) {
      alert(`Failed to update tier: ${error.message}`);
      return;
    }

    setApprentices((prev) =>
      prev.map((i) => (i.id === internId ? { ...i, tier: newTier } : i))
    );

    if (selectedIntern && selectedIntern.id === internId) {
      setSelectedIntern({ ...selectedIntern, tier: newTier });
    }

    setActionNotice(`Updated candidate tier to "${newTier}"`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSaveCustomAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntern || !customAttendanceInput.trim()) return;

    setUpdatingAttendance(true);
    const rawVal = customAttendanceInput.replace('%', '').trim();
    const formattedScore = `${rawVal}%`;

    const { error } = await supabase
      .from('intern_profiles')
      .update({ sprint_attendance_score: formattedScore })
      .eq('id', selectedIntern.id);

    setUpdatingAttendance(false);

    if (error) {
      alert(`Failed to save attendance score: ${error.message}`);
      return;
    }

    setApprentices((prev) =>
      prev.map((i) => (i.id === selectedIntern.id ? { ...i, sprintAttendance: formattedScore } : i))
    );

    setSelectedIntern({ ...selectedIntern, sprintAttendance: formattedScore });
    setActionNotice(`Updated sprint attendance score to "${formattedScore}"`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredApprentices = apprentices.filter((a) => {
    const matchesTrack =
      trackFilter === 'ALL' || a.track.toLowerCase().includes(trackFilter.toLowerCase());
    const matchesTier =
      tierFilter === 'ALL' || a.tier === tierFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nhcId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.certHash && a.certHash.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTrack && matchesTier && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING APPRENTICE CREDENTIAL REGISTRY...
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
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Identity & Credential Clearing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Apprentice Vault & NHC Credential Registry
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Direct root control over tamper-proof student passes, LMS certificate hashes, candidate incubation tiers, and subdomain resolution.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Verified Passes</span>
            <span className="text-xl font-black font-mono text-amber-200">
              {apprentices.length} Candidates
            </span>
          </div>
          <button
            type="button"
            onClick={fetchAllInterns}
            title="Refresh Vault"
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

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by NHC ID, apprentice name, email, cert hash, or campus..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Tracks</option>
            <option value="Full Stack">Full Stack Development</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Growth Marketing & SEO</option>
            <option value="Design">UI/UX Design</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Incubation Tiers</option>
            <option value="Fellow (Pro: 1-month fast-track)">Fellow (1-Mo Trial)</option>
            <option value="Associate (Intermediate: 2-month trial)">Associate (2-Mo Trial)</option>
            <option value="Apprentice (Newbie: 3-month trial)">Apprentice (3-Mo Trial)</option>
          </select>
        </div>
      </div>

      {/* Primary Apprentice Registry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Verified Apprentice Identity Master Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any candidate row to trigger the Pass Inspector and adjust evaluated incubation tiers.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredApprentices.length} Matches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">NHC ID</th>
                <th className="pb-3.5">APPRENTICE NAME</th>
                <th className="pb-3.5">TRACK & CAMPUS</th>
                <th className="pb-3.5">INCUBATION TIER</th>
                <th className="pb-3.5">ATTENDANCE</th>
                <th className="pb-3.5">PLACEMENT STATE</th>
                <th className="pb-3.5">ACCREDITATION</th>
                <th className="pb-3.5 text-right">ADMIN ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApprentices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No verified apprentices match the selected query.
                  </td>
                </tr>
              ) : (
                filteredApprentices.map((intern) => (
                  <tr
                    key={intern.id}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedIntern(intern)}
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
                      {intern.nhcId}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{intern.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{intern.email}</span>
                    </td>
                    <td className="py-4">
                      <span className="font-semibold text-slate-700 block">{intern.track}</span>
                      <span className="text-[10px] text-slate-400">{intern.institution}</span>
                    </td>
                    <td className="py-4">
                      <span
                        className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border inline-block ${
                          intern.tier.includes('Fellow')
                            ? 'bg-purple-50 text-[#512d7c] border-purple-200'
                            : intern.tier.includes('Associate')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {intern.tier.split('(')[0].trim()}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-black text-xs inline-block">
                        {intern.sprintAttendance}
                      </span>
                    </td>
                    <td className="py-4 font-mono text-[11px]">
                      {intern.activePlacement ? (
                        <div>
                          <span className="font-bold text-slate-900 block">{intern.activePlacement.companyName}</span>
                          <span className="text-[9px] font-bold text-purple-700 uppercase">
                            {intern.activePlacement.pipelineStage}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unplaced</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          intern.status === 'Verified LMS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {intern.status === 'Verified LMS' && (
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{intern.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/portfolio/${intern.subdomain}`}
                          target="_blank"
                          className="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-[#512d7c] rounded-lg transition-colors"
                          title="View Public Portfolio"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleVerification(intern.id)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                        >
                          {intern.status === 'Verified LMS' ? 'Revoke' : 'Accredit'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRegenerateNhcId(intern.id)}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm cursor-pointer"
                          title="Regenerate NHC ID"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
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

      {/* Hologram Pass Inspector Modal */}
      {selectedIntern && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Security Audit Console
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedIntern.name} ({selectedIntern.nhcId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntern(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Interactive Pass Card Render */}
            <div
              onClick={() => setCardFlipped(!cardFlipped)}
              className="cursor-pointer bg-[#120324] text-white rounded-3xl p-6 shadow-2xl border border-purple-500/30 relative overflow-hidden select-none min-h-[310px] flex flex-col justify-between"
            >
              {!cardFlipped ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-[#f2b42c] rounded-lg flex items-center justify-center font-black text-[#512d7c] text-xs">
                        D
                      </div>
                      <span className="font-mono font-black text-xs text-white">
                        DGG-NHC CREDENTIAL
                      </span>
                    </div>
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      {selectedIntern.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{selectedIntern.name}</h3>
                    <p className="text-xs text-[#f2b42c] font-bold">{selectedIntern.track}</p>
                    <p className="text-[10px] text-white/50 font-mono">{selectedIntern.institution}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="block text-[8px] font-mono text-purple-300 uppercase font-bold">
                        Evaluated Tier
                      </span>
                      <span className="text-xs font-bold text-white block">
                        {selectedIntern.tier.split('(')[0].trim()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                      <span className="block text-[8px] font-mono text-emerald-300 uppercase font-bold">
                        Sprint Attendance
                      </span>
                      <span className="text-xs font-bold text-white block">
                        {selectedIntern.sprintAttendance}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <span className="block text-[8px] font-mono text-white/40 uppercase">ASSIGNED PASS ID</span>
                      <span className="font-mono font-black text-[#f2b42c] text-sm tracking-wider">
                        {selectedIntern.nhcId}
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-300 block">
                    Security Verification Seal
                  </span>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1 font-mono text-[10px] text-white/80">
                    <p><span className="text-white/40">Cert Hash:</span> {selectedIntern.certHash || 'NOT_ISSUED'}</p>
                    <p><span className="text-white/40">Tier Status:</span> {selectedIntern.tier}</p>
                    <p><span className="text-white/40">Attendance Badge:</span> {selectedIntern.sprintAttendance}</p>
                    <p><span className="text-white/40">Active Placement:</span> {selectedIntern.activePlacement ? `${selectedIntern.activePlacement.companyName} (₦${selectedIntern.activePlacement.stipend.toLocaleString()})` : 'None'}</p>
                    <p><span className="text-white/40">Public Slug:</span> /portfolio/{selectedIntern.subdomain}</p>
                    <p><span className="text-white/40">Enrolled:</span> {selectedIntern.enrolledDate}</p>
                  </div>
                  <span className="text-[9px] text-white/40 text-center block">Tap card to flip to front</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[9px] text-white/50 font-mono">
                <span>D-GLOBAL GROWTHFIELD</span>
                <span>AUTHENTIC RECORD</span>
              </div>
            </div>

            {/* Change Evaluated Tier Radio Controls */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-[#512d7c]" />
                <span>Modify Official Incubation Tier</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  'Fellow (Pro: 1-month fast-track)',
                  'Associate (Intermediate: 2-month trial)',
                  'Apprentice (Newbie: 3-month trial)',
                ].map((tierName) => (
                  <button
                    key={tierName}
                    type="button"
                    disabled={updatingTier}
                    onClick={() => handleUpdateTier(selectedIntern.id, tierName)}
                    className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                      selectedIntern.tier === tierName
                        ? 'bg-[#512d7c] text-white border-[#512d7c] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tierName}</span>
                    {selectedIntern.tier === tierName && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Sprint Attendance Score */}
            <form onSubmit={handleSaveCustomAttendance} className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modify Sprint Attendance Score</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">
                  Current: {selectedIntern.sprintAttendance}
                </span>
              </label>
              
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    required
                    placeholder="e.g. 70, 81, 95, 100"
                    value={customAttendanceInput}
                    onChange={(e) => setCustomAttendanceInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-8"
                  />
                  <span className="absolute right-3.5 top-2.5 font-mono font-black text-slate-400 text-sm pointer-events-none">
                    %
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={updatingAttendance}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  {updatingAttendance ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save %</span>
                </button>
              </div>
            </form>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleToggleVerification(selectedIntern.id)}
                className="py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
              >
                {selectedIntern.status === 'Verified LMS' ? 'Revoke Credential' : 'Authorize LMS Hash'}
              </button>
              <button
                type="button"
                onClick={() => handleRegenerateNhcId(selectedIntern.id)}
                className="py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
              >
                Regenerate Pass ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}