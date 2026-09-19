'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  Building,
  CheckCircle2,
  Lock,
  Sparkles,
  FileCheck,
  Star,
  Users,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Send,
  Plus,
  Layers,
  Search,
  Check,
  X,
  Sliders,
  Award,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';

interface TripartitePlacement {
  id: string;
  internId: string;
  internName: string;
  internAvatar: string;
  internTrack: string;
  subdomainHandle: string;
  companyName: string;
  roleTitle: string;
  trialDurationMonths: number;
  contractTerm: string;
  preAgreedStipend: number;
  status: string;
  pipelineStage: string;
  isDirectAdminPlacement: boolean;
}

interface ManagedIntern {
  id: string;
  name: string;
  nhcId: string;
  tier: string;
  track: string;
  institution: string;
  attendanceScore: string;
  subdomainHandle: string;
}

export default function AdminStartupsAndClearinghousePage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'CLEARANCE_GATE' | 'ACTIVE_PLACEMENTS' | 'EVALUATE_INTERNS' | 'DIRECT_ADMIN'>('CLEARANCE_GATE');

  const [placements, setPlacements] = useState<TripartitePlacement[]>([]);
  const [interns, setInterns] = useState<ManagedIntern[]>([]);

  // Direct Admin Assignment Modal
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [selectedInternId, setSelectedInternId] = useState('');
  const [adminRoleTitle, setAdminRoleTitle] = useState('DGG Internal Core Infrastructure Developer');
  const [adminContractTerm, setAdminContractTerm] = useState<'6_MONTHS' | '1_YEAR' | '2_YEARS'>('1_YEAR');
  const [adminStipend, setAdminStipend] = useState(150000);
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  // Admin Candidate Tier & Attendance Evaluation Modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalTargetIntern, setEvalTargetIntern] = useState<ManagedIntern | null>(null);
  const [evalTier, setEvalTier] = useState('Associate (Intermediate: 2-month trial)');
  const [evalAttendance, setEvalAttendance] = useState('100%');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  // Admin Review Drawer
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [targetPlacement, setTargetPlacement] = useState<TripartitePlacement | null>(null);
  const [adminRating, setAdminRating] = useState(5);
  const [adminReviewTitle, setAdminReviewTitle] = useState('');
  const [adminReviewComment, setAdminReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const loadClearinghouseData = async () => {
    setLoading(true);

    try {
      // 1. Fetch base tables in parallel without complex joins
      const [
        { data: rawPlacements, error: plError },
        { data: rawInterns, error: internError }
      ] = await Promise.all([
        supabase
          .from('placements')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('intern_profiles')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (plError) console.error('Placements query notice:', plError.message || plError);
      if (internError) console.error('Interns query notice:', internError.message || internError);

      const validPlacements = rawPlacements || [];
      const validInterns = rawInterns || [];

      // 2. Extract unique entity IDs for lookup
      const startupIds = Array.from(new Set(validPlacements.map((p: any) => p.startup_id).filter(Boolean)));
      const internUserIds = Array.from(new Set([
        ...validPlacements.map((p: any) => p.intern_id),
        ...validInterns.map((i: any) => i.id)
      ].filter(Boolean)));

      // 3. Fetch supporting profile rows in parallel
      const [
        { data: startupsData },
        { data: profilesData }
      ] = await Promise.all([
        startupIds.length > 0
          ? supabase.from('startup_profiles').select('id, company_name').in('id', startupIds)
          : Promise.resolve({ data: [] }),
        internUserIds.length > 0
          ? supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', internUserIds)
          : Promise.resolve({ data: [] })
      ]);

      const startupMap = new Map((startupsData || []).map((s: any) => [s.id, s.company_name]));
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
      const internProfileMap = new Map(validInterns.map((i: any) => [i.id, i]));

      // 4. Map Placements cleanly
      const mappedPlacements: TripartitePlacement[] = validPlacements.map((p: any) => {
        const profile = profileMap.get(p.intern_id);
        const internProfile = internProfileMap.get(p.intern_id);

        let stage = p.pipeline_stage;
        if (!stage || stage === 'BOOKMARKED') stage = 'SHORTLISTED';
        if (stage === 'INVITED') stage = 'OFFER_EXTENDED';
        if (stage === 'TRIAL_ACTIVE' || p.status === 'ACTIVE') stage = 'IN_TRIAL';
        if (stage === 'HIRED_CONTRACTED' || p.status === 'COMPLETED') stage = 'RETAINED';

        return {
          id: p.id,
          internId: p.intern_id,
          internName: `${profile?.first_name || 'Apprentice'} ${profile?.last_name || ''}`.trim(),
          internAvatar: profile?.avatar_url || '',
          internTrack: internProfile?.specialization_track || 'Specialist Track',
          subdomainHandle: internProfile?.subdomain_handle || 'apprentice',
          companyName: p.is_direct_admin_placement
            ? 'D-Global Growthfield Operations'
            : startupMap.get(p.startup_id) || 'Enterprise Partner',
          roleTitle: p.role_title || 'Specialist Associate',
          internTier: p.intern_tier || 'Associate (Intermediate: 2-month trial)',
          trialDurationMonths: p.trial_duration_months || 2,
          contractTerm: p.contract_term || '1_YEAR',
          preAgreedStipend: Number(p.pre_agreed_stipend) || 150000,
          status: p.status || 'INVITED',
          pipelineStage: stage,
          isDirectAdminPlacement: !!p.is_direct_admin_placement,
        };
      });

      // 5. Map Intern Roster cleanly
      const mappedInterns: ManagedIntern[] = validInterns.map((i: any) => {
        const user = profileMap.get(i.id);
        return {
          id: i.id,
          name: `${user?.first_name || 'Intern'} ${user?.last_name || ''}`.trim(),
          nhcId: i.nhc_id || 'DGG-NHC-2026',
          tier: i.tier || 'Associate (Intermediate: 2-month trial)',
          track: i.specialization_track || 'Specialist Track',
          institution: i.institution || 'Academic Partner Campus',
          attendanceScore: i.sprint_attendance_score || '100%',
          subdomainHandle: i.subdomain_handle || 'apprentice',
        };
      });

      setPlacements(mappedPlacements);
      setInterns(mappedInterns);
      if (mappedInterns[0]) setSelectedInternId(mappedInterns[0].id);
    } catch (err) {
      console.error('Failed to load clearinghouse records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClearinghouseData();
  }, []);

  // Admin Clears & Authorizes the Tripartite Match
  const handleAuthorizeMatch = async (placementId: string) => {
    const { error } = await supabase
      .from('placements')
      .update({ 
        status: 'ACTIVE',
        pipeline_stage: 'IN_TRIAL',
        terms_agreed_by_startup: true,
        terms_agreed_by_intern: true
      })
      .eq('id', placementId);

    if (error) {
      alert(`Authorization failed: ${error.message}`);
      return;
    }

    setPlacements((prev) =>
      prev.map((p) => (p.id === placementId ? { ...p, status: 'ACTIVE', pipelineStage: 'IN_TRIAL' } : p))
    );

    setActionSuccessNotice('Tripartite Contract Authorized! Apprentice workspace and milestone sprint desk unlocked.');
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  // Open Candidate Evaluation Desk
  const openEvaluationModal = (candidate: ManagedIntern) => {
    setEvalTargetIntern(candidate);
    setEvalTier(candidate.tier);
    setEvalAttendance(candidate.attendanceScore || '100%');
    setShowEvalModal(true);
  };

  // Admin Saves Evaluated Tier and Sprint Attendance Score
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTargetIntern) return;
    setSavingEvaluation(true);

    const { error } = await supabase
      .from('intern_profiles')
      .update({
        tier: evalTier,
        sprint_attendance_score: evalAttendance,
      })
      .eq('id', evalTargetIntern.id);

    setSavingEvaluation(false);

    if (error) {
      alert(`Failed to save evaluation: ${error.message}`);
      return;
    }

    setInterns((prev) =>
      prev.map((item) =>
        item.id === evalTargetIntern.id
          ? { ...item, tier: evalTier, attendanceScore: evalAttendance }
          : item
      )
    );

    setShowEvalModal(false);
    setActionSuccessNotice(
      `Updated ${evalTargetIntern.name}: Attendance set to ${evalAttendance}, Tier set to ${evalTier.split('(')[0].trim()}. Portfolio badges refreshed!`
    );
    setTimeout(() => setActionSuccessNotice(null), 4000);
  };

  // Direct Placement to DGG Internal Projects
  const handleDirectAdminAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInternId) return;
    setAssigningAdmin(true);

    const chosen = interns.find((i) => i.id === selectedInternId);
    const trialMonths = chosen?.tier.includes('Fellow') ? 1 : chosen?.tier.includes('Associate') ? 2 : 3;

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setAssigningAdmin(false);
      alert('Authentication error: Administrator session required.');
      return;
    }

    const { data: newPlacement, error } = await supabase
      .from('placements')
      .insert({
        startup_id: authData.user.id,
        intern_id: selectedInternId,
        role_title: adminRoleTitle,
        intern_tier: chosen?.tier || 'Apprentice (Newbie: 3-month trial)',
        trial_duration_months: trialMonths,
        contract_term: adminContractTerm,
        pre_agreed_stipend: adminStipend,
        terms_agreed_by_startup: true,
        terms_agreed_by_intern: true,
        is_direct_admin_placement: true,
        status: 'ACTIVE',
        pipeline_stage: 'IN_TRIAL',
      })
      .select()
      .single();

    setAssigningAdmin(false);

    if (error) {
      alert(`Direct placement failed: ${error.message}`);
      return;
    }

    const newRecord: TripartitePlacement = {
      id: newPlacement.id,
      internId: selectedInternId,
      internName: chosen?.name || 'Assigned Intern',
      internAvatar: '',
      internTrack: chosen?.track || 'DGG Systems',
      subdomainHandle: chosen?.subdomainHandle || 'apprentice',
      companyName: 'D-Global Growthfield Operations',
      roleTitle: adminRoleTitle,
      internTier: chosen?.tier || 'Apprentice',
      trialDurationMonths: trialMonths,
      contractTerm: adminContractTerm,
      preAgreedStipend: adminStipend,
      status: 'ACTIVE',
      pipelineStage: 'IN_TRIAL',
      isDirectAdminPlacement: true,
    };

    setPlacements([newRecord, ...placements]);
    setShowDirectModal(false);
    setActionSuccessNotice(`Direct Placement created! ${chosen?.name} assigned to DGG Operations.`);
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  // Admin Submits Verified Supervisor Endorsement
  const handleSubmitAdminReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlacement) return;
    setSubmittingReview(true);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setSubmittingReview(false);
      return;
    }

    const { error } = await supabase.from('intern_performance_evaluations').insert({
      intern_id: targetPlacement.internId,
      startup_id: authData.user.id,
      technical_score: adminRating,
      written_endorsement: `${adminReviewTitle ? adminReviewTitle + ': ' : ''}${adminReviewComment}`,
      is_public_on_dossier: true,
    });

    setSubmittingReview(false);

    if (error) {
      alert(`Failed to stamp endorsement: ${error.message}`);
      return;
    }

    setShowReviewModal(false);
    setActionSuccessNotice(
      `Master Admin Endorsement officially stamped on ${targetPlacement.internName}'s public dossier!`
    );
    setTimeout(() => setActionSuccessNotice(null), 3500);
  };

  const pendingClearance = placements.filter(
    (p) => p.pipelineStage === 'OFFER_EXTENDED' || p.status === 'INVITED'
  );
  const activeSprints = placements.filter(
    (p) => p.pipelineStage === 'IN_TRIAL' || p.status === 'ACTIVE'
  );
  const directAdminPlacements = placements.filter((p) => p.isDirectAdminPlacement);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING TRIPARTITE CLEARINGHOUSE & PLACEMENT ENGINE...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Master Admin Tripartite Clearinghouse
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Placement Clearance & Academic Governance
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Authorize pre-sealed enterprise agreements (1-3 Mo Runway, 6M/1Y/2Y Term, Locked Salary), govern candidate sprint attendance badges, or assign candidates directly to DGG internal projects.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('EVALUATE_INTERNS')}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold rounded-2xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-300" />
            <span>Govern Tiers & Badges</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDirectModal(true)}
            className="px-5 py-3 bg-[#f2b42c] hover:bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Direct DGG Placement ➔</span>
          </button>

          <button
            type="button"
            onClick={loadClearinghouseData}
            title="Refresh Ledger"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white self-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessNotice}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-mono overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('CLEARANCE_GATE')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'CLEARANCE_GATE'
              ? 'bg-[#512d7c] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Pending Offers ({pendingClearance.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE_PLACEMENTS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'ACTIVE_PLACEMENTS'
              ? 'bg-[#512d7c] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Active Tripartite Placements ({activeSprints.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EVALUATE_INTERNS')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'EVALUATE_INTERNS'
              ? 'bg-[#512d7c] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Candidate Tiers & Attendance ({interns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIRECT_ADMIN')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
            activeTab === 'DIRECT_ADMIN'
              ? 'bg-[#512d7c] text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>DGG Internal Placements ({directAdminPlacements.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING TRIPARTITE CLEARANCE GATE */}
      {activeTab === 'CLEARANCE_GATE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Pre-Sealed Contracts Awaiting Final Admin Authorization
            </span>
          </div>

          {pendingClearance.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 font-mono">
              Zero pending contracts. All extended enterprise offers are cleared or in negotiation.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClearance.map((plc) => (
                <div
                  key={plc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          Offer Pending Authorization
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Role: {plc.roleTitle}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900">
                        {plc.internName} <span className="text-slate-400 font-normal">matched with</span> {plc.companyName}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">{plc.internTrack}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="block text-[8px] uppercase text-slate-400 font-bold">Free Runway</span>
                        <span className="font-black text-emerald-700">{plc.trialDurationMonths} Mo Trial</span>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#512d7c]">
                        <span className="block text-[8px] uppercase font-bold text-purple-600">Contract Term</span>
                        <span className="font-black">{plc.contractTerm.replace('_', ' ')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 col-span-2 sm:col-span-1">
                        <span className="block text-[8px] uppercase font-bold text-amber-600">Locked Stipend</span>
                        <span className="font-black">₦{plc.preAgreedStipend.toLocaleString()} / mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="text-slate-600">
                        Platform Facilitation Surcharge (10%): <strong className="text-slate-900">₦{(plc.preAgreedStipend * 0.1).toLocaleString()} / mo</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Both intern and startup signed terms. Approving will cryptographically unlock the active sprint runway.
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <Link
                        href={`/portfolio/${plc.subdomainHandle}`}
                        target="_blank"
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                      >
                        <span>Portfolio</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleAuthorizeMatch(plc.id)}
                        className="px-5 py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Authorize & Seal Match ➔</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE TRIPARTITE PLACEMENTS */}
      {activeTab === 'ACTIVE_PLACEMENTS' && (
        <div className="space-y-4">
          {activeSprints.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 font-mono">
              No active trial placements running currently.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeSprints.map((plc) => (
                <div
                  key={plc.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{plc.isDirectAdminPlacement ? 'DGG Internal Project' : 'Active Tripartite Trial'}</span>
                      </span>

                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {plc.contractTerm.replace('_', ' ')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900">{plc.internName}</h4>
                      <p className="text-xs font-bold text-[#512d7c]">{plc.roleTitle}</p>
                      <span className="text-[11px] text-slate-500 font-mono block">{plc.companyName}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="block text-[8px] uppercase text-slate-400">Locked Salary</span>
                        <span className="font-black text-slate-900">₦{plc.preAgreedStipend.toLocaleString()} / mo</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] uppercase text-slate-400">Runway</span>
                        <span className="font-bold text-amber-700">{plc.trialDurationMonths} Mo Trial</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/portfolio/${plc.subdomainHandle}`}
                      target="_blank"
                      className="text-slate-500 hover:text-slate-900 font-bold inline-flex items-center space-x-1"
                    >
                      <span>Inspect Subdomain</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetPlacement(plc);
                        setAdminRating(5);
                        setAdminReviewTitle('');
                        setAdminReviewComment('');
                        setShowReviewModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-[#512d7c] text-[#512d7c] hover:text-white border border-purple-200 font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Submit Admin Endorsement</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CANDIDATE TIERS & ATTENDANCE SCORE GOVERNANCE */}
      {activeTab === 'EVALUATE_INTERNS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#512d7c]" />
                  <span>Academic Board Governance: Tiers & Sprint Attendance Badges</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Card 1 (Attendance Score) and Card 4 (Trial Runway) on the public portfolio are directly controlled from here.
                </p>
              </div>
              <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200 font-bold">
                {interns.length} Candidates Enrolled
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {interns.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-mono text-xs">
                  No interns enrolled in registry.
                </div>
              ) : (
                interns.map((cand) => (
                  <div key={cand.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-black text-sm text-slate-900">{cand.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">({cand.nhcId})</span>
                      </div>
                      <p className="text-xs text-[#512d7c] font-bold">{cand.track}</p>
                      <span className="text-[11px] text-slate-400 font-mono block">{cand.institution}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-[#512d7c]">
                        <span className="block text-[8px] uppercase font-bold text-purple-600">Card 4: Tier Runway</span>
                        <span className="font-black text-xs">
                          {cand.tier.includes('Fellow') ? '1 MO' : cand.tier.includes('Associate') ? '2 MO' : '3 MO'} ({cand.tier.split('(')[0].trim()})
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="block text-[8px] uppercase font-bold text-emerald-600">Card 1: Attendance Badge</span>
                        <span className="font-black text-xs">{cand.attendanceScore}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => openEvaluationModal(cand)}
                        className="px-4 py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-amber-300" />
                        <span>Adjust Scores ➔</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT DGG INTERNAL PLACEMENTS */}
      {activeTab === 'DIRECT_ADMIN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase">
              Interns Assigned Directly Under Master Admin Supervision
            </span>
          </div>

          {directAdminPlacements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 font-mono">
              Zero direct internal placements created yet. Click "+ Direct DGG Placement" to assign an apprentice.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {directAdminPlacements.map((plc) => (
                <div
                  key={plc.id}
                  className="bg-white rounded-3xl border border-purple-200 p-6 shadow-sm space-y-4 bg-purple-50/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full block w-max mb-1">
                        Direct DGG Placement
                      </span>
                      <h4 className="text-base font-black text-slate-900">{plc.internName}</h4>
                      <p className="text-xs font-bold text-[#512d7c]">{plc.roleTitle}</p>
                    </div>
                    <Building className="w-5 h-5 text-[#512d7c]" />
                  </div>

                  <div className="p-3 bg-white border border-purple-100 rounded-2xl flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="block text-[8px] text-slate-400">Committed Term</span>
                      <span className="font-black text-slate-900">{plc.contractTerm.replace('_', ' ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-400">Monthly Compensation</span>
                      <span className="font-black text-emerald-700">₦{plc.preAgreedStipend.toLocaleString()} / mo</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetPlacement(plc);
                        setAdminRating(5);
                        setAdminReviewTitle('');
                        setAdminReviewComment('');
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2 bg-[#512d7c] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>Rate Intern as Supervisor ➔</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CANDIDATE EVALUATION & ATTENDANCE SCORING MODAL */}
      {showEvalModal && evalTargetIntern && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Academic Evaluation Board
                </span>
                <h3 className="font-black text-base text-slate-900">
                  Scores for {evalTargetIntern.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Card 4: Evaluated Incubation Tier
                </label>
                <select
                  value={evalTier}
                  onChange={(e) => setEvalTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="Apprentice (Newbie: 3-month trial)">
                    Apprentice &bull; 3 Months Free Runway
                  </option>
                  <option value="Associate (Intermediate: 2-month trial)">
                    Associate &bull; 2 Months Free Runway
                  </option>
                  <option value="Fellow (Pro: 1-month fast-track)">
                    Fellow &bull; 1 Month Free Fast-Track
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Card 1: Certified Sprint Attendance Score
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required
                    value={evalAttendance}
                    onChange={(e) => setEvalAttendance(e.target.value)}
                    placeholder="e.g. 100%, 98%, 95%"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                  <div className="flex space-x-1 shrink-0">
                    {['100%', '98%', '95%'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setEvalAttendance(val)}
                        className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono font-bold text-[11px] text-slate-700 cursor-pointer"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 block pt-1">
                  This exact score stamps the first badge on {evalTargetIntern.name}’s public portfolio dossier.
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Resulting Metric 1:</span>
                  <span className="font-bold text-emerald-700">{evalAttendance} Sprint Attendance</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Resulting Metric 4:</span>
                  <span className="font-bold text-slate-900">
                    {evalTier.includes('Fellow') ? '1 MO' : evalTier.includes('Associate') ? '2 MO' : '3 MO'} Trial Runway
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEvaluation}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{savingEvaluation ? 'Updating Badges...' : 'Save & Publish Candidate Scores ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIRECT DGG INTERNAL ASSIGNMENT DESK */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-[#512d7c]" />
                <h3 className="text-base font-black text-slate-900">
                  Assign Intern to DGG Internal Operations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectAdminAssign} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Candidate from Roster</label>
                <select
                  value={selectedInternId}
                  onChange={(e) => setSelectedInternId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.name} &bull; {intern.tier.split('(')[0].trim()} ({intern.track})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Internal Project / Sprint Role</label>
                <input
                  type="text"
                  required
                  value={adminRoleTitle}
                  onChange={(e) => setAdminRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Committed Contract Term</label>
                  <select
                    value={adminContractTerm}
                    onChange={(e) => setAdminContractTerm(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="6_MONTHS">6 Months Term</option>
                    <option value="1_YEAR">1 Year Term (Standard)</option>
                    <option value="2_YEARS">2 Years Term (Max Term)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Monthly Stipend (₦)</label>
                  <input
                    type="number"
                    min={50000}
                    max={500000}
                    step={5000}
                    value={adminStipend}
                    onChange={(e) => setAdminStipend(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct Admin placements instantly unlock workspace punch cards and establish Master Admin as the official reviewing supervisor.
              </p>

              <button
                type="submit"
                disabled={assigningAdmin}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{assigningAdmin ? 'Creating Direct Placement...' : 'Confirm Direct Internal Placement ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADMIN SUPERVISOR REVIEW & ENDORSEMENT SUBMISSION */}
      {showReviewModal && targetPlacement && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-purple-700">
                  Master Admin Supervisory Review
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Endorse {targetPlacement.internName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdminReview} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAdminRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= adminRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exemplary Sprint Punctuality and Architectural Rigor"
                  value={adminReviewTitle}
                  onChange={(e) => setAdminReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Institutional Endorsement</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Maintained 100% attendance consistency and delivered production-grade code..."
                  value={adminReviewComment}
                  onChange={(e) => setAdminReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                This endorsement carries the official DGG Master Operations stamp and will be pinned under the candidate's verified reviews section.
              </p>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>{submittingReview ? 'Stamping Endorsement...' : 'Stamp Institutional Endorsement ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}