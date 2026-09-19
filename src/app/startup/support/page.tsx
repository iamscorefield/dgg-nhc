'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SupportTicket } from '@/types/database.types';
import CreateTicketModal from '@/components/support/CreateTicketModal';
import TicketThreadView from '@/components/support/TicketThreadView';
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function StartupSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(authData.user.id);

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('creator_id', authData.user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data);
      if (data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <LifeBuoy className="w-5 h-5 text-[#512d7c]" />
            <h1 className="text-xl font-black text-slate-900">Support & Dispute Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tripartite mediation between startup leadership, apprentices, and platform administration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#512d7c] hover:bg-[#3d1e63] text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Case</span>
          </button>

          <button
            type="button"
            onClick={loadTickets}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-900">Zero Active Disputes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All apprentice placements and sprint milestones are running normally. Open a case if you need escrow arbitration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Active Cases ({tickets.length})
            </span>

            <div className="space-y-2">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#512d7c] text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {t.category.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs truncate">{t.subject}</h4>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedTicket && (
              <TicketThreadView
                ticket={selectedTicket}
                currentUserId={currentUserId}
                currentUserRole="startup"
              />
            )}
          </div>
        </div>
      )}

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creatorRole="startup"
        onCreated={() => {
          setIsModalOpen(false);
          loadTickets();
        }}
      />
    </div>
  );
}