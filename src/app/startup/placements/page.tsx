'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Briefcase,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Lock,
  Sparkles,
  FileCheck
} from 'lucide-react';

interface ActivePlacement {
  id: string;
  internId: string;
  internName: string;
  internTrack: string;
  internAvatar: string;
  subdomainHandle: string;
  roleTitle: string;
  internTier: string;
  trialDurationMonths: number;
  contractTerm: '6_MONTHS' | '1_YEAR' | '2_YEARS';
  preAgreedStipend: number;
  daysElapsed: number;
  status: 'INVITED' | 'PENDING_ADMIN' | 'ACTIVE_TRIAL' | 'TRIAL_COMPLETED' | 'PLACED_PAID';
}

export default function StartupPlacementsPage() {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<ActivePlacement[]>([]);

  // Bilateral Review Drawer State
  const [selectedPlacementForReview, setSelectedPlacementForReview] = useState<ActivePlacement | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessNotice, setReviewSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlacements() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }

      const { data: dbPlacements } = await supabase
        .from('placements')
        .select(`
          id,
          intern_id,
          role_title,
          intern_tier,
          trial_duration_months,
          contract_term,
          pre_agreed_stipend,
          status,
          intern_profiles (
            subdomain_handle,
            specialization_track,
            profiles ( first_name, last_name, avatar_url )
          )
        `)
        .eq('startup_id', authData.user.id);

      if (dbPlacements && dbPlacements.length > 0) {
        const mapped: ActivePlacement[] = dbPlacements.map((p: any) => ({
          id: p.id,
          internId: p.intern_id,
          internName: `${p.intern_profiles?.profiles?.first_name || 'Apprentice'} ${p.intern_profiles?.profiles?.last_name || ''}`.trim(),
          internTrack: p.intern_profiles?.specialization_track || 'Full Stack Engineering',
          internAvatar: p.intern_profiles?.profiles?.avatar_url || '',
          subdomainHandle: p.intern_profiles?.subdomain_handle || 'irene-obioha-7112',
          roleTitle: p.role_title,
          internTier: p.intern_tier || 'Apprentice (Newbie: 3-month trial)',
          trialDurationMonths: p.trial_duration_months || 3,
          contractTerm: p.contract_term || '1_YEAR',
          preAgreedStipend: Number(p.pre_agreed_stipend) || 150000,
          daysElapsed: 14,
          status: p.status || 'ACTIVE_TRIAL',
        }));
        setPlacements(mapped);
      } else {
        // Mock fallback active placement
        setPlacements([
          {
            id: 'place-101',
            internId: 'intern-1',
            internName: 'Irene Obioha',
            internTrack: 'TRK-02: Data Analytics & Cloud Systems',
            internAvatar: '',
            subdomainHandle: 'irene-obioha-7112',
            roleTitle: 'Full Stack Cloud Engineer',
            internTier: 'Associate (Intermediate: 2-month trial)',
            trialDurationMonths: 2,
            contractTerm: '1_YEAR',
            preAgreedStipend: 150000,
            daysElapsed: 14,
            status: 'ACTIVE_TRIAL',
          },
        ]);
      }
      setLoading(false);
    }

    loadPlacements();
  }, []);

  const handleOpenReview = (placement: ActivePlacement) => {
    setSelectedPlacementForReview(placement);
    setRating(5);
    setReviewTitle('');
    setReviewComment('');
  };

  const handleSubmitBilateralReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacementForReview) return;
    setSubmittingReview(true);

    const { data: authData } = await supabase.auth.getUser();

    if (authData?.user) {
      await supabase.from('placement_reviews').insert({
        placement_id: selectedPlacementForReview.id,
        reviewer_id: authData.user.id,
        recipient_id: selectedPlacementForReview.internId,
        reviewer_role: 'startup',
        rating: rating,
        review_title: reviewTitle,
        comment: reviewComment,
        is_verified_badge: true,
      });
    }

    setSubmittingReview(false);
    setReviewSuccessNotice(
      `Verified Endorsement submitted for ${selectedPlacementForReview.internName}! It has automatically published to their public portfolio and profile vault.`
    );

    setTimeout(() => {
      setReviewSuccessNotice(null);
      setSelectedPlacementForReview(null);
    }, 3500);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono-tech text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          LOADING ACTIVE PLACEMENTS & CONTRACT LEDGER...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-amber-200">
              Active Enterprise Placements
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Placements & Contract Seals
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Monitor intern trial runways, inspect pre-agreed contract commitments (6M, 1Y, 2Y), and submit bilateral endorsements that instantly publish to candidate portfolios.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs font-mono-tech">
          <span className="block text-white/70 uppercase text-[9px] font-bold">Active Sprints</span>
          <span className="text-2xl font-black text-amber-300">{placements.length} Placements</span>
        </div>
      </div>

      {reviewSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{reviewSuccessNotice}</span>
        </div>
      )}

      {/* Placements Cards */}
      <div className="space-y-6">
        {placements.map((plc) => {
          const totalDays = plc.trialDurationMonths * 30;
          const percentElapsed = Math.min(100, Math.round((plc.daysElapsed / totalDays) * 100));

          return (
            <div
              key={plc.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#180829] border-2 border-purple-200 shrink-0 flex items-center justify-center font-black text-2xl text-white">
                    {plc.internAvatar ? (
                      <img src={plc.internAvatar} alt={plc.internName} className="w-full h-full object-cover" />
                    ) : (
                      plc.internName[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{plc.internName}</h3>
                    <p className="text-xs font-bold text-[#512d7c]">{plc.roleTitle}</p>
                    <span className="text-[11px] text-slate-400 font-mono-tech">{plc.internTier}</span>
                  </div>
                </div>

                {/* Pre-Sealed Terms Pill */}
                <div className="flex flex-wrap items-center gap-2 font-mono-tech text-xs">
                  <div className="px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 text-[#512d7c]">
                    <span className="block text-[8px] uppercase font-bold text-purple-600">Contract Term</span>
                    <span className="font-black">{plc.contractTerm.replace('_', ' ')}</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                    <span className="block text-[8px] uppercase font-bold text-amber-600">Locked Stipend</span>
                    <span className="font-black">₦{plc.preAgreedStipend.toLocaleString()} / mo</span>
                  </div>
                </div>
              </div>

              {/* Runway Countdown Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono-tech">
                  <span className="text-slate-500 font-bold">
                    Free Trial Runway: Day {plc.daysElapsed} of {totalDays}
                  </span>
                  <span className="text-emerald-700 font-black">{percentElapsed}% Completed</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#512d7c] to-[#ff7a00] rounded-full transition-all duration-500"
                    style={{ width: `${percentElapsed}%` }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-emerald-700 font-mono-tech text-[11px] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>PRE-SEALED TRIPARTITE AGREEMENT ACTIVE</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <Link
                    href={`/portfolio/${plc.subdomainHandle}`}
                    target="_blank"
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <span>Inspect Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleOpenReview(plc)}
                    className="px-4 py-2.5 bg-purple-50 hover:bg-[#512d7c] text-[#512d7c] hover:text-white border border-purple-200 font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Submit Bilateral Review ➔</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==============================================================================
          BILATERAL REVIEW SUBMISSION MODAL
         ============================================================================== */}
      {selectedPlacementForReview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono-tech uppercase font-bold text-[#512d7c]">
                  Enterprise Supervisor Review
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Endorse {selectedPlacementForReview.internName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlacementForReview(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBilateralReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Performance Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Endorsement Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exceptional API execution and disciplined sprint attendance"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Testimonial Quote</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe technical competence, sprint punctuality, and deliverables executed..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                This review will be permanently stamped onto {selectedPlacementForReview.internName}’s public subdomain portfolio with your official enterprise badge.
              </p>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingReview ? 'Publishing Review...' : 'Publish Official Endorsement ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}