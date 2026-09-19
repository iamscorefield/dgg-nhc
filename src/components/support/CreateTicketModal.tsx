'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DisputeCategory, DisputePriority } from '@/types/database.types';
import {
  X,
  LifeBuoy,
  AlertTriangle,
  Send,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorRole: 'startup' | 'intern';
  onCreated: () => void;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  creatorRole,
  onCreated,
}: CreateTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<DisputeCategory>('MILESTONE_DISPUTE');
  const [priority, setPriority] = useState<DisputePriority>('MEDIUM');
  const [initialMessage, setInitialMessage] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error('Not authenticated.');

      // 1. Create support ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          creator_id: authData.user.id,
          creator_role: creatorRole,
          subject: subject.trim(),
          category,
          priority,
          status: 'OPEN',
          admin_tagged: true,
        })
        .select('id')
        .single();

      if (ticketError) throw ticketError;

      // 2. Insert opening message into thread
      const { error: msgError } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: authData.user.id,
          sender_role: creatorRole,
          message_body: initialMessage.trim(),
          attachment_url: proofUrl.trim() || null,
        });

      if (msgError) throw msgError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onCreated();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 font-sans">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <LifeBuoy className="w-4 h-4 text-[#512d7c]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#512d7c]">
                Tripartite Dispute & Mediation Desk
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">Open Formal Case</h3>
            <p className="text-xs text-slate-500 font-medium">
              Submit dispute details. Platform administration will intervene directly in this thread.
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
            <h4 className="text-base font-black text-slate-900">Case Lodged & Admin Notified</h4>
            <p className="text-xs text-slate-500">
              Your ticket has been prioritized. The thread is active.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Subject / Summary</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Unresponsive supervisor on milestone review / Escrow dispute"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Dispute Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="MILESTONE_DISPUTE">Milestone Review & Proof Dispute</option>
                  <option value="PAYROLL_ESCROW">Escrow & Stipend Clarification</option>
                  <option value="COMMUNICATION">Communication & Protocol Breach</option>
                  <option value="GENERAL">General Support & Guidance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Urgency Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="LOW">Low - Routine clarification</option>
                  <option value="MEDIUM">Medium - Normal review pause</option>
                  <option value="HIGH">High - Imminent milestone deadline</option>
                  <option value="URGENT">Urgent - Escrow release dispute</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Detailed Case Description</label>
              <textarea
                rows={4}
                required
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Detail the timeline, specific expectations unfulfilled, and resolution requested..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Artifact Proof / Commit URL (Optional)
              </label>
              <input
                type="text"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://github.com/... or Google Drive proof link"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center space-x-2 text-purple-900">
              <ShieldCheck className="w-4 h-4 text-[#512d7c] shrink-0" />
              <span className="text-[11px] leading-snug">
                DGG Master Administration is automatically tagged and assigned arbitration oversight on this ticket.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
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
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Lodging Case...' : 'Submit Dispute'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}