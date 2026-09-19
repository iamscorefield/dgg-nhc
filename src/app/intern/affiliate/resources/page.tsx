'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Play,
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';

interface Seminar {
  id: string;
  title: string;
  speaker: string;
  track: string;
  duration: string;
  date: string;
  description: string;
  videoUrl: string;
}

interface UpcomingBroadcast {
  id: string;
  title: string;
  speaker: string;
  date: string;
  time: string;
  rsvpLink: string;
}

interface PlaybookResource {
  id: string;
  title: string;
  fileType: string;
  fileSize: string;
  downloadUrl: string;
}

export default function LearningResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [activeSeminar, setActiveSeminar] = useState<Seminar | null>(null);
  const [upcomingBroadcasts, setUpcomingBroadcasts] = useState<UpcomingBroadcast[]>([]);
  const [playbooks, setPlaybooks] = useState<PlaybookResource[]>([]);

  const loadResourcesData = async () => {
    setLoading(true);

    try {
      // Parallel fetch from all 3 database tables managed by Admin
      const [
        { data: dbRecordings, error: recError },
        { data: dbBroadcasts, error: bCastError },
        { data: dbPlaybooks, error: pbError }
      ] = await Promise.all([
        supabase
          .from('masterclass_recordings')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('masterclass_broadcasts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('playbook_resources')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (recError) console.error('Recordings fetch error:', recError.message);
      if (bCastError) console.error('Broadcasts fetch error:', bCastError.message);
      if (pbError) console.error('Playbooks fetch error:', pbError.message);

      // 1. Process Masterclass Recordings
      if (dbRecordings && dbRecordings.length > 0) {
        const mappedSeminars: Seminar[] = dbRecordings.map((m: any) => ({
          id: m.id,
          title: m.title || 'Masterclass Session',
          speaker: m.speaker || 'Lead Facilitator',
          track: m.track || 'Specialization Track',
          duration: m.duration || '45 mins',
          date: m.recording_date || '2026',
          description: m.description || 'Executive technical architecture breakdown.',
          videoUrl: m.video_url || '',
        }));

        setSeminars(mappedSeminars);
        setActiveSeminar(mappedSeminars[0]);
      } else {
        setSeminars([]);
        setActiveSeminar(null);
      }

      // 2. Process Upcoming Live Masterclasses
      if (dbBroadcasts && dbBroadcasts.length > 0) {
        const mappedBroadcasts: UpcomingBroadcast[] = dbBroadcasts.map((b: any) => ({
          id: b.id,
          title: b.title,
          speaker: b.speaker,
          date: b.broadcast_date,
          time: b.broadcast_time,
          rsvpLink: b.rsvp_link,
        }));
        setUpcomingBroadcasts(mappedBroadcasts);
      } else {
        setUpcomingBroadcasts([]);
      }

      // 3. Process Downloadable Playbooks
      if (dbPlaybooks && dbPlaybooks.length > 0) {
        const mappedPlaybooks: PlaybookResource[] = dbPlaybooks.map((p: any) => ({
          id: p.id,
          title: p.title,
          fileType: p.file_type || 'PDF Guide',
          fileSize: p.file_size || '2.0 MB',
          downloadUrl: p.download_url,
        }));
        setPlaybooks(mappedPlaybooks);
      } else {
        setPlaybooks([]);
      }
    } catch (err) {
      console.error('Failed to load learning resources from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResourcesData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING ACADEMIC REPOSITORY & MASTERCLASSES...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Hero Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#512d7c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#512d7c]">
              DGG Masterclass Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seminars & Strategic Webinars
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Executive sessions from corporate practitioners. Stream deployed masterclasses covering modern tech stacks, software architecture, sales strategy, and enterprise operations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadResourcesData}
          title="Refresh Masterclass Stream"
          className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all cursor-pointer text-[#512d7c] self-start sm:self-center"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* TOP SECTION: Active Video Player Console + Digital Network Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Video Stream Window (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5 sm:p-6">
          <div className="aspect-video bg-[#0d0417] rounded-2xl relative flex items-center justify-center overflow-hidden shadow-inner">
            {activeSeminar?.videoUrl ? (
              <iframe
                src={activeSeminar.videoUrl}
                title={activeSeminar.title}
                className="w-full h-full rounded-2xl border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center p-6 space-y-2 text-white/70">
                <Video className="w-12 h-12 mx-auto text-purple-400/50" />
                <h4 className="text-sm font-black text-white">No Masterclass Recording Active</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto">
                  New technical webinars will be deployed here by the operations admin.
                </p>
              </div>
            )}
          </div>

          {activeSeminar ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase bg-[#f2b42c] text-slate-900 px-2 py-0.5 rounded">
                  FEATURED MASTERCLASS
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  {activeSeminar.date}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {activeSeminar.title}
              </h2>
              <p className="text-xs font-bold text-[#512d7c]">
                Led by {activeSeminar.speaker} &bull; {activeSeminar.track}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {activeSeminar.description}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 italic">
              Select any session from the archive below to begin streaming.
            </div>
          )}
        </div>

        {/* Digital Network Rules Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#3a1859] to-[#1e0a30] text-white rounded-3xl p-6 shadow-xl border border-purple-500/30 space-y-5">
          <div className="space-y-1 border-b border-white/10 pb-3">
            <h3 className="text-base font-extrabold flex items-center space-x-2 text-amber-300">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span>Digital Network Rules</span>
            </h3>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Every live broadcast cohort is monitored for quality control and peer-to-peer integrity.
            </p>
          </div>

          <div className="space-y-3 text-xs text-white/90">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Ensure microphone is muted upon entry to reduce background acoustic feedback.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Post questions inside the active Q&A desk. Facilitators address inquiries at designated intervals.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Session recordings are indexed to your portal archive within 4 hours post-broadcast.
              </p>
            </div>
          </div>

          {upcomingBroadcasts.length > 0 ? (
            <Link
              href={upcomingBroadcasts[0].rsvpLink}
              target="_blank"
              className="w-full py-3 bg-[#f2b42c] hover:bg-[#e0a21f] text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Join Next Live Cohort ➔</span>
            </Link>
          ) : (
            <div className="w-full py-2.5 bg-white/10 text-white/60 font-bold text-xs rounded-xl text-center font-mono">
              Next Cohort Date Pending
            </div>
          )}
        </div>
      </div>

      {/* SEMINAR ARCHIVE CONSOLE (3-Column Grid) */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-[#512d7c]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Seminar Archive Console ({seminars.length} Sessions)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any session to stream above
          </span>
        </div>

        {seminars.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">No Masterclasses Deployed Yet</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Webinars and technical architecture recordings published from the Admin Resources Desk will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {seminars.map((s, idx) => {
              const isPlaying = activeSeminar?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSeminar(s);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isPlaying
                      ? 'border-[#512d7c] ring-2 ring-[#512d7c]/20 bg-purple-50/20'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono text-xs font-black flex items-center justify-center">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {s.date}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 leading-snug">
                        {s.title}
                      </h3>
                      <p className="text-[11px] font-bold text-[#512d7c] mt-0.5">
                        {s.speaker}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{s.duration}</span>
                    </span>
                    <span className="text-[#512d7c] font-bold">
                      {isPlaying ? '● Playing' : 'Stream Session ➔'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPCOMING LIVE MASTERCLASSES (Database-Driven) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-[#ff7a00]" />
          <h3 className="text-sm font-extrabold text-slate-900">
            Upcoming Live Masterclass Broadcasts
          </h3>
        </div>

        <div className="space-y-3">
          {upcomingBroadcasts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-mono text-xs">
              No live broadcasts scheduled currently. Check back soon for the next cohort announcement!
            </div>
          ) : (
            upcomingBroadcasts.map((live) => (
              <div
                key={live.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase font-bold bg-[#f2b42c] text-slate-900 px-2 py-0.5 rounded">
                    LIVE BROADCAST
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{live.title}</h4>
                  <p className="text-[11px] text-slate-500">Organized by {live.speaker}</p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <div className="text-right font-mono text-[10px] text-slate-600">
                    <span className="block font-bold">{live.date}</span>
                    <span className="text-slate-400">{live.time}</span>
                  </div>
                  <Link
                    href={live.rsvpLink}
                    target="_blank"
                    className="px-3.5 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                  >
                    RSVP LINK
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CORE TAKEAWAYS & PLAYBOOK DOWNLOADS (Database-Driven) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-[#512d7c]" />
          <h3 className="text-sm font-extrabold text-slate-900">
            Core Takeaway Summaries & Index Assets
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {playbooks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-mono text-xs col-span-2">
              No summary decks or PDF playbooks published yet.
            </div>
          ) : (
            playbooks.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-slate-900 block">{item.title}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {item.fileType} &bull; {item.fileSize}
                  </span>
                </div>
                <Link
                  href={item.downloadUrl}
                  target="_blank"
                  className="p-2 bg-white border border-slate-200 text-slate-700 hover:text-[#512d7c] rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}