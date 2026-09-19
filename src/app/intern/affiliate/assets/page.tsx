'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FolderArchive,
  Copy,
  Check,
  Download,
  Share2,
  MessageCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

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

export default function MarketingAssetsPage() {
  const [loading, setLoading] = useState(true);
  const [affiliateTag, setAffiliateTag] = useState('DGG-NHC-2026-7112');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAffiliateCredentials() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: intern } = await supabase
        .from('intern_profiles')
        .select('nhc_id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (intern?.nhc_id) {
        setAffiliateTag(intern.nhc_id);
      }
      setLoading(false);
    }
    loadAffiliateCredentials();
  }, []);

  const referralLink = `https://www.apply.dglobalgrowthfield.com/internship?ref=${affiliateTag}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scripts = [
    {
      id: 'whatsapp-1',
      title: 'WhatsApp Class Group Broadcast',
      icon: MessageCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      content: `🎓 Tech Apprenticeships are Open!\n\nAre you looking for practical experience and direct placement with startups? DGG NexusHub is currently accepting students for their 3-Month Apprenticeship & Incubation program.\n\nYou'll get a verified portfolio, real enterprise capstone projects, and placement into paid stipends.\n\nRegister through my invite link here:\n${referralLink}`,
    },
    {
      id: 'linkedin-1',
      title: 'LinkedIn Professional Post',
      icon: LinkedinIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      content: `I'm thrilled to be part of the DGG NexusHub ecosystem as a verified apprentice! 🚀\n\nIf you are a student or recent graduate looking to transition into Tech (Full Stack, Data Analytics, or Product Design), DGG is currently offering a 3-month incubation program that directly connects you with hiring startups.\n\nStop learning in isolation. Start building verifiable capstone projects today.\n\nApply for the next cohort here: ${referralLink}\n\n#TechCareers #Apprenticeship #NextJs #DGlobalGrowthfield`,
    },
    {
      id: 'twitter-1',
      title: 'Twitter / X Thread Hook',
      icon: TwitterIcon,
      color: 'text-slate-800',
      bg: 'bg-slate-100',
      border: 'border-slate-300',
      content: `Don't just watch tutorials. Build real systems.\n\nThe D-Global Growthfield (DGG) Apprenticeship connects you with verified startups for 3 months of hands-on incubation + stipend payouts. 💸\n\nI'm currently building my portfolio on their platform.\n\nJoin the cohort: ${referralLink}`,
    },
  ];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono-tech text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          LOADING MARKETING KITS & ASSETS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-amber-200">
              Promo Kit & Creatives
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Marketing Assets & Copy Scripts
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            High-converting broadcast scripts and visual banners designed for university campus groups. Your affiliate tag is pre-embedded.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Copy Scripts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <Share2 className="w-5 h-5 text-[#512d7c]" />
            <h2 className="text-base font-extrabold text-slate-900">High-Conversion Text Scripts</h2>
          </div>

          <div className="space-y-5">
            {scripts.map((script) => (
              <div key={script.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`px-5 py-3 ${script.bg} border-b ${script.border} flex items-center justify-between`}>
                  <div className="flex items-center space-x-2">
                    <script.icon className={`w-4 h-4 ${script.color}`} />
                    <span className="font-extrabold text-sm text-slate-900">{script.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(script.content, script.id)}
                    className={`px-3 py-1.5 bg-white border ${script.border} text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1 transition-all cursor-pointer`}
                  >
                    {copiedId === script.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-5">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed">
                    {script.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Visual Banners (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <ImageIcon className="w-5 h-5 text-[#ff7a00]" />
            <h2 className="text-base font-extrabold text-slate-900">Visual Banners & Flyers</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm group">
              <div className="aspect-[4/5] bg-gradient-to-tr from-[#512d7c] to-[#3a1d5a] rounded-2xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <span className="text-white font-black text-sm z-10">TECH APPRENTICE COHORT</span>
                <span className="text-amber-400 font-mono-tech text-[8px] mt-2 z-10 border border-amber-400/50 px-2 py-1 rounded">INSTAGRAM STORY</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Visual banner downloaded to device.')}
                className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-[#512d7c] border border-slate-200 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download Asset</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm group">
              <div className="aspect-[4/5] bg-gradient-to-tr from-[#ff7a00] to-[#f2b42c] rounded-2xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <span className="text-white font-black text-sm z-10">STARTUP PLACEMENT</span>
                <span className="text-white font-mono-tech text-[8px] mt-2 z-10 border border-white/50 px-2 py-1 rounded">WHATSAPP STATUS</span>
              </div>
              <button
                type="button"
                onClick={() => alert('Visual banner downloaded to device.')}
                className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-[#512d7c] border border-slate-200 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Download Asset</span>
              </button>
            </div>
          </div>

          <div className="bg-purple-50/60 border border-purple-100 rounded-3xl p-5 text-xs text-slate-700 space-y-2">
            <span className="font-mono-tech text-[10px] font-bold text-[#512d7c] uppercase block">
              Usage Guidelines
            </span>
            <p className="leading-relaxed text-[11px]">
              Post these visual flyers alongside your copied text scripts. All leads generated through your embedded referral link are automatically mapped to your Earnings Wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}