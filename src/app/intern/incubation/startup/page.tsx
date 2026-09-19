'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Building,
  Check,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Layers,
  MapPin,
  DollarSign,
  Send,
  Search,
  User,
  Tag,
  Target,
  Eye,
  X
} from 'lucide-react';

interface LivePlacement {
  id: string;
  startup_id: string;
  role_title: string;
  intern_tier: string;
  contract_term: string;
  pre_agreed_stipend: number;
  status: 'INVITED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pipeline_stage: string;
  created_at: string;
  terms_agreed_by_intern: boolean;
  startup_profiles?: {
    company_name: string;
    rc_number: string;
    business_category: string;
  };
}

interface PublicStartupJob {
  id: string;
  startup_id: string;
  role_title: string;
  track: string;
  stipend_amount: number;
  work_mode: string;
  location: string;
  description: string;
  requirements: string[];
  created_at: string;
  company_name?: string;
  rc_number?: string;
  nhc_id?: string;
  founder_name?: string;
  company_description?: string;
  core_services?: string[];
  target_audience?: string[];
}

export default function InternIncubationOffersPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [placements, setPlacements] = useState<LivePlacement[]>([]);
  const [startupJobs, setStartupJobs] = useState<PublicStartupJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Contract Acceptance Modal State
  const [selectedOffer, setSelectedOffer] = useState<LivePlacement | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Job Application State
  const [applyingJob, setApplyingJob] = useState<PublicStartupJob | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccess, setAppSuccess] = useState(false);

  // Company Profile Modal State
  const [inspectingCompanyJob, setInspectingCompanyJob] = useState<PublicStartupJob | null>(null);

  const [internInfo, setInternInfo] = useState({
    name: 'Apprentice Candidate',
    track: 'Engineering',
    nhcId: 'DGG-NHC-2026',
    tier: 'Associate (Intermediate: 2-month trial)',
  });

  const loadData = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    const uid = authData.user.id;
    setCurrentUserId(uid);

    // 1. Fetch Intern Profile Information
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', uid)
      .maybeSingle();

    const { data: intern } = await supabase
      .from('intern_profiles')
      .select('nhc_id, specialization_track, tier')
      .eq('id', uid)
      .maybeSingle();

    if (profile) {
      setInternInfo({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Apprentice Candidate',
        track: intern?.specialization_track || 'Engineering Track',
        nhcId: intern?.nhc_id || 'DGG-NHC-2026',
        tier: intern?.tier || 'Associate (Intermediate: 2-month trial)',
      });
    }

    // 2. Fetch Placements / Inquiries for this intern
    const { data: placementData, error: plError } = await supabase
      .from('placements')
      .select(`
        id,
        startup_id,
        role_title,
        intern_tier,
        contract_term,
        pre_agreed_stipend,
        status,
        pipeline_stage,
        created_at,
        terms_agreed_by_intern,
        startup_profiles:startup_id (
          company_name,
          rc_number,
          business_category
        )
      `)
      .eq('intern_id', uid)
      .order('created_at', { ascending: false });

    if (!plError && placementData) {
      setPlacements(placementData as any);
    }

    // 3. Fetch Live Active Startup Job Openings from the DB
    const { data: jobsData, error: jobsError } = await supabase
      .from('startup_jobs')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false });

    if (!jobsError && jobsData && jobsData.length > 0) {
      const startupIds = Array.from(new Set(jobsData.map((j) => j.startup_id)));
      const { data: startupProfiles } = await supabase
        .from('startup_profiles')
        .select('id, company_name, rc_number, nhc_id, founder_name, description, core_services, target_audience')
        .in('id', startupIds);

      const startupMap: Record<string, any> = {};
      startupProfiles?.forEach((sp) => {
        startupMap[sp.id] = {
          name: sp.company_name || 'Enterprise Partner',
          rc: sp.rc_number || 'RC-VERIFIED',
          nhcId: sp.nhc_id || 'DGG-NHC-2026',
          founderName: sp.founder_name || 'Executive Director',
          companyDescription: sp.description || 'Verified enterprise startup offering tech apprenticeships.',
          coreServices: Array.isArray(sp.core_services) ? sp.core_services : [],
          targetAudience: Array.isArray(sp.target_audience) ? sp.target_audience : [],
        };
      });

      const enrichedJobs: PublicStartupJob[] = jobsData.map((j) => {
        const sp = startupMap[j.startup_id];
        return {
          ...j,
          company_name: sp?.name || 'Enterprise Partner',
          rc_number: sp?.rc || 'RC-VERIFIED',
          nhc_id: sp?.nhcId || 'DGG-NHC-2026',
          founder_name: sp?.founderName || 'Executive Director',
          company_description: sp?.companyDescription || '',
          core_services: sp?.coreServices || [],
          target_audience: sp?.targetAudience || [],
        };
      });

      setStartupJobs(enrichedJobs);
    } else {
      setStartupJobs([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    setAcceptingOffer(true);

    const { error } = await supabase
      .from('placements')
      .update({
        status: 'ACTIVE',
        pipeline_stage: 'IN_TRIAL',
        terms_agreed_by_intern: true,
      })
      .eq('id', selectedOffer.id);

    setAcceptingOffer(false);

    if (error) {
      alert(`Contract Authorization Failed: ${error.message}`);
      return;
    }

    setAcceptedSuccess(true);
    setPlacements((prev) =>
      prev.map((p) =>
        p.id === selectedOffer.id
          ? { ...p, status: 'ACTIVE', pipeline_stage: 'IN_TRIAL', terms_agreed_by_intern: true }
          : p
      )
    );

    setTimeout(() => {
      setAcceptedSuccess(false);
      setSelectedOffer(null);
    }, 1500);
  };

  const handleApplyToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    setSubmittingApp(true);

    const { error } = await supabase.from('placements').insert({
      startup_id: applyingJob.startup_id,
      intern_id: currentUserId,
      role_title: applyingJob.role_title,
      intern_tier: internInfo.tier,
      contract_term: '1_YEAR',
      pre_agreed_stipend: applyingJob.stipend_amount,
      status: 'INVITED',
      pipeline_stage: 'SHORTLISTED',
      terms_agreed_by_intern: false,
    });

    setSubmittingApp(false);

    if (error) {
      alert(`Application Submission Failed: ${error.message}`);
      return;
    }

    setAppSuccess(true);
    setTimeout(() => {
      setAppSuccess(false);
      setApplyingJob(null);
      loadData();
    }, 1500);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          Querying Verified Placement Contracts & Active Job Openings...
        </span>
      </div>
    );
  }

  const activePlacements = placements.filter(
    (p) => p.status === 'ACTIVE' || p.pipeline_stage === 'IN_TRIAL'
  );

  const filteredJobs = startupJobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      j.role_title.toLowerCase().includes(q) ||
      (j.company_name && j.company_name.toLowerCase().includes(q)) ||
      (j.track && j.track.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Contract Handshake & Job Board
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Enterprise Incubation Hub
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Welcome, <span className="font-bold text-white">{internInfo.name}</span>. Review direct offers extended by verified startups or inspect company dossiers and apply for active roles.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Verified NHC Pass</span>
            <span className="text-sm font-black font-mono text-amber-200">{internInfo.nhcId}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            title="Refresh Inquiries"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Shortcut to Active Workspace Pipeline */}
      {activePlacements.length > 0 && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                You have {activePlacements.length} Active Placement Workspace Ready
              </h3>
              <p className="text-xs text-slate-600">
                Weekly sprint submissions, PR reviews, attendance punch card, and supervisor ratings are active.
              </p>
            </div>
          </div>

          <Link
            href="/intern/incubation/pipeline"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 shrink-0"
          >
            <span>Open Sprint Runway Pipeline</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* SECTION 1: Active Job Board from Verified Startups */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#ff7a00]" />
              <span>Active Roles Posted by Startups</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore open apprenticeship positions and review company backgrounds before applying.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-xs text-slate-700">No Job Openings Available</h3>
            <p className="text-[11px] text-slate-400">
              Check back soon as verified enterprise partners post new apprenticeship roles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3 flex flex-col justify-between hover:border-purple-300 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                      {job.rc_number}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ₦{Number(job.stipend_amount).toLocaleString()} / mo
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-sm text-slate-900 leading-snug">{job.role_title}</h3>
                    <div className="flex items-center space-x-1 text-xs text-[#512d7c] font-bold mt-0.5">
                      <Building className="w-3.5 h-3.5" />
                      <span>{job.company_name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description || 'Deliver scheduled technical sprints and feature releases.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{job.location} ({job.work_mode})</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingCompanyJob(job)}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyingJob(job)}
                    className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Incoming Placement Offers Desk */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#512d7c]" />
              <span>Incoming Enterprise Offers & Handshakes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Governed by DGG Tri-Party Escrow. Authorize your offer to enter active sprint trials.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">
            {placements.length} Total Registered Inquiries
          </span>
        </div>

        {placements.length === 0 ? (
          <div className="py-14 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="font-extrabold text-xs text-slate-900">No Direct Inquiries Logged Yet</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              When startups discover your portfolio or review your job applications, their formal trial offers will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {placements.map((placement) => {
              const company = placement.startup_profiles?.company_name || 'Enterprise Partner';
              const rc = placement.startup_profiles?.rc_number || 'RC-VERIFIED';
              const stipendVal = Number(placement.pre_agreed_stipend || 0);
              const isActive = placement.status === 'ACTIVE' || placement.pipeline_stage === 'IN_TRIAL';

              return (
                <div
                  key={placement.id}
                  className={`bg-slate-50 border rounded-3xl p-6 flex flex-col justify-between space-y-4 transition-all ${
                    isActive ? 'border-emerald-300 shadow-sm bg-emerald-50/20' : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                        {rc}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isActive ? 'ACTIVE TRIAL LOCKED' : 'OFFER PENDING REVIEW'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-slate-900">{company}</h3>
                      <p className="text-xs font-bold text-[#512d7c] mt-0.5">
                        {placement.role_title || 'Specialist Associate'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Monthly Escrow Stipend:</span>
                        <span className="font-bold text-emerald-700">₦{stipendVal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Proof-of-Value Runway:</span>
                        <span className="font-bold text-slate-800">{placement.intern_tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Post-Trial Term:</span>
                        <span className="font-bold text-slate-800">{placement.contract_term.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    {isActive ? (
                      <Link
                        href="/intern/incubation/pipeline"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <span>Open Sprint Runway Pipeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedOffer(placement)}
                        className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <span>Review Contract & Accept</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: COMPANY DOSSIER INSPECTOR */}
      {inspectingCompanyJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  ID: {inspectingCompanyJob.nhc_id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {inspectingCompanyJob.company_name}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {inspectingCompanyJob.rc_number} • CAC Accredited Partner
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCompanyJob(null)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-base cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-4 text-xs">
              {/* Founder / Leadership */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#512d7c] text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Founder / Lead Executive</span>
                  <strong className="text-slate-900 text-xs">{inspectingCompanyJob.founder_name}</strong>
                </div>
              </div>

              {/* Company Profile & Mission */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Company Profile & Mission Overview</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {inspectingCompanyJob.company_description || 'Pan-African digital growth engine delivering enterprise web software architectures, talent apprenticeships, and cross-border digital operations.'}
                </p>
              </div>

              {/* Core Services & Deliverables */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-[#512d7c]" />
                  <span>Core Services & Deliverables</span>
                </span>
                {inspectingCompanyJob.core_services && inspectingCompanyJob.core_services.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingCompanyJob.core_services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-purple-50 text-[#512d7c] border border-purple-200 font-bold rounded-full text-[11px]"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Software Engineering & Enterprise Solutions</p>
                )}
              </div>

              {/* Target Audience & Client Focus */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Target Audience & Client Focus</span>
                </span>
                {inspectingCompanyJob.target_audience && inspectingCompanyJob.target_audience.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingCompanyJob.target_audience.map((aud, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold rounded-full text-[11px]"
                      >
                        {aud}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Early-Stage Startups, SMEs & Pan-African Brands</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setInspectingCompanyJob(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetJob = inspectingCompanyJob;
                  setInspectingCompanyJob(null);
                  setApplyingJob(targetJob);
                }}
                className="w-2/3 py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply for Role ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPLICATION SUBMISSION */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Direct Apprenticeship Application
                </span>
                <h3 className="text-base font-black text-slate-900">{applyingJob.role_title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {appSuccess ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Application Dispatched!</h4>
                <p className="text-xs text-slate-500">
                  Your profile and NHC pass have been routed directly to {applyingJob.company_name}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplyToRole} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Company:</span>
                    <span className="font-bold text-slate-900">{applyingJob.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Stipend:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₦{Number(applyingJob.stipend_amount).toLocaleString()} / month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Track:</span>
                    <span className="font-bold text-slate-900">{applyingJob.track}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-[#512d7c] leading-relaxed">
                  Your verified NHC profile ({internInfo.nhcId}) will be submitted for review. Once shortlisted, the startup can immediately extend an incubation contract.
                </div>

                <button
                  type="submit"
                  disabled={submittingApp}
                  className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingApp ? 'Submitting Application...' : 'Confirm & Apply ➔'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONTRACT ACCEPTANCE */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Tri-Party Placement Agreement
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedOffer.startup_profiles?.company_name || 'Enterprise Partner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {acceptedSuccess ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Trial Placement Authorized!</h4>
                <p className="text-xs text-slate-500">
                  You are now paired with {selectedOffer.startup_profiles?.company_name}. Redirecting to your active sprint runway...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignContract} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enterprise:</span>
                    <span className="font-bold text-slate-900">
                      {selectedOffer.startup_profiles?.company_name} ({selectedOffer.startup_profiles?.rc_number || 'RC-VERIFIED'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Position:</span>
                    <span className="font-bold text-[#512d7c]">{selectedOffer.role_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Stipend:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₦{Number(selectedOffer.pre_agreed_stipend).toLocaleString()} / month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Post-Trial Term:</span>
                    <span className="font-bold text-slate-900">{selectedOffer.contract_term.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-[#512d7c] leading-relaxed">
                  By accepting, you confirm your availability to deliver 4 weekly product milestones. Monthly stipends lock into escrow and release automatically upon supervisor sprint sign-off.
                </div>

                <button
                  type="submit"
                  disabled={acceptingOffer}
                  className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {acceptingOffer ? 'Authorizing Contract...' : 'Accept Trial Placement ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}