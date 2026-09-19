'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import KanbanCandidateCard, { KanbanCandidate } from './KanbanCandidateCard';
import PerformanceEvaluationModal from './PerformanceEvaluationModal';
import { Bookmark, Send, PlayCircle, Award, RefreshCw } from 'lucide-react';

const COLUMNS = [
  {
    key: 'SHORTLISTED',
    title: 'Shortlisted Talent',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: Bookmark,
    nextStage: 'OFFER_EXTENDED',
    nextLabel: 'Extend Offer',
  },
  {
    key: 'OFFER_EXTENDED',
    title: 'Offers Extended',
    badgeColor: 'bg-amber-100 text-amber-800',
    icon: Send,
    nextStage: 'IN_TRIAL',
    nextLabel: 'Start Trial',
  },
  {
    key: 'IN_TRIAL',
    title: 'In Active Trial',
    badgeColor: 'bg-purple-100 text-purple-800',
    icon: PlayCircle,
    nextStage: 'RETAINED',
    nextLabel: 'Retain & Hire',
  },
  {
    key: 'RETAINED',
    title: 'Retained & Contracted',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    icon: Award,
    nextStage: null,
    nextLabel: null,
  },
];

export default function KanbanBoard() {
  const [candidates, setCandidates] = useState<KanbanCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [evalCandidate, setEvalCandidate] = useState<any | null>(null);
  const [evalModalOpen, setEvalModalOpen] = useState(false);

  const loadPipeline = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    const startupId = authData.user.id;

    // Direct placement fetch
    const { data: placements, error } = await supabase
      .from('placements')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching placements:', error);
      setLoading(false);
      return;
    }

    if (!placements || placements.length === 0) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    // Fetch intern profiles and user names in parallel to avoid nested relation failures
    const internIds = placements.map((p) => p.intern_id);

    const [{ data: internProfiles }, { data: profiles }] = await Promise.all([
      supabase.from('intern_profiles').select('id, subdomain_handle, specialization_track, tier').in('id', internIds),
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', internIds),
    ]);

    const formatted: KanbanCandidate[] = placements.map((pl: any) => {
      const intern = internProfiles?.find((ip) => ip.id === pl.intern_id);
      const userProf = profiles?.find((p) => p.id === pl.intern_id);

      let stage = pl.pipeline_stage;
      if (!stage || stage === 'BOOKMARKED') stage = 'SHORTLISTED';
      if (stage === 'INVITED') stage = 'OFFER_EXTENDED';
      if (stage === 'TRIAL_ACTIVE' || pl.status === 'ACTIVE') stage = 'IN_TRIAL';
      if (stage === 'HIRED_CONTRACTED' || pl.status === 'COMPLETED') stage = 'RETAINED';

      return {
        id: pl.id,
        intern_id: pl.intern_id,
        subdomain_handle: intern?.subdomain_handle || '',
        name: `${userProf?.first_name || 'Apprentice'} ${userProf?.last_name || ''}`.trim(),
        avatar_url: userProf?.avatar_url || '',
        track: intern?.specialization_track || 'Specialist',
        tier: pl.intern_tier || intern?.tier || 'Associate',
        trial_duration_months: pl.trial_duration_months || 2,
        pre_agreed_stipend: Number(pl.pre_agreed_stipend) || 150000,
        role_title: pl.role_title || 'Specialist Associate',
        pipeline_stage: stage,
      };
    });

    setCandidates(formatted);
    setLoading(false);
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleAdvanceStage = async (candidateId: string, currentStage: string) => {
    const colIndex = COLUMNS.findIndex((c) => c.key === currentStage);
    if (colIndex === -1 || colIndex >= COLUMNS.length - 1) return;
    const nextStage = COLUMNS[colIndex].nextStage;
    if (!nextStage) return;

    const newStatus =
      nextStage === 'IN_TRIAL'
        ? 'ACTIVE'
        : nextStage === 'RETAINED'
        ? 'COMPLETED'
        : 'INVITED';

    await supabase
      .from('placements')
      .update({
        pipeline_stage: nextStage,
        status: newStatus,
      })
      .eq('id', candidateId);

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, pipeline_stage: nextStage } : c))
    );
  };

  const handleOpenEvaluation = (cand: KanbanCandidate) => {
    setEvalCandidate({
      placementId: cand.id,
      internId: cand.intern_id,
      internName: cand.name,
      internTrack: cand.track,
      tier: cand.tier,
    });
    setEvalModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Talent Pipeline</h2>
          <p className="text-xs text-slate-500">
            Track candidates through discovery, probation runway, and retention.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPipeline}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Pipeline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const colCandidates = candidates.filter((c) => c.pipeline_stage === col.key);

          return (
            <div
              key={col.key}
              className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4 min-h-[480px] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ColIcon className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colCandidates.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colCandidates.length === 0 ? (
                  <div className="h-36 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                    No candidates
                  </div>
                ) : (
                  colCandidates.map((cand) => (
                    <KanbanCandidateCard
                      key={cand.id}
                      candidate={cand}
                      onAdvance={handleAdvanceStage}
                      onEvaluate={handleOpenEvaluation}
                      nextStageLabel={col.nextLabel || undefined}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PerformanceEvaluationModal
        candidate={evalCandidate}
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        onSubmitted={() => {
          setEvalModalOpen(false);
          loadPipeline();
        }}
      />
    </div>
  );
}