'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Globe,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Terminal,
  Briefcase,
  Layers,
  Palette,
  Eye,
  Check,
  Smartphone,
  Monitor,
  Copy,
  ShieldCheck,
  Star,
  School,
  FolderGit2,
  Mail,
  MapPin,
  Save,
  Loader2,
  Code2,
  Cpu,
  ChevronRight
} from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TwitterIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface TemplateOption {
  id: number;
  name: string;
  tagline: string;
  badge: string;
  previewBg: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 1,
    name: 'Minimalist Tech Terminal',
    tagline: 'Deep dark CLI, matrix emerald glow & monospace font',
    badge: 'HACKER / DEV',
    previewBg: 'bg-[#04080e] text-emerald-300 border-emerald-900/60',
    description: 'Engineering-first dark monospace theme with terminal headers and matrix status pills.',
  },
  {
    id: 2,
    name: 'Corporate Executive',
    tagline: 'Crisp executive slate white with boardroom typography',
    badge: 'ENTERPRISE READY',
    previewBg: 'bg-[#f8fafc] text-slate-900 border-slate-300',
    description: 'Clean executive profile design tailored for institutional and enterprise matching.',
  },
  {
    id: 3,
    name: 'The Scorefield Studio',
    tagline: 'Obsidian violet canvas with glowing card borders',
    badge: 'POPULAR CHOICE',
    previewBg: 'bg-[#08020f] text-slate-100 border-purple-500/40',
    description: 'High-contrast purple and sunset gradients highlighting cloud systems and product engineering.',
  },
  {
    id: 4,
    name: 'Modern Minimalist Light',
    tagline: 'Pure white canvas with soft Apple-style borders',
    badge: 'TRENDING SAAS',
    previewBg: 'bg-[#ffffff] text-slate-800 border-slate-300',
    description: 'Ultra-clean modern SaaS look with crisp light backgrounds and high-contrast text.',
  },
  {
    id: 5,
    name: 'Neo-Brutalist Agency',
    tagline: 'Cream canvas with thick offset solid black borders (Screenshot 2)',
    badge: 'MODERN EDGY',
    previewBg: 'bg-[#fefce8] text-black border-4 border-black shadow-[4px_4px_0px_0px_#000]',
    description: 'The exact high-impact design from Screenshot 2 with heavy black borders and punchy badges.',
  },
];

export default function InternPortfolioStudioPage() {
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<number>(5);
  const [savedTemplate, setSavedTemplate] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);

  // Candidate Data State
  const [subdomain, setSubdomain] = useState('irene-obioha-7112');
  const [profile, setProfile] = useState({
    name: 'Irene Obioha',
    tier: 'Associate (Intermediate: 2-month trial)',
    nhcId: 'DGG-NHC-2026-7112',
    track: 'TRK-02: Data Analytics',
    institution: 'University of Ibadan',
    rawEmail: 'misterscorefield@gmail.com',
    location: 'Lagos, Nigeria (Remote / Global)',
    avatarUrl: '',
    bio: 'Building scalable digital systems and driving ecosystem conversion with Next.js, TypeScript, PostgreSQL, and scalable cloud microservice pipelines.',
    ongoingAssignments: 'Active Sprints on DGG-NexusHub',
    verifiedCertId: 'DGG-IN-56722734',
  });

  // Masking Helper for the studio preview
  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return 'verified-candidate@dgg.link';
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `${local[0]}•••@${domain}`;
    const visibleStart = local.slice(0, 3);
    const maskedLength = Math.min(local.length - 3, 8);
    return `${visibleStart}${'•'.repeat(maskedLength)}@${domain}`;
  };

  useEffect(() => {
    async function loadSettings() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, avatar_url')
          .eq('id', authData.user.id)
          .maybeSingle();

        const { data: intern } = await supabase
          .from('intern_profiles')
          .select('subdomain_handle, tier, specialization_track, institution, bio, ongoing_assignments, portfolio_template, verified_cert_id')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (intern) {
          const currentTmpl = Number(intern.portfolio_template) || 5;
          setActiveTemplate(currentTmpl);
          setSavedTemplate(currentTmpl);
          if (intern.subdomain_handle) setSubdomain(intern.subdomain_handle);

          setProfile({
            name: `${prof?.first_name || 'Apprentice'} ${prof?.last_name || ''}`.trim(),
            tier: intern.tier || 'Associate (Intermediate: 2-month trial)',
            nhcId: intern.nhc_id || 'DGG-NHC-2026-7112',
            track: intern.specialization_track || 'TRK-02: Data Analytics',
            institution: intern.institution || 'Partner University',
            rawEmail: prof?.email || 'misterscorefield@gmail.com',
            location: 'Lagos, Nigeria (Remote / Global)',
            avatarUrl: prof?.avatar_url || '',
            bio: intern.bio || 'Building scalable digital systems and driving ecosystem conversion.',
            ongoingAssignments: intern.ongoing_assignments || 'Active Sprints on DGG-NexusHub',
            verifiedCertId: intern.verified_cert_id || 'DGG-IN-56722734',
          });
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handlePublishTheme = async () => {
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      await supabase
        .from('intern_profiles')
        .update({ portfolio_template: activeTemplate })
        .eq('id', authData.user.id);
    }

    setSavedTemplate(activeTemplate);
    setSaving(false);
    const selectedObj = TEMPLATES.find((t) => t.id === activeTemplate);
    setSaveSuccessNotice(`Published! "${selectedObj?.name}" is now live on your subdomain.`);
    setTimeout(() => setSaveSuccessNotice(null), 4000);
  };

  const handleCopyPublicUrl = () => {
    const url = `${window.location.origin}/portfolio/${subdomain}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono-tech text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          LOADING PORTFOLIO STUDIO & PREVIEW WIREFRAMES...
        </span>
      </div>
    );
  }

  const activeTemplateObj = TEMPLATES.find((t) => t.id === activeTemplate) || TEMPLATES[4];
  const hasUnsavedChanges = activeTemplate !== savedTemplate;

  // Viewport Dynamic Styles for Preview
  const previewCanvas =
    activeTemplate === 1
      ? 'bg-[#04080e] text-emerald-300 font-mono'
      : activeTemplate === 2
      ? 'bg-[#f8fafc] text-slate-900 font-sans'
      : activeTemplate === 3
      ? 'bg-[#08020f] text-slate-100 font-sans'
      : activeTemplate === 4
      ? 'bg-[#ffffff] text-slate-800 font-sans'
      : 'bg-[#fefce8] text-black font-sans'; // Theme 5 (Screenshot 2)

  const previewCard =
    activeTemplate === 1
      ? 'bg-[#08101a] border border-emerald-900/60'
      : activeTemplate === 2
      ? 'bg-white border border-slate-200 shadow-sm'
      : activeTemplate === 3
      ? 'bg-[#120722]/80 border border-purple-500/20 backdrop-blur-xl'
      : activeTemplate === 4
      ? 'bg-white border border-slate-200 shadow-md'
      : 'bg-white border-[3.5px] border-black shadow-[4px_4px_0px_0px_#000]';

  const previewAccent =
    activeTemplate === 1
      ? 'text-emerald-400'
      : activeTemplate === 2
      ? 'text-[#512d7c]'
      : activeTemplate === 3
      ? 'text-purple-400'
      : activeTemplate === 4
      ? 'text-indigo-600'
      : 'text-purple-700';

  const previewHighlight =
    activeTemplate === 1
      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
      : activeTemplate === 2
      ? 'bg-slate-100 border border-slate-300 text-slate-800'
      : activeTemplate === 3
      ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200'
      : activeTemplate === 4
      ? 'bg-indigo-50 border border-indigo-100 text-indigo-900'
      : 'bg-amber-100 border-2 border-black text-black';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-amber-200">
              Multi-Theme Portfolio Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Portfolio Themes & Subdomain Studio
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Choose how your public link presents your soft ID, capstone projects, academic history, and enterprise reviews. Click <strong>Publish Theme Changes</strong> to make it live.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 relative z-10 font-mono-tech">
          <button
            type="button"
            onClick={handleCopyPublicUrl}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied Link!' : 'Copy Public URL'}</span>
          </button>

          <Link
            href={`/portfolio/${subdomain}`}
            target="_blank"
            className="px-4 py-2.5 bg-[#f2b42c] hover:bg-amber-400 text-slate-900 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 shadow-md"
          >
            <span>Launch Live Portfolio</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Theme Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Palette className="w-4 h-4 text-[#512d7c]" />
                <span>5 Structural Portfolio Themes</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Click any layout below to preview its styling live on the right.
              </p>
            </div>
          </div>

          {/* Prominent Save / Publish Box */}
          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Selected Theme:</span>
              <span className="font-mono-tech font-black text-[#512d7c]">{activeTemplateObj.name}</span>
            </div>

            <button
              type="button"
              disabled={saving || !hasUnsavedChanges}
              onClick={handlePublishTheme}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-[#512d7c] hover:bg-[#3e215f] text-white ring-2 ring-purple-300 animate-pulse'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Changes...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Publish Theme Changes ➔</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Theme Up to Date</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-500 text-center block">
              {hasUnsavedChanges ? '⚠️ You have selected a new theme. Click above to apply.' : 'This layout is currently live on your subdomain.'}
            </span>
          </div>

          <div className="space-y-3">
            {TEMPLATES.map((tmpl) => {
              const isSelected = activeTemplate === tmpl.id;
              const isLive = savedTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setActiveTemplate(tmpl.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-[#512d7c] shadow-md ring-2 ring-purple-100'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] font-mono-tech font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {tmpl.badge}
                        </span>
                        {isLive && (
                          <span className="text-[9px] font-mono-tech font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                            <Check className="w-2.5 h-2.5" />
                            <span>CURRENTLY LIVE</span>
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900">{tmpl.name}</h3>
                      <p className="text-xs text-slate-500 leading-tight">{tmpl.tagline}</p>
                    </div>

                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${tmpl.previewBg}`}>
                      {tmpl.id === 1 && <Terminal className="w-5 h-5" />}
                      {tmpl.id === 2 && <Briefcase className="w-5 h-5" />}
                      {tmpl.id === 3 && <Layers className="w-5 h-5" />}
                      {tmpl.id === 4 && <Globe className="w-5 h-5" />}
                      {tmpl.id === 5 && <Sparkles className="w-5 h-5" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 pt-2.5 mt-2 border-t border-slate-100 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Interactive Viewport Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#512d7c]" />
              <h3 className="font-extrabold text-xs text-slate-900">
                Live Dual-Column Preview: <span className="text-[#512d7c]">{activeTemplateObj.name}</span>
              </h3>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl space-x-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            className={`mx-auto transition-all duration-300 rounded-2xl overflow-hidden border ${
              previewDevice === 'mobile' ? 'max-w-[340px] shadow-xl border-slate-300' : 'w-full shadow-sm border-slate-200'
            }`}
          >
            {/* Window Bar Mock */}
            <div className="bg-slate-900 px-3.5 py-2 flex items-center justify-between text-[10px] font-mono-tech text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="truncate max-w-[200px] text-slate-400">
                https://{subdomain}.dgg.link
              </span>
              <span className="text-[9px] text-emerald-400 font-bold">&#10003; SSL</span>
            </div>

            {/* Simulated Dual-Column Layout (Matching Screenshot 2) */}
            <div className={`p-4 sm:p-5 max-h-[580px] overflow-y-auto space-y-4 transition-colors duration-300 ${previewCanvas}`}>
              
              <div className="text-[10px] font-mono font-bold uppercase pb-2 border-b border-current/20 flex justify-between">
                <span>{activeTemplateObj.name.toUpperCase()} PREVIEW</span>
                <span>{profile.nhcId}</span>
              </div>

              {/* The Master Dual-Column Grid */}
              <div className={`grid ${previewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-12'} gap-4 items-start`}>
                
                {/* 1. Left Sticky Mini Rail */}
                <div className={`${previewDevice === 'mobile' ? 'col-span-1' : 'col-span-4'} p-3.5 rounded-2xl ${previewCard} space-y-3`}>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center font-black text-lg ${
                        activeTemplate === 5 ? 'border-2 border-black bg-amber-300' : 'border border-current/20 bg-black/40'
                      }`}
                    >
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : profile.name[0]}
                    </div>
                    <div>
                      <h4 className="font-black text-xs leading-tight">{profile.name}</h4>
                      <p className={`text-[10px] font-bold ${previewAccent}`}>{profile.track}</p>
                      <span className="text-[9px] opacity-60 font-mono block">{profile.institution}</span>
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl text-[10px] ${previewHighlight}`}>
                    <span className="font-mono uppercase text-[8px] font-bold block opacity-70">OFFICIAL TIER:</span>
                    <span className="font-black block">{profile.tier}</span>
                  </div>

                  {/* Masked Privacy Fields in Preview */}
                  <div className="pt-2 border-t border-current/10 space-y-1.5 text-[9px] opacity-75 font-mono">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Mail className="w-3 h-3 opacity-60 shrink-0" />
                      <span>{maskEmail(profile.rawEmail)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="font-bold">{profile.verifiedCertId}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 opacity-60 shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  </div>

                  {/* Social Buttons in Mini Rail */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-current/10">
                    <div className="p-1.5 rounded-lg bg-current/5 border border-current/10"><GithubIcon className="w-3.5 h-3.5" /></div>
                    <div className="p-1.5 rounded-lg bg-current/5 border border-current/10 text-blue-500"><LinkedinIcon className="w-3.5 h-3.5" /></div>
                    <div className="p-1.5 rounded-lg bg-current/5 border border-current/10"><TwitterIcon className="w-3.5 h-3.5" /></div>
                    <div className="p-1.5 rounded-lg bg-current/5 border border-current/10 text-amber-500"><Globe className="w-3.5 h-3.5" /></div>
                  </div>
                </div>

                {/* 2. Right Mini Content Spine */}
                <div className={`${previewDevice === 'mobile' ? 'col-span-1' : 'col-span-8'} space-y-4`}>
                  
                  {/* Top Mini Nav Bar */}
                  <div className="flex items-center justify-between border-b border-current/10 pb-2 text-[10px] font-mono">
                    <div className="flex space-x-3 uppercase opacity-80">
                      <span className="font-bold underline">About</span>
                      <span>Skills</span>
                      <span>Projects</span>
                      <span>Reviews</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${activeTemplate === 5 ? 'bg-purple-600 text-white border border-black' : 'bg-purple-600 text-white'}`}>
                      Hire
                    </span>
                  </div>

                  {/* Hero */}
                  <div className="space-y-1">
                    <span className={`text-[8px] font-mono uppercase font-bold tracking-widest ${previewAccent}`}>// TALENT DOSSIER</span>
                    <h3 className="text-sm font-black leading-tight">
                      Bridging Technical Execution with <span className={previewAccent}>Enterprise Engineering.</span>
                    </h3>
                  </div>

                  {/* 4 Stats */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[9px] font-mono">
                    <div className={`p-2 rounded-xl ${previewCard}`}><div className="font-black">100%</div><div className="text-[7px] opacity-60">Att</div></div>
                    <div className={`p-2 rounded-xl ${previewCard}`}><div className="font-black">2+</div><div className="text-[7px] opacity-60">Builds</div></div>
                    <div className={`p-2 rounded-xl ${previewCard}`}><div className="font-black">2</div><div className="text-[7px] opacity-60">Reviews</div></div>
                    <div className={`p-2 rounded-xl ${previewCard}`}><div className="font-black">2 MO</div><div className="text-[7px] opacity-60">Runway</div></div>
                  </div>

                  {/* Capstone Card */}
                  <div className={`p-3 rounded-2xl ${previewCard} space-y-1`}>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span>DGG Multi-Tenant Operations Engine</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </div>
                    <p className="text-[9px] opacity-70 line-clamp-1">Role-based gateway with Supabase RLS security.</p>
                  </div>

                  {/* Review Card */}
                  <div className={`p-3 rounded-2xl ${previewCard} space-y-1 text-[9px]`}>
                    <div className="flex justify-between font-bold">
                      <span>AfriPay Fintech Hub Ltd.</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="italic opacity-80 line-clamp-1">"Irene integrated our entire security policy schema ahead of schedule."</p>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-current/10 flex justify-between text-[8px] font-mono opacity-60">
                    <span>&copy; {new Date().getFullYear()} {profile.name}</span>
                    <span className="text-amber-500 font-bold">Powered by D-Global Growthfield Ltd</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}