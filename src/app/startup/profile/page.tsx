'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Building,
  ShieldCheck,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Clock,
  User,
  Star,
  Tag,
  Target,
  Plus,
  X,
  RefreshCw,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface StartupReview {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  intern_name?: string;
}

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [reviews, setReviews] = useState<StartupReview[]>([]);

  // Email verification state
  const [userEmail, setUserEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Corporate Profile State
  const [companyData, setCompanyData] = useState({
    nhcId: 'DGG-NHC-2026-1001',
    companyName: 'D-Global Growthfield Limited',
    founderName: '',
    rcNumber: 'RC-1237659',
    industry: 'Software Engineering & Enterprise Solutions',
    headquarters: 'Lagos, Nigeria',
    website: 'https://dglobalgrowthfield.com',
    officialEmail: 'partnerships@dglobalgrowthfield.com',
    phone: '+234 812 000 7890',
    description:
      'Pan-African digital growth engine delivering enterprise web software architectures, talent apprenticeships, and cross-border digital operations.',
    coreServices: [] as string[],
    targetAudience: [] as string[],
  });

  // Tag Input States
  const [serviceInput, setServiceInput] = useState('');
  const [audienceInput, setAudienceInput] = useState('');

  const loadCompanyProfile = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }

    setUserEmail(authData.user.email || '');
    setIsEmailVerified(Boolean(authData.user.email_confirmed_at));

    const uid = authData.user.id;

    // 1. Fetch startup profile record
    const { data: startup } = await supabase
      .from('startup_profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (startup) {
      setCompanyData((prev) => ({
        ...prev,
        nhcId: startup.nhc_id || prev.nhcId,
        companyName: startup.company_name || prev.companyName,
        founderName: startup.founder_name || '',
        rcNumber: startup.rc_number || prev.rcNumber,
        industry: startup.business_category || prev.industry,
        website: startup.website || prev.website,
        officialEmail: startup.official_email || prev.officialEmail,
        phone: startup.phone || prev.phone,
        description: startup.description || prev.description,
        coreServices: Array.isArray(startup.core_services) ? startup.core_services : [],
        targetAudience: Array.isArray(startup.target_audience) ? startup.target_audience : [],
      }));
    }

    // 2. Fetch live apprentice reviews written about this startup
    const { data: reviewsData } = await supabase
      .from('platform_reviews')
      .select('id, reviewer_id, rating, title, comment, created_at')
      .eq('recipient_id', uid)
      .eq('target_type', 'STARTUP')
      .order('created_at', { ascending: false });

    if (reviewsData && reviewsData.length > 0) {
      const reviewerIds = Array.from(new Set(reviewsData.map((r) => r.reviewer_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', reviewerIds);

      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        nameMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Apprentice Intern';
      });

      setReviews(
        reviewsData.map((r) => ({
          ...r,
          intern_name: nameMap[r.reviewer_id] || 'Verified Apprentice',
        }))
      );
    } else {
      setReviews([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const handleResendVerification = async () => {
    if (!userEmail) return;
    setResendingEmail(true);
    setVerificationNotice(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    });

    setResendingEmail(false);

    if (error) {
      setVerificationNotice(`Error: ${error.message}`);
    } else {
      setVerificationNotice('Verification link successfully sent to your corporate email inbox!');
    }
  };

  const handleAddService = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = serviceInput.trim();
    if (val && !companyData.coreServices.includes(val)) {
      setCompanyData((prev) => ({
        ...prev,
        coreServices: [...prev.coreServices, val],
      }));
      setServiceInput('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setCompanyData((prev) => ({
      ...prev,
      coreServices: prev.coreServices.filter((s) => s !== serviceToRemove),
    }));
  };

  const handleAddAudience = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = audienceInput.trim();
    if (val && !companyData.targetAudience.includes(val)) {
      setCompanyData((prev) => ({
        ...prev,
        targetAudience: [...prev.targetAudience, val],
      }));
      setAudienceInput('');
    }
  };

  const handleRemoveAudience = (audToRemove: string) => {
    setCompanyData((prev) => ({
      ...prev,
      targetAudience: prev.targetAudience.filter((a) => a !== audToRemove),
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const { error } = await supabase
        .from('startup_profiles')
        .update({
          company_name: companyData.companyName,
          founder_name: companyData.founderName,
          business_category: companyData.industry,
          website: companyData.website,
          official_email: companyData.officialEmail,
          phone: companyData.phone,
          description: companyData.description,
          core_services: companyData.coreServices,
          target_audience: companyData.targetAudience,
        })
        .eq('id', authData.user.id);

      if (error) {
        alert(`Failed to save corporate profile: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          Querying Verified Corporate Dossier & Bilateral Reviews...
        </span>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Corporate Desk Clearance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Company Profile & Verification Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Manage your verified enterprise credentials, business offerings, target clientele, and view bilateral mentorship ratings submitted by apprentice cohorts.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-white text-emerald-700 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Profile Updated Successfully!</span>
          </div>
        )}
      </div>

      {/* EMAIL VERIFICATION STATUS & ACTION BANNER */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans ${isEmailVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
        <div className="flex items-center space-x-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isEmailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 text-sm">Corporate Email: {userEmail}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${isEmailVerified ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-900'}`}>
                {isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isEmailVerified ? 'Your corporate account email is fully authenticated.' : 'Your corporate email is unverified. Please verify your email to unlock all enterprise privileges.'}
            </p>
          </div>
        </div>

        {!isEmailVerified && (
          <button
            type="button"
            disabled={resendingEmail}
            onClick={handleResendVerification}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {resendingEmail ? 'Sending Link...' : 'Verify Your Email Now ➔'}
          </button>
        )}
      </div>

      {verificationNotice && (
        <div className="p-3 bg-purple-50 border border-purple-200 text-[#512d7c] rounded-xl text-xs font-bold">
          {verificationNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Verification Badge & Apprentice Reviews (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Corporate Clearance Card */}
          <div className="bg-[#120324] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-500/30 relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#f2b42c] rounded-xl flex items-center justify-center font-black text-[#512d7c] text-xs">
                  {companyData.companyName.charAt(0) || 'D'}
                </div>
                <span className="font-mono font-black text-xs text-white">
                  ENTERPRISE CLEARANCE
                </span>
              </div>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                <span>CAC ACCREDITED</span>
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">{companyData.companyName}</h3>
              <p className="text-xs text-[#f2b42c] font-bold">{companyData.industry}</p>
              {companyData.founderName && (
                <div className="flex items-center space-x-1.5 text-xs text-white/70 pt-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lead: <strong className="text-white">{companyData.founderName}</strong></span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">RC Number:</span>
                <span className="font-bold text-[#f2b42c]">{companyData.rcNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">ID:</span>
                <span className="font-bold text-amber-200">{companyData.nhcId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Escrow Standing:</span>
                <span className="text-emerald-400 font-bold">Uncapped (₦50k–₦500k)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
              <span>DGG NEXUSHUB ECOSYSTEM</span>
              <span className="text-emerald-400 font-bold">ACTIVE STANDING</span>
            </div>
          </div>

          {/* Verified Apprentice Reviews & Scorecard */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Apprentice Mentorship Scorecard
                </h3>
              </div>
              <div className="flex items-center space-x-1 bg-amber-50 text-amber-900 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                <span>{averageRating}</span>
                <span className="text-amber-500">★</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Real endorsements left by apprentice candidates upon completing weekly sprint milestones.
            </p>

            {reviews.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-1">
                <MessageSquare className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Candidate Reviews Yet</p>
                <p className="text-[11px] text-slate-400">
                  Reviews from your active sprint candidates will display here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold">{rev.intern_name}</strong>
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    {rev.title && <h5 className="font-extrabold text-slate-800 text-[11px]">{rev.title}</h5>}
                    <p className="text-slate-600 text-[11px] italic bg-white p-2 rounded-xl border border-slate-100">
                      "{rev.comment}"
                    </p>
                    <span className="text-[9px] font-mono text-slate-400 block text-right">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Corporate Settings Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Building className="w-5 h-5 text-[#512d7c]" />
              <span>Corporate Entity Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details configure your public enterprise footprint, services, and matching parameters.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Registered Company Name</label>
                <input
                  type="text"
                  required
                  value={companyData.companyName}
                  onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Founder / Lead Executive Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Director / Engineering Manager"
                  value={companyData.founderName}
                  onChange={(e) => setCompanyData({ ...companyData, founderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">CAC Number (RC or BN)</label>
                <input
                  type="text"
                  readOnly
                  value={companyData.rcNumber}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Enterprise NHC Pass ID</label>
                <input
                  type="text"
                  readOnly
                  value={companyData.nhcId}
                  className="w-full px-3.5 py-2.5 bg-purple-50/70 border border-purple-200 rounded-xl font-mono font-bold text-[#512d7c] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Business Sector / Industry</label>
                <input
                  type="text"
                  value={companyData.industry}
                  onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Website URL</label>
                <input
                  type="text"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Official Inquiries Email</label>
                <input
                  type="email"
                  value={companyData.officialEmail}
                  onChange={(e) => setCompanyData({ ...companyData, officialEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Corporate Phone</label>
                <input
                  type="text"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            {/* Core Services Tagging */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-slate-700 font-bold">
                Core Services & Business Deliverables
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Web Development, Cloud Architecture, SEO Optimization"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={handleAddService}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {companyData.coreServices.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-50 text-[#512d7c] border border-purple-200 font-bold rounded-full text-[11px]"
                  >
                    <span>{service}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(service)}
                      className="text-purple-400 hover:text-[#512d7c] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Target Audience Tagging */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-slate-700 font-bold">
                Target Audience & Client Focus
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="e.g. Early-stage Startups, FinTech Enterprises, SMEs, Pan-African Brands"
                  value={audienceInput}
                  onChange={(e) => setAudienceInput(e.target.value)}
                  onKeyDown={handleAddAudience}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
                <button
                  type="button"
                  onClick={handleAddAudience}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {companyData.targetAudience.map((audience) => (
                  <span
                    key={audience}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-bold rounded-full text-[11px]"
                  >
                    <span>{audience}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAudience(audience)}
                      className="text-amber-500 hover:text-amber-800 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-100">
              <label className="block text-slate-700 font-bold">Company Profile & Mission Overview</label>
              <textarea
                rows={3}
                value={companyData.description}
                onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Records...' : 'Save Corporate Information'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}