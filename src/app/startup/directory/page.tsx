'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ExternalLink,
  Award,
  Sparkles,
  Building,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  Send,
  Lock
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  nhcId: string;
  tier: string;
  track: string;
  institution: string;
  avatarUrl: string;
  bio: string;
  subdomainHandle: string;
  verifiedCertId: string;
  educationCount: number;
  projectsCount: number;
}

export default function StartupDirectoryPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [trackFilter, setTrackFilter] = useState('ALL');

  // Incubation Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [roleTitle, setRoleTitle] = useState('');
  const [contractTerm, setContractTerm] = useState<'6_MONTHS' | '1_YEAR' | '2_YEARS'>('1_YEAR');
  const [proposedStipend, setProposedStipend] = useState<number>(150000);
  const [dispatchingOffer, setDispatchingOffer] = useState(false);
  const [offerSuccessNotice, setOfferSuccessNotice] = useState<string | null>(null);

  // Startup User Info
  const [startupProfile, setStartupProfile] = useState<{ id: string; companyName: string } | null>(null);

  useEffect(() => {
    async function loadDirectoryData() {
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

      // 2. Fetch all verified interns
      const { data: interns, error } = await supabase
        .from('intern_profiles')
        .select(`
          id,
          nhc_id,
          tier,
          specialization_track,
          institution,
          bio,
          subdomain_handle,
          verified_cert_id,
          education,
          profiles ( first_name, last_name, avatar_url )
        `);

      if (!error && interns && interns.length > 0) {
        const mapped: Candidate[] = interns.map((item: any) => ({
          id: item.id,
          name: `${item.profiles?.first_name || 'Candidate'} ${item.profiles?.last_name || ''}`.trim(),
          nhcId: item.nhc_id || 'DGG-NHC-2026-7112',
          tier: item.tier || 'Apprentice (Newbie: 3-month trial)',
          track: item.specialization_track || 'Full Stack Engineering',
          institution: item.institution || 'Partner University',
          avatarUrl: item.profiles?.avatar_url || '',
          bio: item.bio || 'Vetted talent ready for remote enterprise incubation.',
          subdomainHandle: item.subdomain_handle || 'irene-obioha-7112',
          verifiedCertId: item.verified_cert_id || 'DGG-IN-56722734',
          educationCount: Array.isArray(item.education) ? item.education.length : 1,
          projectsCount: 2,
        }));
        setCandidates(mapped);
      } else {
        // Fallback demo candidates
        setCandidates([
          {
            id: 'demo-1',
            name: 'Irene Obioha',
            nhcId: 'DGG-NHC-2026-7112',
            tier: 'Associate (Intermediate: 2-month trial)',
            track: 'TRK-02: Data Analytics & Cloud Systems',
            institution: 'University of Ibadan',
            avatarUrl: '',
            bio: 'Specializing in Next.js, TypeScript, PostgreSQL, and scalable cloud microservice pipelines with verified tripartite credentials.',
            subdomainHandle: 'irene-obioha-7112',
            verifiedCertId: 'DGG-IN-56722734',
            educationCount: 1,
            projectsCount: 2,
          },
          {
            id: 'demo-2',
            name: 'Kelechi Emmanuel',
            nhcId: 'DGG-NHC-2026-8021',
            tier: 'Fellow (Pro: 1-month fast-track)',
            track: 'TRK-01: Full Stack Systems Engineering',
            institution: 'University of Lagos',
            avatarUrl: '',
            bio: 'Senior apprentice building high-concurrency Node.js microservices and Supabase multi-tenant RLS infrastructure.',
            subdomainHandle: 'kelechi-emmanuel-8021',
            verifiedCertId: 'DGG-IN-98124401',
            educationCount: 1,
            projectsCount: 3,
          },
        ]);
      }
      setLoading(false);
    }

    loadDirectoryData();
  }, []);

  const openOfferModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    const suggestedRole = candidate.track.includes(':')
      ? `${candidate.track.split(':')[1].trim()} Specialist`
      : `${candidate.track} Engineer`;
    setRoleTitle(suggestedRole);
    setProposedStipend(150000);
    setContractTerm('1_YEAR');
  };

  const handleDispatchOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !startupProfile) return;
    setDispatchingOffer(true);

    const trialMonths = selectedCandidate.tier.includes('Fellow')
      ? 1
      : selectedCandidate.tier.includes('Associate')
      ? 2
      : 3;

    const { error } = await supabase.from('placements').insert({
      startup_id: startupProfile.id,
      intern_id: selectedCandidate.id,
      role_title: roleTitle,
      intern_tier: selectedCandidate.tier,
      trial_duration_months: trialMonths,
      contract_term: contractTerm,
      pre_agreed_stipend: proposedStipend,
      terms_agreed_by_startup: true,
      terms_agreed_by_intern: false,
      status: 'INVITED',
    });

    setDispatchingOffer(false);
    setOfferSuccessNotice(
      `Incubation Offer dispatched to ${selectedCandidate.name}! The terms are pre-sealed: ${contractTerm.replace('_', ' ')} @ ₦${proposedStipend.toLocaleString()}/mo.`
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

    const matchesTier =
      tierFilter === 'ALL' ||
      (tierFilter === 'APPRENTICE' && c.tier.includes('Apprentice')) ||
      (tierFilter === 'ASSOCIATE' && c.tier.includes('Associate')) ||
      (tierFilter === 'FELLOW' && c.tier.includes('Fellow'));

    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono-tech text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          LOADING ACCREDITED TALENT DIRECTORY...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-amber-200">
              Verified Candidate Ledger
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Accredited Intern Directory
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Browse verified tech talent evaluated across 3 incubation tiers. Inspect capstone builds, review LMS accreditations, and dispatch pre-sealed offers with zero upfront trial risk.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs font-mono-tech space-y-1">
          <span className="block text-white/70 uppercase text-[9px] font-bold">Total Vetted Roster</span>
          <span className="text-2xl font-black text-amber-300">{candidates.length} Candidates</span>
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

        {/* Tier Buttons Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Tiers' },
            { id: 'APPRENTICE', label: 'Apprentice (3 Mo)' },
            { id: 'ASSOCIATE', label: 'Associate (2 Mo)' },
            { id: 'FELLOW', label: 'Fellow (1 Mo)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTierFilter(t.id)}
              className={`px-3 py-2 rounded-xl font-mono-tech font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
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

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((cand) => (
          <div
            key={cand.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative group"
          >
            <div className="space-y-4">
              {/* Header: Avatar, Name & Verified Badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#180829] border-2 border-purple-200 shrink-0 flex items-center justify-center font-black text-xl text-white shadow-inner">
                    {cand.avatarUrl ? (
                      <img src={cand.avatarUrl} alt={cand.name} className="w-full h-full object-cover" />
                    ) : (
                      cand.name[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      {cand.name}
                    </h3>
                    <span className="text-[11px] font-bold text-[#512d7c] block pt-0.5">
                      {cand.track}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono-tech block">
                      {cand.institution}
                    </span>
                  </div>
                </div>

                <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200" title="Accredited DGG-NHC Credential">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>

              {/* Incubation Tier Strip */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-0.5">
                <span className="text-[8px] font-mono-tech uppercase font-bold text-slate-400 block">
                  Assigned Runway & Tier
                </span>
                <span className="text-xs font-black text-slate-900 block">
                  {cand.tier}
                </span>
              </div>

              {/* Bio snippet */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {cand.bio}
              </p>

              {/* Meta Counters */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-tech text-slate-500">
                <span>Pass: {cand.verifiedCertId}</span>
                <span className="font-bold text-emerald-700">&#10003; 100% Sprint Attendance</span>
              </div>
            </div>

            {/* Actions: View Public Portfolio + Send Offer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
              <Link
                href={`/portfolio/${cand.subdomainHandle}`}
                target="_blank"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <span>View Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => openOfferModal(cand)}
                className="px-4 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Express Interest ➔</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ==============================================================================
          INCUBATION OFFER MODAL (LOCKED PRE-AGREED TERMS)
         ============================================================================== */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#512d7c] flex items-center justify-center font-bold">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono-tech uppercase font-bold text-purple-700 block">
                    Pre-Contract Placement Dispatch
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

              {/* The Pre-Agreed Locked Terms Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Post-Trial Contract Term
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
                    Pre-Agreed Monthly Salary (₦)
                  </label>
                  <input
                    type="number"
                    min={50000}
                    max={500000}
                    step={5000}
                    value={proposedStipend}
                    onChange={(e) => setProposedStipend(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              </div>

              {/* Breakdown Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 font-mono-tech text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Proof-of-Value Free Runway:</span>
                  <span className="font-bold text-emerald-700">{selectedCandidate.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Post-Trial Commitment:</span>
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
                <strong>Platform Rule:</strong> You pay ₦0 upfront for the entire trial runway. The {contractTerm.replace('_', ' ')} contract terms are sealed today so both you and the candidate enter incubation with guaranteed certainty.
              </p>

              <button
                type="submit"
                disabled={dispatchingOffer}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{dispatchingOffer ? 'Sealing Offer...' : 'Seal & Send Incubation Offer ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}