'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  FileText,
  Video,
  Users,
  ShieldCheck,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Play
} from 'lucide-react';

interface Recording {
  id: string;
  title: string;
  speaker: string;
  track: string;
  duration: string;
  recording_date: string;
  description: string;
  video_url: string;
}

interface Broadcast {
  id: string;
  title: string;
  speaker: string;
  broadcast_date: string;
  broadcast_time: string;
  rsvp_link: string;
}

interface Playbook {
  id: string;
  title: string;
  file_type: string;
  file_size: string;
  download_url: string;
}

interface CommunityChannel {
  id: string;
  title: string;
  description: string;
}

interface FacilitatorTicket {
  id: string;
  intern_name: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminResourcesPublishingDesk() {
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [tickets, setTickets] = useState<FacilitatorTicket[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Video Form State
  const [newVideo, setNewVideo] = useState({
    title: '',
    speaker: '',
    track: 'Full Stack Architecture',
    duration: '45 mins',
    recording_date: 'Sep 2026',
    description: '',
    video_url: '',
  });

  // Broadcast Form State
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    speaker: '',
    broadcast_date: '',
    broadcast_time: '',
    rsvp_link: '',
  });

  // Playbook Form State
  const [newPlaybook, setNewPlaybook] = useState({
    title: '',
    file_type: 'PDF Guide',
    file_size: '1.8 MB',
    download_url: '',
  });

  // New Channel Form State
  const [newChannel, setNewChannel] = useState({
    title: '',
    description: '',
  });

  // Converts regular YouTube URLs into embed URLs
  const formatYoutubeEmbed = (url: string) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: rData },
        { data: bData },
        { data: pData },
        { data: chData },
        { data: tData }
      ] = await Promise.all([
        supabase.from('masterclass_recordings').select('*').order('created_at', { ascending: false }),
        supabase.from('masterclass_broadcasts').select('*').order('created_at', { ascending: false }),
        supabase.from('playbook_resources').select('*').order('created_at', { ascending: false }),
        supabase.from('community_channels').select('*').order('created_at', { ascending: true }),
        supabase.from('facilitator_tickets').select('*').order('created_at', { ascending: false }),
      ]);

      setRecordings(rData || []);
      setBroadcasts(bData || []);
      setPlaybooks(pData || []);
      setChannels(chData || []);
      setTickets(tData || []);
    } catch (err) {
      console.error('Failed to load admin resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Video Handlers
  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.video_url) return;

    const payload = {
      ...newVideo,
      video_url: formatYoutubeEmbed(newVideo.video_url),
    };

    const { data, error } = await supabase
      .from('masterclass_recordings')
      .insert([payload])
      .select();

    if (error) {
      alert(`Error publishing video: ${error.message}`);
      return;
    }

    if (data) setRecordings([data[0], ...recordings]);
    setNewVideo({
      title: '',
      speaker: '',
      track: 'Full Stack Architecture',
      duration: '45 mins',
      recording_date: 'Sep 2026',
      description: '',
      video_url: '',
    });
    setNotice('Masterclass video deployed to apprentice portal.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteVideo = async (id: string) => {
    const { error } = await supabase.from('masterclass_recordings').delete().eq('id', id);
    if (error) {
      alert(`Delete error: ${error.message}`);
      return;
    }
    setRecordings(recordings.filter((r) => r.id !== id));
  };

  // 2. Broadcast Handlers
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcast.title || !newBroadcast.rsvp_link) return;

    const { data, error } = await supabase
      .from('masterclass_broadcasts')
      .insert([newBroadcast])
      .select();

    if (error) {
      alert(`Error publishing broadcast: ${error.message}`);
      return;
    }

    if (data) setBroadcasts([data[0], ...broadcasts]);
    setNewBroadcast({ title: '', speaker: '', broadcast_date: '', broadcast_time: '', rsvp_link: '' });
    setNotice('Live Masterclass broadcast scheduled and live on student portals.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteBroadcast = async (id: string) => {
    const { error } = await supabase.from('masterclass_broadcasts').delete().eq('id', id);
    if (error) {
      alert(`Delete error: ${error.message}`);
      return;
    }
    setBroadcasts(broadcasts.filter((b) => b.id !== id));
  };

  // 3. Playbook Handlers
  const handleCreatePlaybook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaybook.title || !newPlaybook.download_url) return;

    const { data, error } = await supabase
      .from('playbook_resources')
      .insert([newPlaybook])
      .select();

    if (error) {
      alert(`Error adding playbook: ${error.message}`);
      return;
    }

    if (data) setPlaybooks([data[0], ...playbooks]);
    setNewPlaybook({ title: '', file_type: 'PDF Guide', file_size: '1.8 MB', download_url: '' });
    setNotice('Playbook guide indexed for apprentice download.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeletePlaybook = async (id: string) => {
    const { error } = await supabase.from('playbook_resources').delete().eq('id', id);
    if (error) {
      alert(`Delete error: ${error.message}`);
      return;
    }
    setPlaybooks(playbooks.filter((p) => p.id !== id));
  };

  // 4. Channel Handlers
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.title) return;

    const { data, error } = await supabase
      .from('community_channels')
      .insert([newChannel])
      .select();

    if (error) {
      alert(`Error creating channel: ${error.message}`);
      return;
    }

    if (data) setChannels([...channels, data[0]]);
    setNewChannel({ title: '', description: '' });
    setNotice('New cohort channel deployed for student discussions.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteChannel = async (id: string) => {
    const { error } = await supabase.from('community_channels').delete().eq('id', id);
    if (error) {
      alert(`Delete error: ${error.message}`);
      return;
    }
    setChannels(channels.filter((c) => c.id !== id));
  };

  // 5. Ticket Handlers
  const handleResolveTicket = async (id: string) => {
    const { error } = await supabase
      .from('facilitator_tickets')
      .update({ status: 'RESOLVED' })
      .eq('id', id);

    if (error) {
      alert(`Update error: ${error.message}`);
      return;
    }

    setTickets(tickets.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' } : t)));
    setNotice('Escalation ticket marked as resolved.');
    setTimeout(() => setNotice(null), 3000);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING RESOURCE ASSETS DESK...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f041d] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Masterclass, Community & Support Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Learning, Assets & Cohort Community Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Deploy YouTube masterclass sessions into the 3-column archive, schedule live webinar rooms, create cohort channels, and resolve apprentice support tickets.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          title="Refresh Hub"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white self-start md:self-center"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* SECTION 1: MASTERCLASS VIDEO DEPLOYMENT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-[#512d7c]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Deploy Recorded Masterclass Video
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {recordings.length} Active in Archive
          </span>
        </div>

        <form onSubmit={handleCreateVideo} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Session Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scaling B2B Tech Outreach in 2026"
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Speaker / Instructor</label>
            <input
              type="text"
              required
              placeholder="e.g. Scorefield Sells"
              value={newVideo.speaker}
              onChange={(e) => setNewVideo({ ...newVideo, speaker: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Specialization Track</label>
            <input
              type="text"
              required
              placeholder="e.g. Infrastructure & Next.js Core"
              value={newVideo.track}
              onChange={(e) => setNewVideo({ ...newVideo, track: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Session Duration</label>
            <input
              type="text"
              required
              placeholder="e.g. 52 mins"
              value={newVideo.duration}
              onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Date Tag</label>
            <input
              type="text"
              required
              placeholder="e.g. Sep 18, 2026"
              value={newVideo.recording_date}
              onChange={(e) => setNewVideo({ ...newVideo, recording_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">YouTube URL (Standard or Embed)</label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-slate-700 font-bold mb-1">Session Summary Description</label>
            <textarea
              required
              rows={2}
              placeholder="Provide a 1-2 sentence breakdown of key concepts and architectures covered."
              value={newVideo.description}
              onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Deploy Video to Student Portals</span>
            </button>
          </div>
        </form>

        {/* Existing Video Cards */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-xs font-mono uppercase font-bold text-slate-400 block">
            Published Archive Videos ({recordings.length})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recordings.map((rec) => (
              <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2 text-xs">
                <div>
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                    <span>{rec.duration}</span>
                    <span>{rec.recording_date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1">{rec.title}</h4>
                  <p className="text-[11px] text-[#512d7c] font-semibold">{rec.speaker} &bull; {rec.track}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <a href={rec.video_url} target="_blank" rel="noreferrer" className="text-[#512d7c] font-bold inline-flex items-center space-x-1 hover:underline text-[11px]">
                    <span>Check Video</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(rec.id)}
                    className="text-rose-500 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2 & 3: LIVE BROADCASTS & PLAYBOOKS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LIVE BROADCASTS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-[#ff7a00]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Schedule Live Masterclass Broadcast
            </h2>
          </div>

          <form onSubmit={handleCreateBroadcast} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Session Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Predictive B2B Pipeline Nurturing"
                value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Speaker / Lead</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scorefield Sells"
                  value={newBroadcast.speaker}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, speaker: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Broadcast Date</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sep 20, 2026"
                  value={newBroadcast.broadcast_date}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, broadcast_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Time (WAT)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 04:00 PM WAT"
                  value={newBroadcast.broadcast_time}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, broadcast_time: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">RSVP / Room Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://meet.google.com/..."
                  value={newBroadcast.rsvp_link}
                  onChange={(e) => setNewBroadcast({ ...newBroadcast, rsvp_link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3d205e] text-white font-bold rounded-xl shadow transition-all cursor-pointer"
            >
              Publish Live Broadcast
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 block">
              Active Broadcasts ({broadcasts.length})
            </span>
            {broadcasts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No scheduled broadcasts.</p>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{b.title}</h4>
                    <p className="text-[11px] text-slate-500">{b.speaker} &bull; {b.broadcast_date} ({b.broadcast_time})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteBroadcast(b.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DOWNLOADABLE PLAYBOOKS */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-[#512d7c]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Publish Downloadable Playbook Resource
            </h2>
          </div>

          <form onSubmit={handleCreatePlaybook} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Playbook / Guide Title</label>
              <input
                type="text"
                required
                placeholder="e.g. B2B Lead Generation & Pipeline Playbook"
                value={newPlaybook.title}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-bold mb-1">File Type</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PDF Guide"
                  value={newPlaybook.file_type}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, file_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">File Size</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.4 MB"
                  value={newPlaybook.file_size}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, file_size: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Download / Asset URL</label>
              <input
                type="url"
                required
                placeholder="https://drive.google.com/... or Supabase storage link"
                value={newPlaybook.download_url}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, download_url: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#ff7a00] hover:bg-[#e06b00] text-white font-bold rounded-xl shadow transition-all cursor-pointer"
            >
              Publish Playbook Asset
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 block">
              Indexed Downloadable Assets ({playbooks.length})
            </span>
            {playbooks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No playbooks uploaded.</p>
            ) : (
              playbooks.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{p.title}</h4>
                    <p className="text-[11px] text-slate-500">{p.file_type} &bull; {p.file_size}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePlaybook(p.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: COHORT COMMUNITY CHANNELS & FACILITATOR TICKETS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6 pt-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-[#512d7c]" />
            <h2 className="text-base font-extrabold text-slate-900">
              Cohort Channels & Apprentice Support Tickets
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {tickets.filter((t) => t.status === 'OPEN').length} Active Tickets
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 1. In-App Community Channel Creator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-500">
                Create New Community Channel
              </h3>
              <span className="text-[10px] font-mono text-purple-700 font-bold">
                {channels.length} Total Channels
              </span>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Channel Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 15 & Turbopack Lab"
                  value={newChannel.title}
                  onChange={(e) => setNewChannel({ ...newChannel, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Channel Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Peer discussions on server actions and production build errors..."
                  value={newChannel.description}
                  onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Deploy New Channel
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Active Channels
              </span>
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {channels.map((ch) => (
                  <div key={ch.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{ch.title}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-xs">{ch.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteChannel(ch.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Live Facilitator Escalation Tickets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-500">
                Apprentice Escalation Tickets
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                Live Supabase Feed
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No apprentice tickets opened yet.
                </div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{t.subject}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-slate-700 text-[11px] leading-relaxed">{t.message}</p>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <div className="text-[10px] font-mono text-slate-500">
                        <span className="font-bold text-purple-900">{t.intern_name}</span> &bull;{' '}
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>

                      {t.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => handleResolveTicket(t.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-all shadow-xs"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}