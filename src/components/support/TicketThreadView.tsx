'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SupportTicket, SupportTicketMessage } from '@/types/database.types';
import {
  ShieldAlert,
  ShieldCheck,
  Send,
  ExternalLink,
  Lock,
  Building,
  User,
  Clock
} from 'lucide-react';

interface TicketThreadViewProps {
  ticket: SupportTicket;
  currentUserId: string;
  currentUserRole: 'startup' | 'intern' | 'admin';
}

export default function TicketThreadView({
  ticket,
  currentUserId,
  currentUserRole,
}: TicketThreadViewProps) {
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadThread() {
      const { data } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    }

    loadThread();

    const channel = supabase
      .channel(`support_thread_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_ticket_messages',
          filter: `ticket_id=eq.${ticket.id}`,
        },
        (payload) => {
          const newMsg = payload.new as SupportTicketMessage;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);

    const { error } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: currentUserId,
      sender_role: currentUserRole,
      message_body: newMessage.trim(),
    });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const getSenderBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase">
          <ShieldCheck className="w-3 h-3" />
          <span>DGG Master Admin</span>
        </span>
      );
    }
    if (role === 'startup') {
      return (
        <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full uppercase">
          <Building className="w-3 h-3" />
          <span>Enterprise Founder</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase">
        <User className="w-3 h-3" />
        <span>Apprentice Candidate</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[650px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm font-sans">
      {/* Header */}
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 px-2 py-0.5 rounded text-slate-700">
              Case #{ticket.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              {ticket.category.replace('_', ' ')}
            </span>
          </div>
          <h3 className="font-extrabold text-sm text-slate-900 mt-1">{ticket.subject}</h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-emerald-600" />
            <span>Admin Active Mediation</span>
          </span>
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 text-xs">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isAdmin = msg.sender_role === 'admin';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isAdmin ? 'items-center my-3' : isMe ? 'items-end' : 'items-start'
              } space-y-1`}
            >
              <div className="flex items-center space-x-1.5 mb-0.5">
                {getSenderBadge(msg.sender_role)}
                <span className="text-[9px] font-mono text-slate-400">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-2xl leading-relaxed max-w-[80%] ${
                  isAdmin
                    ? 'bg-rose-50 border border-rose-200 text-rose-950 font-medium shadow-sm'
                    : isMe
                    ? 'bg-[#512d7c] text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.message_body}</p>

                {msg.attachment_url && (
                  <div className="mt-2 pt-2 border-t border-current/10">
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold underline hover:opacity-80"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Inspect Deliverable Proof</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Reply Input Box */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Respond in formal mediation thread..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
        />

        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2.5 bg-[#512d7c] hover:bg-[#3d1e63] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Reply</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}