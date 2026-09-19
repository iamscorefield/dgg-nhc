'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  MessageSquare,
  Users,
  ShieldCheck,
  Send,
  User,
  Clock,
  Sparkles,
  Building,
  RefreshCw
} from 'lucide-react';

interface CandidateContact {
  id: string; // placement_id
  intern_id: string;
  intern_name: string;
  role_title: string;
  intern_tier: string;
  status: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_role: 'intern' | 'startup' | 'admin' | 'system';
  sender_name: string;
  message_text: string;
  created_at: string;
}

export default function StartupMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Enterprise Supervisor');
  const [contacts, setContacts] = useState<CandidateContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<CandidateContact | null>(null);

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadContacts = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    const uid = authData.user.id;
    setCurrentUserId(uid);

    // Get company profile name
    const { data: startupProfile } = await supabase
      .from('startup_profiles')
      .select('company_name')
      .eq('id', uid)
      .maybeSingle();

    if (startupProfile?.company_name) {
      setCompanyName(startupProfile.company_name);
    }

    // Fetch placements for this startup
    const { data: placementsData, error } = await supabase
      .from('placements')
      .select('id, role_title, intern_tier, status, intern_id')
      .eq('startup_id', uid)
      .order('created_at', { ascending: false });

    if (!error && placementsData && placementsData.length > 0) {
      const internIds = Array.from(new Set(placementsData.map((p) => p.intern_id)));

      // Fetch profiles to get candidates' real names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', internIds);

      const nameMap: Record<string, string> = {};
      profilesData?.forEach((prof) => {
        nameMap[prof.id] = `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Apprentice Intern';
      });

      const formatted: CandidateContact[] = placementsData.map((p) => ({
        id: p.id,
        intern_id: p.intern_id,
        intern_name: nameMap[p.intern_id] || 'Apprentice Intern',
        role_title: p.role_title,
        intern_tier: p.intern_tier || 'Associate',
        status: p.status,
      }));

      setContacts(formatted);
      if (formatted.length > 0 && !selectedContact) {
        setSelectedContact(formatted[0]);
      }
    } else {
      setContacts([]);
    }

    setLoading(false);
  };

  // Load messages when selected contact changes
  const loadMessages = async (placementId: string) => {
    const { data } = await supabase
      .from('sprint_room_messages')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setMessages(data);
    } else {
      setMessages([
        {
          id: 'sys-start',
          sender_id: 'system',
          sender_role: 'system',
          sender_name: 'DGG Placement Daemon',
          message_text: 'Tripartite channel open. Real-time updates with intern and admin are logged here.',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id);

      // Realtime subscription for incoming intern messages
      const channel = supabase
        .channel(`sprint-room-${selectedContact.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sprint_room_messages',
            filter: `placement_id=eq.${selectedContact.id}`,
          },
          (payload) => {
            const incoming = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedContact]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedContact) return;

    setSending(true);
    const payload = {
      placement_id: selectedContact.id,
      sender_id: currentUserId,
      sender_role: 'startup',
      sender_name: `${companyName} (Supervisor)`,
      message_text: newMsg.trim(),
    };

    const { data, error } = await supabase
      .from('sprint_room_messages')
      .insert(payload)
      .select()
      .single();

    setSending(false);

    if (!error && data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setNewMsg('');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          INITIALIZING DIRECT WORKSPACE MESSAGES...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[#512d7c]" />
            <h1 className="text-xl font-black text-slate-900">Direct Workspace Messages</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tripartite communication channel with active apprentice candidates and platform administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={loadContacts}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Threads</span>
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
          <Users className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-600 font-bold">No candidate threads active.</p>
          <p className="text-[11px] text-slate-400">
            Extend an incubation trial offer to open a dedicated communication thread.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Candidates Sidebar List (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 block">
              Active Candidate Channels ({contacts.length})
            </span>

            <div className="space-y-2">
              {contacts.map((contact) => {
                const isSelected = selectedContact?.id === contact.id;

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#512d7c] text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h4 className="font-bold text-xs truncate">{contact.intern_name}</h4>
                      </div>
                      <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {contact.role_title}
                      </p>
                      <span
                        className={`inline-block text-[9px] font-mono font-bold mt-1.5 px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {contact.intern_tier}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Conversation Desk (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[600px] overflow-hidden">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#512d7c] text-white flex items-center justify-center font-bold text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-900">{selectedContact.intern_name}</h3>
                      <span className="text-[10px] text-slate-500 block">
                        {selectedContact.role_title} • Tripartite Sprint Channel
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-600 font-mono text-[10px] font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Monitored</span>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                  {messages.map((msg) => {
                    if (msg.sender_role === 'system') {
                      return (
                        <div key={msg.id} className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-0.5">
                          <span className="text-[9px] font-mono uppercase font-bold text-[#512d7c] block">
                            {msg.sender_name}
                          </span>
                          <p className="text-[11px] text-slate-700 leading-tight">{msg.message_text}</p>
                          <span className="text-[8px] font-mono text-slate-400 block">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    }

                    const isSelf = msg.sender_role === 'startup';

                    return (
                      <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-mono text-slate-400 px-1 mb-0.5">{msg.sender_name}</span>
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                            isSelf
                              ? 'bg-[#512d7c] text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.message_text}</p>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Message Input Box */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder={`Message ${selectedContact.intern_name}...`}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMsg.trim()}
                    className="p-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Select a candidate from the left list to begin messaging.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}