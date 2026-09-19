'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Clock, ChevronRight, Award } from 'lucide-react';

export interface KanbanCandidate {
  id: string; // placement_id or bookmark_id
  intern_id: string;
  subdomain_handle: string;
  name: string;
  avatar_url?: string;
  track: string;
  tier: string;
  trial_duration_months: number;
  pre_agreed_stipend: number;
  role_title?: string;
  pipeline_stage: string;
}

interface KanbanCandidateCardProps {
  candidate: KanbanCandidate;
  onAdvance?: (candidateId: string, currentStage: string) => void;
  onEvaluate?: (candidate: KanbanCandidate) => void;
  nextStageLabel?: string;
}

export default function KanbanCandidateCard({
  candidate,
  onAdvance,
  onEvaluate,
  nextStageLabel,
}: KanbanCandidateCardProps) {
  const canEvaluate =
    candidate.pipeline_stage === 'TRIAL_ACTIVE' ||
    candidate.pipeline_stage === 'HIRED_CONTRACTED';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 font-sans">
      {/* Top Identity Header */}
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#512d7c] font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-purple-200">
          {candidate.avatar_url ? (
            <img
              src={candidate.avatar_url}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{candidate.name ? candidate.name[0] : 'A'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-900 text-xs truncate">{candidate.name}</h4>
          <p className="text-[10px] text-slate-500 font-medium truncate">{candidate.track}</p>
          <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
            {candidate.tier}
          </span>
        </div>
      </div>

      {/* Trial Runway & Stipend Terms */}
      <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-[11px] font-mono border border-slate-100">
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Runway:</span>
          </span>
          <span className="font-bold text-slate-900">{candidate.trial_duration_months} Mo Trial</span>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span>Stipend:</span>
          <span className="font-bold text-slate-900">
            ₦{Number(candidate.pre_agreed_stipend || 0).toLocaleString()} / mo
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <Link
          href={`/portfolio/${candidate.subdomain_handle}`}
          target="_blank"
          className="text-[10px] text-[#512d7c] font-bold hover:underline flex items-center space-x-1"
        >
          <span>Dossier</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        <div className="flex items-center space-x-1.5">
          {canEvaluate && onEvaluate && (
            <button
              type="button"
              onClick={() => onEvaluate(candidate)}
              title="Submit Report Card"
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-200 transition-all flex items-center space-x-1 cursor-pointer"
            >
              <Award className="w-3 h-3 text-amber-600" />
              <span>Rate</span>
            </button>
          )}

          {onAdvance && nextStageLabel && (
            <button
              type="button"
              onClick={() => onAdvance(candidate.id, candidate.pipeline_stage)}
              className="px-2.5 py-1 bg-[#512d7c] hover:bg-[#3d1e63] text-white text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>{nextStageLabel}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}