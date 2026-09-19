'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  X,
  Star,
  Award,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck
} from 'lucide-react';

interface EvaluationCandidate {
  placementId: string;
  internId: string;
  internName: string;
  internTrack: string;
  tier: string;
}

interface PerformanceEvaluationModalProps {
  candidate: EvaluationCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function PerformanceEvaluationModal({
  candidate,
  isOpen,
  onClose,
  onSubmitted,
}: PerformanceEvaluationModalProps) {
  const [punctuality, setPunctuality] = useState(5);
  const [technical, setTechnical] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [autonomy, setAutonomy] = useState(5);
  const [endorsement, setEndorsement] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsement.trim()) {
      setErrorMsg('Please provide a written endorsement or performance feedback.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error('Not authenticated.');

      const { error } = await supabase
        .from('intern_performance_evaluations')
        .insert({
          placement_id: candidate.placementId,
          startup_id: authData.user.id,
          intern_id: candidate.internId,
          punctuality_score: punctuality,
          technical_score: technical,
          communication_score: communication,
          autonomy_score: autonomy,
          written_endorsement: endorsement.trim(),
          is_public_on_dossier: isPublic,
        });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onSubmitted) onSubmitted();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report card.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (score: number, setScore: (val: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setScore(star)}
          className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
        >
          <Star
            className={`w-4 h-4 ${
              star <= score ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`}
          />
        </button>
      ))}
      <span className="font-mono text-xs font-bold text-slate-700 ml-1.5">{score}.0</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#512d7c]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#512d7c]">
                Enterprise Scorecard & Matrix
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              Rate {candidate.internName}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {candidate.internTrack} &bull; {candidate.tier}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-base font-black text-slate-900">Scorecard Submitted</h4>
            <p className="text-xs text-slate-500">
              Evaluation saved and synced to official candidate records.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 4 Performance Pillars */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Sprint Punctuality</span>
                  <span className="text-[10px] text-slate-500">Milestone timing & attendance</span>
                </div>
                {renderStarRating(punctuality, setPunctuality)}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <div>
                  <span className="font-bold text-slate-900 block">Technical Execution</span>
                  <span className="text-[10px] text-slate-500">Code quality, bugs, architecture</span>
                </div>
                {renderStarRating(technical, setTechnical)}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <div>
                  <span className="font-bold text-slate-900 block">Team Communication</span>
                  <span className="text-[10px] text-slate-500">Updates, responsiveness, clarity</span>
                </div>
                {renderStarRating(communication, setCommunication)}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                <div>
                  <span className="font-bold text-slate-900 block">Problem-Solving Autonomy</span>
                  <span className="text-[10px] text-slate-500">Initiative without handholding</span>
                </div>
                {renderStarRating(autonomy, setAutonomy)}
              </div>
            </div>

            {/* Written Endorsement */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">
                Official Enterprise Recommendation & Endorsement
              </label>
              <textarea
                rows={3}
                required
                value={endorsement}
                onChange={(e) => setEndorsement(e.target.value)}
                placeholder="Detail the apprentice's contributions, key strengths, and production impact during their sprints..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            {/* Public Portfolio Visibility Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-purple-50/60 border border-purple-100 rounded-xl">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#512d7c]" />
                <div>
                  <span className="font-bold text-slate-900 block text-[11px]">
                    Publish on Public Portfolio Dossier
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Displays under Verified Enterprise Reviews
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-[#512d7c] rounded border-slate-300 focus:ring-[#512d7c] cursor-pointer"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#512d7c] hover:bg-[#3d1e63] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting Scorecard...' : 'Submit Evaluation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}