'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { inspectAndFilterMessage } from '@/lib/moderation';
import {
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  Clock,
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  placement_id: string;
  sender_id: string;
  message: string;
  contains_restricted_contact?: boolean;
  created_at: string;
}

interface ChatThreadProps {
  placementId: string;
  internName: string;
  internTrack: string;
  currentUserId: string;
  isContractSigned: boolean;
}

export default function ChatThread({
  placementId,
  internName,
  internTrack,
  currentUserId,
  isContractSigned,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [warningNotice, setWarningNotice] = useState<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from('placement_messages')
        .select('*')
        .eq('placement_id', placementId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    }

    loadMessages();

    // Subscribe to live messages on this specific placement thread
    const channel = supabase
      .channel(`placement_chat_${placementId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'placement_messages',
          filter: `placement_id=eq.${placementId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [placementId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || sending) return;

    setSending(true);
    setWarningNotice(null);

    // Filter off-platform disintermediation attempts if formal contract isn't locked
    const moderation = inspectAndFilterMessage(inputVal, isContractSigned);

    if (moderation.hasRestrictedContent) {
      setWarningNotice(
        `Pre-Trial Safeguard: Direct contact details (${moderation.violations.join(', ')}) are masked until incubation terms and escrow lock.`
      );
    }

    const { error } = await supabase.from('placement_messages').insert({
      placement_id: placementId,
      sender_id: currentUserId,
      message: moderation.cleanText,
      contains_restricted_contact: moderation.hasRestrictedContent,
    });

    if (!error) {
      setInputVal('');
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm font-sans">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#512d7c] text-white font-bold flex items-center justify-center text-xs">
            {internName ? internName[0] : 'A'}
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900">{internName}</h3>
            <span className="text-[10px] font-mono text-purple-700 block">{internTrack}</span>
          </div>
        </div>

        <div>
          {isContractSigned ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              <span>CONTRACTED: DIRECT CONTACT CLEAR</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>PRE-TRIAL SAFEGUARDS ACTIVE</span>
            </span>
          )}
        </div>
      </div>

      {/* Message Feed Canvas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <p className="font-medium text-xs text-slate-500">Workspace conversation initiated.</p>
            <p className="text-[11px] max-w-xs text-slate-400">
              Coordinate sprint milestones, project expectations, and deliverable handoffs directly.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[75%] p-3.5 rounded-2xl leading-relaxed ${
                    isMe
                      ? 'bg-[#512d7c] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  {msg.contains_restricted_contact && (
                    <div className="mt-1 pt-1 border-t border-white/20 text-[9px] font-mono opacity-80 flex items-center space-x-1">
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>Filtered for pre-contract protection</span>
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-mono text-slate-400 px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={scrollAnchorRef} />
      </div>

      {/* Safety Alert Banner */}
      {warningNotice && (
        <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setWarningNotice(null)}
            className="text-amber-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Controls */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={
            isContractSigned
              ? 'Message candidate directly...'
              : 'Message candidate (In-app safe channel)...'
          }
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
        />

        <button
          type="submit"
          disabled={sending || !inputVal.trim()}
          className="px-4 py-2.5 bg-[#512d7c] hover:bg-[#3d1e63] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}