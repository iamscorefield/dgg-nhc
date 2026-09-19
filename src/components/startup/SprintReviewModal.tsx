'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MilestoneReviewStatus } from '@/types/database.types';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Clock,
  Send
} from 'lucide-react';

interface MilestoneRecord {
  id: string;
  week_number: number;
  title: string;
  deliverable_url: string;
  intern_notes?: string;
  review_status: MilestoneReviewStatus;
  supervisor_feedback?: string;
  created_at: string;
  intern_name: string;
  intern_track: string;
}

interface SprintReviewModalProps {
  milestone: MilestoneRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedMilestone: MilestoneRecord) => void;
}

export default function SprintReviewModal({
  milestone,
  isOpen,
  onClose,
  onUpdated,
}: SprintReviewModalProps) {
  const [feedback, setFeedback] = useState(milestone?.supervisor_feedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !milestone) return null;

  const handleUpdateStatus = async (newStatus: MilestoneReviewStatus) => {
    setSubmitting(true);
    setErrorMsg('');

    try {
      const updatePayload: any = {
        review_status: newStatus,
        supervisor_feedback: feedback.trim(),
      };

      if (newStatus === 'APPROVED') {
        updatePayload.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sprint_milestones')
        .update(updatePayload)
        .eq('id', milestone.id);

      if (error) throw error;

      onUpdated({
        ...milestone,
        review_status: newStatus,
        supervisor_feedback: feedback.trim(),
        approved_at: newStatus === 'APPROVED' ? updatePayload.approved_at : undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update milestone review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#512d7c] bg-purple-50 px-2 py-0.5 rounded">
                Sprint Week {milestone.week_number}
              </span>
              <span className="text-xs font-mono text-slate-400">
                // {milestone.intern_track}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">{milestone.title}</h3>
            <p className="text-xs text-slate-500 font-medium">Candidate: {milestone.intern_name}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deliverable Link Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center space-x-1.5">
              <FileCode className="w-3.5 h-3.5 text-purple-700" />
              <span>Deliverable Artifact Submission</span>
            </span>
            <a
              href={milestone.deliverable_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#512d7c] hover:underline flex items-center space-x-1"
            >
              <span>Launch Proof URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 break-all select-all shadow-inner">
            {milestone.deliverable_url}
          </div>

          {milestone.intern_notes && (
            <div className="text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60 space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Intern Sprint Notes:</span>
              <p className="leading-relaxed">{milestone.intern_notes}</p>
            </div>
          )}
        </div>

        {/* Feedback Textarea */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Supervisor Evaluation Feedback & Directives
          </label>
          <textarea
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add specific comments on code quality, task deliverables, or needed modifications..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Logged: {new Date(milestone.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleUpdateStatus('REVISION_REQUESTED')}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Request Revision</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleUpdateStatus('APPROVED')}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#512d7c] hover:bg-[#3d1e63] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve Milestone</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}