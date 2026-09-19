'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Link2,
  Copy,
  Check,
  Globe,
  Sparkles,
  Share2,
} from 'lucide-react';

export default function MultiDomainDeepLinksPage() {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedPreset, setCopiedPreset] = useState<number | null>(null);

  const [affiliateTag, setAffiliateTag] = useState('DGG-NHC-2026-7112');
  const [selectedProperty, setSelectedProperty] = useState('https://dglobalgrowthfield.com');
  const [customUrl, setCustomUrl] = useState('');
  const [campaignTag, setCampaignTag] = useState('direct');
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentOrigin(window.location.origin);
    }

    async function loadAffiliateCredentials() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: intern } = await supabase
        .from('intern_profiles')
        .select('nhc_id, subdomain_handle')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (intern?.nhc_id) {
        setAffiliateTag(intern.nhc_id);
      }
      setLoading(false);
    }
    loadAffiliateCredentials();
  }, []);

  // Compute the trackable redirect link via our /r gateway
  const computeTargetUrl = () => {
    let target = selectedProperty === 'custom' ? customUrl.trim() : selectedProperty;
    if (!target) target = 'https://dglobalgrowthfield.com';

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    const host = currentOrigin || 'https://nexushub.africa';
    const tag = affiliateTag || 'dgg';
    const campaign = campaignTag || 'direct';

    return `${host}/r?ref=${encodeURIComponent(tag)}&to=${encodeURIComponent(target)}&campaign=${encodeURIComponent(campaign)}`;
  };

  const finalDeepLink = computeTargetUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(finalDeepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyPreset = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPreset(idx);
    setTimeout(() => setCopiedPreset(null), 2000);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono-tech text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          INITIALIZING MULTI-DOMAIN LINK ROUTER...
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
              Affiliate Routing Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Multi-Domain Deep-Link Generator
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Generate customized, trackable affiliate referral URLs across any official property in the DGG ecosystem.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Verified Affiliate Tag</span>
            <span className="text-sm sm:text-base font-black font-mono-tech text-amber-200">{affiliateTag}</span>
          </div>
        </div>
      </div>

      {/* Main Generator Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Core Generator Console (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Link2 className="w-5 h-5 text-[#512d7c]" />
              <span>Configure Your Deep-Link</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the ecosystem destination property and assign your affiliate tracking parameters.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Step 1: Destination Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">
                Select Destination DGG Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c] cursor-pointer"
              >
                <option value="https://dglobalgrowthfield.com">
                  Main Corporate Hub (dglobalgrowthfield.com)
                </option>
                <option value="https://learning.dglobalgrowthfield.com">
                  DGG Learning Academy LMS (learning.dglobalgrowthfield.com)
                </option>
                <option value="https://www.apply.dglobalgrowthfield.com/internship">
                  DGG Campus Internship Portal (apply.dglobalgrowthfield.com/internship)
                </option>
                <option value="custom">
                  Custom Ecosystem Subdomain / Property (Input Manually)
                </option>
              </select>
            </div>

            {/* Custom URL Input (Reveals only if 'custom' is picked) */}
            {selectedProperty === 'custom' && (
              <div className="space-y-1.5 p-4 bg-purple-50/60 border border-purple-200 rounded-2xl animate-in fade-in duration-300">
                <label className="block text-[#512d7c] font-bold">
                  Enter Custom Subdomain or Ecosystem Landing Page URL
                </label>
                <div className="flex items-center bg-white border border-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-mono-tech shadow-inner">
                  <Globe className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://cac.dglobalgrowthfield.com/register"
                    className="bg-transparent text-slate-900 font-bold focus:outline-none w-full"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  Input any internal campaign or partner URL. The tracker will append your tag automatically.
                </p>
              </div>
            )}

            {/* Step 2: Unique Tag */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">
                Your Unique Affiliate Tag
              </label>
              <input
                type="text"
                readOnly
                value={affiliateTag}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono-tech font-bold text-slate-700 select-all cursor-not-allowed"
              />
            </div>

            {/* Step 3: Campaign Tag (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold">
                Channel / Campaign Name (Optional)
              </label>
              <input
                type="text"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="whatsapp-broadcast, linkedin-post, campus-flyer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            {/* Output Deep-Link Display Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-slate-700 font-bold">
                Generated Deep-Link (Tracked via /r Gateway)
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-mono-tech text-[#512d7c] font-bold break-all flex items-center shadow-inner">
                  {finalDeepLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-5 py-3 bg-[#f2b42c] hover:bg-[#e0a21f] text-slate-900 font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-slate-900" />
                      <span>Copied Link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-900" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Campaign Promotional Kits (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-[#ff7a00]" />
                <span>One-Click WhatsApp Broadcast Copy</span>
              </h3>
              <span className="text-[10px] font-mono-tech text-emerald-600 font-bold">Verified Copy</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Copy this ready-made text script embedded with your affiliate link to share with university groups, departmental chats, and LinkedIn feeds:
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans relative">
              <p>
                🎓 Are you looking to break into Tech or prepare for enterprise careers with practical projects and verified certificates?
              </p>
              <p className="mt-2">
                Apply to the <strong>DGG Campus Apprenticeship & Skills Program</strong> today. Check out our tracks and register here:
              </p>
              <p className="mt-2 font-mono-tech text-[11px] text-[#512d7c] font-bold break-all">
                {finalDeepLink}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopyPreset(
                  `🎓 Are you looking to break into Tech or prepare for enterprise careers with practical projects and verified certificates?\n\nApply to the DGG Campus Apprenticeship & Skills Program today. Check out our tracks and register here:\n${finalDeepLink}`,
                  1
                )
              }
              className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {copiedPreset === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPreset === 1 ? 'Copied Full Broadcast Script!' : 'Copy Script & Link'}</span>
            </button>
          </div>

          {/* Surcharge & Facilitation Notice Card */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-3xl p-5 text-xs text-slate-700 space-y-2">
            <span className="font-mono-tech text-[10px] font-bold text-[#512d7c] uppercase block">
              Cookie Attribution Window
            </span>
            <p className="leading-relaxed text-[11px]">
              Links generated through this engine use standard 60-day attribution cookies. If a user clicks your link and registers within 60 days, your 10%–15% commission is automatically credited to your Earnings Wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}