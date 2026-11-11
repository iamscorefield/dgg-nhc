'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  FileCheck,
  Briefcase,
  Send,
  RefreshCw,
  Award
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  nhcId: string;
  tier: string;
  tierLevel: 'TIER_1' | 'TIER_2' | 'TIER_3';
  trialDurationText: string;
  trialWeeks: number;
  track: string;
  institution: string;
  avatarUrl: string;
  bio: string;
  subdomainHandle: string;
  verifiedCertId: string;
  educationCount: number;
  completedJobsCount: number;
}

export default function StartupDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');

  // Incubation Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [contractTerm, setContractTerm] = useState<'6_MONTHS' | '1_YEAR' | '2_YEARS'>('1_YEAR');
  const [proposedStipend, setProposedStipend] = useState<number>(150000);
  const [dispatchingOffer, setDispatchingOffer] = useState(false);
  const [offerSuccessNotice, setOfferSuccessNotice] = useState<string | null>(null);

  // Startup User Info
  const [startupProfile, setStartupProfile] = useState<{ id: string; companyName: string } | null>(null);

  const loadDirectoryData = async () => {
    setLoading(true);

    // 1. Fetch current startup profile
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { data: sp } = await supabase
        .from('startup_profiles')
        .select('id, company_name')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (sp) {
        setStartupProfile({ id: sp.id, companyName: sp.company_name || 'Enterprise Partner' });
      }
    }

    // 2. Fetch all real intern records from intern_profiles
    const { data: interns, error: internErr } = await supabase
      .from('intern_profiles')
      .select('*');

    if (!internErr && interns && interns.length > 0) {
      // Gather user IDs to fetch linked profiles safely without join failures
      const userIds = interns.map((i: any) => i.id || i.user_id).filter(Boolean);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);

      const profileMap: Record<string, any> = {};
      profilesData?.forEach((p) => {
        profileMap[p.id] = p;
      });

      // Query completed placement counts for tier classification
      const { data: completedPlacements } = await supabase
        .from('placements')
        .select('intern_id')
        .eq('status', 'COMPLETED');

      const completedMap: Record<string, number> = {};
      completedPlacements?.forEach((cp) => {
        completedMap[cp.intern_id] = (completedMap[cp.intern_id] || 0) + 1;
      });

      const mapped: Candidate[] = interns.map((item: any) => {
        const uId = item.id || item.user_id;
        const linkedProf = profileMap[uId];
        const completedCount = completedMap[uId] || item.completed_jobs_count || 0;

        // Clean names, defaults to DB data or verified profile name
        const candidateName = linkedProf?.first_name
          ? `${linkedProf.first_name} ${linkedProf.last_name || ''}`.trim()
          : item.full_name || 'Apprentice Intern';

        // Dynamic 3-Tier Classification
        let tierLevel: 'TIER_1' | 'TIER_2' | 'TIER_3' = 'TIER_1';
        let tier = 'Tier 1: Foundation (2-Week Trial)';
        let trialDurationText = '2-Week Evaluation Trial';
        let trialWeeks = 2;

        const rawTier = (item.tier || '').toLowerCase();
        if (completedCount >= 4 || rawTier.includes('pro') || rawTier.includes('fellow') || rawTier.includes('tier 3')) {
          tierLevel = 'TIER_3';
          tier = 'Tier 3: Nexus Pro (Zero Trial / Direct Retainer)';
          trialDurationText = 'Zero Trial / Instant Retainer';
          trialWeeks = 0;
        } else if (completedCount >= 2 || rawTier.includes('associate') || rawTier.includes('tier 2') || rawTier.includes('acceleration')) {
          tierLevel = 'TIER_2';
          tier = 'Tier 2: Acceleration (1-Week Fast-Track)';
          trialDurationText = '1-Week Fast-Track Trial';
          trialWeeks = 1;
        }

        return {
          id: uId,
          name: candidateName,
          nhcId: item.nhc_id || 'DGG-NHC-2026',
          tier,
          tierLevel,
          trialDurationText,
          trialWeeks,
          track: item.specialization_track || 'General Technology',
          institution: item.institution || 'Partner University',
          avatarUrl: linkedProf?.avatar_url || item.avatar_url || '',
          bio: item.bio || 'Vetted talent ready for remote enterprise incubation.',
          subdomainHandle: item.subdomain_handle || '',
          verifiedCertId: item.verified_cert_id || 'DGG-VERIFIED',
          educationCount: Array.isArray(item.education) ? item.education.length : 1,
          completedJobsCount: completedCount,
        };
      });

      setCandidates(mapped);
    } else {
      setCandidates([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDirectoryData();
  }, []);

  const openOfferModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    const suggestedRole = candidate.track.includes(':')
      ? `${candidate.track.split(':')[1].trim()} Specialist`
      : `${candidate.track} Specialist`;
    setRoleTitle(suggestedRole);
    setProposedStipend(150000);
    setContractTerm('1_YEAR');
  };

  const handleDispatchOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !startupProfile) return;
    setDispatchingOffer(true);

    const isPro = selectedCandidate.tierLevel === 'TIER_3';

    const { error } = await supabase.from('placements').insert({
      startup_id: startupProfile.id,
      intern_id: selectedCandidate.id,
      role_title: roleTitle,
      intern_tier: selectedCandidate.tier,
      trial_duration_weeks: selectedCandidate.trialWeeks,
      contract_term: contractTerm,
      pre_agreed_stipend: proposedStipend,
      terms_agreed_by_startup: true,
      terms_agreed_by_intern: false,
      status: 'INVITED',
      pipeline_stage: isPro ? 'RETAINED' : 'OFFER_EXTENDED',
    });

    setDispatchingOffer(false);

    if (error) {
      alert(`Offer Dispatch Failed: ${error.message}`);
      return;
    }

    setOfferSuccessNotice(
      `Incubation Offer dispatched to ${selectedCandidate.name}! The terms are pre-sealed: ${contractTerm.replace('_', ' ')} @ ₦${proposedStipend.toLocaleString()}/mo with ${selectedCandidate.trialDurationText}.`
    );

    setTimeout(() => {
      setOfferSuccessNotice(null);
      setSelectedCandidate(null);
    }, 3500);
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.track.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'ALL' || c.tierLevel === tierFilter;

    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          Querying Verified Talent Directory...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Verified Talent Directory & Agile 3-Tier Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Accredited Talent's Expert Directory
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Browse verified talent categorized by speed: <strong>Tier 1</strong> (2-Week Trial for entry talent), <strong>Tier 2</strong> (1-Week Fast-Track for multi-client veterans), and <strong>Tier 3 Nexus Pro</strong> (Instant Deploy with zero trial).
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs font-mono space-y-1 text-right">
            <span className="block text-white/70 uppercase text-[9px] font-bold">Total Vetted Talent</span>
            <span className="text-2xl font-black text-amber-300">{candidates.length} Profiles</span>
          </div>
          <button
            type="button"
            onClick={loadDirectoryData}
            title="Refresh Directory"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {offerSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{offerSuccessNotice}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by candidate name, track, or university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c] font-medium"
          />
        </div>

        {/* 3-Tier Buttons Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Candidates' },
            { id: 'TIER_1', label: 'Tier 1: Foundation (2 Wks)' },
            { id: 'TIER_2', label: 'Tier 2: Fast-Track (1 Wk)' },
            { id: 'TIER_3', label: 'Tier 3: Nexus Pro (Zero Trial)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id as any)}
              className={`px-3 py-2 rounded-xl font-mono font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                tierFilter === t.id
                  ? 'bg-[#512d7c] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State vs Candidate Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-800">No Candidates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || tierFilter !== 'ALL'
              ? 'No candidates match your current search or tier filter.'
              : 'Verified candidates will appear here as interns complete their intake verification.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#180829] border-2 border-purple-200 shrink-0 flex items-center justify-center font-black text-xl text-white shadow-inner">
                      {cand.avatarUrl ? (
                        <img src={cand.avatarUrl} alt={cand.name} className="w-full h-full object-cover" />
                      ) : (
                        cand.name[0] || 'A'
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                        {cand.name}
                      </h3>
                      <span className="text-[11px] font-bold text-[#512d7c] block pt-0.5">
                        {cand.track}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {cand.institution}
                      </span>
                    </div>
                  </div>

                  <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200" title="Accredited DGG-NHC Credential">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border space-y-0.5 ${
                  cand.tierLevel === 'TIER_3'
                    ? 'bg-purple-50/70 border-purple-200'
                    : cand.tierLevel === 'TIER_2'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono uppercase font-bold text-slate-400">
                      {cand.tierLevel === 'TIER_3' ? 'Verified Expert' : 'Assigned Evaluation Runway'}
                    </span>
                    <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      cand.tierLevel === 'TIER_3'
                        ? 'bg-purple-100 text-[#512d7c]'
                        : cand.tierLevel === 'TIER_2'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {cand.trialDurationText}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 block">
                    {cand.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {cand.bio}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Pass: {cand.verifiedCertId}</span>
                  <span className="font-bold text-emerald-700">
                    {cand.completedJobsCount > 0 ? `✓ ${cand.completedJobsCount} Completed Projects` : 'Fresh Intake'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                {cand.subdomainHandle ? (
                  <Link
                    href={`/portfolio/${cand.subdomainHandle}`}
                    target="_blank"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono italic">No Subdomain</span>
                )}

                <button
                  type="button"
                  onClick={() => openOfferModal(cand)}
                  className="px-4 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>{cand.tierLevel === 'TIER_3' ? 'Direct Retainer ➔' : 'Express Interest ➔'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#512d7c] flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-700 block">
                    {selectedCandidate.tierLevel === 'TIER_3' ? 'Direct Placement Agreement' : 'Pre-Contract Placement Dispatch'}
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Incubation Offer: {selectedCandidate.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchOffer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Position / Sprint Role</label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contract Term
                  </label>
                  <select
                    value={contractTerm}
                    onChange={(e) => setContractTerm(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  >
                    <option value="6_MONTHS">6 Months Term</option>
                    <option value="1_YEAR">1 Year Term (Standard)</option>
                    <option value="2_YEARS">2 Years Term (Max Term)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Pre-Agreed Monthly Retainer (₦)
                  </label>
                  <input
                    type="number"
                    min={50000}
                    max={500000}
                    step={5000}
                    value={proposedStipend}
                    onChange={(e) => setProposedStipend(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Talent Progression Status:</span>
                  <span className="font-bold text-[#512d7c]">{selectedCandidate.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Required Trial Runway:</span>
                  <span className="font-bold text-emerald-700">{selectedCandidate.trialDurationText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Post-Trial Monthly Commitment:</span>
                  <span className="font-bold text-slate-900">
                    {contractTerm.replace('_', ' ')} @ ₦{proposedStipend.toLocaleString()} / mo
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-purple-900 font-bold">
                  <span>10% Platform Facilitation Fee:</span>
                  <span>₦{(proposedStipend * 0.1).toLocaleString()} / mo</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong>Platform Rule:</strong> {selectedCandidate.tierLevel === 'TIER_3' ? 'This candidate is an accredited Nexus Pro veteran with zero trial required; contract begins immediately upon acceptance.' : `You pay ₦0 upfront for the ${selectedCandidate.trialDurationText}. The ${contractTerm.replace('_', ' ')} contract terms lock today to ensure commitment.`}
              </p>

              <button
                type="submit"
                disabled={dispatchingOffer}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{dispatchingOffer ? 'Sealing Offer...' : selectedCandidate.tierLevel === 'TIER_3' ? 'Authorize Direct Retainer ➔' : 'Seal & Send Incubation Offer ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}