'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Bot,
  Sparkles,
  Send,
  Users,
  Code2,
  Briefcase,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  X
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface Channel {
  id: string;
  title: string;
  description: string;
}

interface CommunityMessage {
  id: string;
  author_name: string;
  role: string;
  content: string;
  created_at: string;
}

export default function AIHelpPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your DGG AI Assistant. I am here to help you navigate your dashboard tabs, track your affiliate earnings, explain how your 10% Naira (₦) escrow milestone works, or guide you through DGG's services in Lagos and Abeokuta. What can I help you sort out today?",
      time: 'Just now',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Apprentice' });

  // Community State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [channelMessages, setChannelMessages] = useState<CommunityMessage[]>([]);
  const [newChannelMsg, setNewChannelMsg] = useState('');
  const [sendingChannelMsg, setSendingChannelMsg] = useState(false);
  const channelChatBottomRef = useRef<HTMLDivElement>(null);

  // Ticket Modal State
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', authData.user.id)
          .maybeSingle();

        setCurrentUser({
          id: authData.user.id,
          name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Apprentice',
        });
      }

      const { data: chData } = await supabase
        .from('community_channels')
        .select('*')
        .order('created_at', { ascending: true });

      setChannels(chData || []);
    }
    init();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    channelChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages]);

  const handleOpenChannel = async (channel: Channel) => {
    setActiveChannel(channel);
    const { data: msgs } = await supabase
      .from('community_messages')
      .select('*')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: true });

    setChannelMessages(msgs || []);
  };

  const handleSendChannelMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelMsg.trim() || !activeChannel || !currentUser.id) return;

    setSendingChannelMsg(true);
    const payload = {
      channel_id: activeChannel.id,
      user_id: currentUser.id,
      author_name: currentUser.name,
      role: 'intern',
      content: newChannelMsg.trim(),
    };

    const { data, error } = await supabase
      .from('community_messages')
      .insert([payload])
      .select();

    setSendingChannelMsg(false);
    if (!error && data) {
      setChannelMessages((prev) => [...prev, data[0]]);
      setNewChannelMsg('');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          userContext: { internName: currentUser.name },
        }),
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: "I'm having trouble connecting right now. Please check your sprint instructions or reach out to a facilitator directly.",
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDispatchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage || !currentUser.id) return;

    setSubmittingTicket(true);
    const { error } = await supabase.from('facilitator_tickets').insert([
      {
        intern_id: currentUser.id,
        intern_name: currentUser.name,
        subject: ticketSubject,
        message: ticketMessage,
        status: 'OPEN',
      },
    ]);

    setSubmittingTicket(false);

    if (error) {
      alert(`Submission error: ${error.message}`);
      return;
    }

    setTicketSuccess(true);
    setTicketSubject('');
    setTicketMessage('');
    setTimeout(() => {
      setTicketSuccess(false);
      setTicketModalOpen(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Autonomous Copilot & Cohort Commons
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Community & AI Help Terminal
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Get context-aware solutions from your Technical Copilot, engage in group discussions, or escalate blockers directly to facilitators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Copilot Chat (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[640px] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#512d7c] text-[#f2b42c] flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">DGG AI Assistant</h3>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online & System-Aware</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: 'welcome',
                    sender: 'assistant',
                    text: 'Chat history cleared. What else can I help you build or explain?',
                    time: 'Just now',
                  },
                ])
              }
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-[#512d7c] text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
                <Bot className="w-4 h-4 animate-bounce text-[#512d7c]" />
                <span className="font-mono text-[11px] animate-pulse">Copilot is formulating response...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center space-x-2 overflow-x-auto text-[11px]">
            <span className="text-slate-400 font-bold shrink-0">Suggestions:</span>
            {[
              'What is DGG & its 4 Pillars?',
              'How do 10% Naira (₦) escrow payouts work?',
              'How do I withdraw affiliate earnings to my bank?',
              'How do I access DGG Academy & sprint tracks?',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-[#512d7c] border border-slate-200 rounded-lg shrink-0 font-medium cursor-pointer transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 border-t border-slate-200 bg-white flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about DGG, Next.js, or your placement sprints..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="px-4 py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white rounded-xl shadow-sm cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Community & Tickets (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#ff7a00]" />
                <span>Cohort Community Channels</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any channel to join real-time group discussions.
              </p>
            </div>

            <div className="space-y-3">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => handleOpenChannel(ch)}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-2xl flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-slate-900 group-hover:text-[#512d7c] block">
                      {ch.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block line-clamp-1">
                      {ch.description}
                    </span>
                  </div>
                  <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-[#512d7c] shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50/60 border border-purple-100 rounded-3xl p-6 text-xs space-y-3">
            <div className="flex items-center space-x-2 text-[#512d7c] font-extrabold">
              <ShieldCheck className="w-4 h-4" />
              <span>Facilitator Escalation Desk</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Need direct review on an enterprise placement agreement, stipend delay, or LMS issue? Facilitators review tickets within 24 hours.
            </p>
            <button
              type="button"
              onClick={() => setTicketModalOpen(true)}
              className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Open Facilitator Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Community Channel Popup */}
      {activeChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl flex flex-col h-[580px] border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Cohort Channel
                </span>
                <h3 className="text-sm font-black text-slate-900">{activeChannel.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveChannel(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9fc]">
              {channelMessages.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-mono">
                  No messages yet. Send a message to start discussion!
                </div>
              ) : (
                channelMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      msg.role === 'admin'
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-white border border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                        <span>{msg.author_name}</span>
                        {msg.role === 'admin' && (
                          <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono font-bold">
                            FACILITATOR
                          </span>
                        )}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={channelChatBottomRef} />
            </div>

            <form onSubmit={handleSendChannelMessage} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
              <input
                type="text"
                required
                value={newChannelMsg}
                onChange={(e) => setNewChannelMsg(e.target.value)}
                placeholder={`Post to #${activeChannel.title}...`}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
              <button
                type="submit"
                disabled={sendingChannelMsg}
                className="px-4 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Escalation & Facilitator Desk
                </span>
                <h3 className="text-base font-black text-slate-900">Open Priority Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ticketSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Ticket Dispatched!</h4>
                <p className="text-xs text-slate-500">
                  Your ticket has been sent to the admin portal. An assigned facilitator will review it during scheduled office hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDispatchTicket} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Subject / Issue Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Escrow disbursement query or Milestone 2 review delay"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Message & Context</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide specific details, sprint numbers, or enterprise details..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingTicket ? 'Recording in Database...' : 'Dispatch Ticket ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}