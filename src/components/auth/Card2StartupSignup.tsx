'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, Loader2, CheckCircle, Lock } from 'lucide-react';

interface Card2StartupSignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function Card2StartupSignup({ onBack, onSuccess }: Card2StartupSignupProps) {
  const [meetingBooked, setMeetingBooked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyData, setCompanyData] = useState({
    companyName: '',
    founderName: '',
    founderRole: 'Founder / CEO',
    rcNumber: '',
    businessCategory: 'Financial Technology & Payments (FinTech)',
    corporateEmail: '',
    phone: '',
    physicalAddress: '',
    operatingState: 'Lagos State (Ikeja / Island Hub)',
    websiteUrl: '',
    linkedinUrl: '',
    socialHandle: '',
    companySummary: '',
    assessmentDate: '2026-09-18',
    assessmentTime: '10:00 AM',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (companyData.password !== companyData.confirmPassword) {
      alert('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData),
      });

      const data = await res.json();

      if (data.success) {
        setMeetingBooked(true);
      } else {
        alert(`Registration failed: ${data.message}`);
      }
    } catch (err: any) {
      alert('Network error submitting enterprise profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (meetingBooked) {
    return (
      <div className="text-center py-6 space-y-4 text-slate-800">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-[#512d7c]">
          Orientation Assessment Confirmed!
        </h3>
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2">
          <p>
            <span className="font-bold text-slate-900">Organization:</span> {companyData.companyName} ({companyData.rcNumber})
          </p>
          <p>
            <span className="font-bold text-slate-900">Scheduled Meeting Slot:</span>{' '}
            <span className="font-mono-tech text-[#512d7c] font-bold">
              {companyData.assessmentDate} at {companyData.assessmentTime} WAT
            </span>
          </p>
          <p className="text-slate-500 text-[11px] leading-relaxed pt-1 border-t border-slate-200">
            A secure Google Meet invitation has been dispatched to{' '}
            <span className="font-bold text-slate-700">{companyData.corporateEmail}</span>. Your employer hiring terminal and verified intern directory will unlock following this briefing.
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
        >
          Return to Login Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Category</span>
        </button>
        <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-[#d97706] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Enterprise Credibility Intake
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Company & CAC RC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Company / Business Name *</label>
            <input
              required
              type="text"
              value={companyData.companyName}
              onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
              placeholder="e.g. AfriPay Fintech Hub Ltd."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">CAC Registration / RC Number *</label>
            <input
              required
              type="text"
              value={companyData.rcNumber}
              onChange={(e) => setCompanyData({ ...companyData, rcNumber: e.target.value })}
              placeholder="RC-1428901 / BN-290192"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech font-bold text-[#512d7c]"
            />
          </div>
        </div>

        {/* Founder Name & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Founder / Lead Representative *</label>
            <input
              required
              type="text"
              value={companyData.founderName}
              onChange={(e) => setCompanyData({ ...companyData, founderName: e.target.value })}
              placeholder="Dr. Alabi Oladapo"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Executive Designation *</label>
            <input
              required
              type="text"
              value={companyData.founderRole}
              onChange={(e) => setCompanyData({ ...companyData, founderRole: e.target.value })}
              placeholder="Managing Director / Founder"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Business Category */}
        <div>
          <label className="block text-slate-600 font-bold mb-1">Business Industry / Sector *</label>
          <select
            value={companyData.businessCategory}
            onChange={(e) => setCompanyData({ ...companyData, businessCategory: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
          >
            <option>Financial Technology & Payments (FinTech)</option>
            <option>Educational Technology & E-Learning (EdTech)</option>
            <option>Software Development & Cloud Services</option>
            <option>E-Commerce, Mega Store & Retail</option>
            <option>Oil, Gas & Energy Operations</option>
            <option>Creative Media, Ads & Agency</option>
            <option>Healthcare & Life Sciences</option>
          </select>
        </div>

        {/* Corporate Email & Official Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Official Corporate Email *</label>
            <input
              required
              type="email"
              value={companyData.corporateEmail}
              onChange={(e) => setCompanyData({ ...companyData, corporateEmail: e.target.value })}
              placeholder="founder@afripay.ng"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Direct Phone Contact *</label>
            <input
              required
              type="tel"
              value={companyData.phone}
              onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
              placeholder="+234 802 987 6543"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech"
            />
          </div>
        </div>

        {/* Physical Office Address & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Physical Office Address *</label>
            <input
              required
              type="text"
              value={companyData.physicalAddress}
              onChange={(e) => setCompanyData({ ...companyData, physicalAddress: e.target.value })}
              placeholder="12 Isaac John St, Ikeja GRA"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Hub State / Territory *</label>
            <select
              value={companyData.operatingState}
              onChange={(e) => setCompanyData({ ...companyData, operatingState: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            >
              <option>Lagos State (Ikeja / Island Hub)</option>
              <option>Ogun State (Abeokuta / Ota)</option>
              <option>Abuja FCT Central Hub</option>
              <option>Rivers State (Port Harcourt)</option>
              <option>Diaspora / International Remote Office</option>
            </select>
          </div>
        </div>

        {/* Digital Footprint: Website, LinkedIn & Social */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Website URL *</label>
            <input
              required
              type="url"
              value={companyData.websiteUrl}
              onChange={(e) => setCompanyData({ ...companyData, websiteUrl: e.target.value })}
              placeholder="https://afripay.ng"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={companyData.linkedinUrl}
              onChange={(e) => setCompanyData({ ...companyData, linkedinUrl: e.target.value })}
              placeholder="linkedin.com/company/..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech text-[11px]"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">X / IG Handle</label>
            <input
              type="text"
              value={companyData.socialHandle}
              onChange={(e) => setCompanyData({ ...companyData, socialHandle: e.target.value })}
              placeholder="@afripay_hub"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech text-[11px]"
            />
          </div>
        </div>

        {/* Real Enterprise Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Account Password (Min. 6 chars) *</label>
            <input
              required
              minLength={6}
              type="password"
              value={companyData.password}
              onChange={(e) => setCompanyData({ ...companyData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Confirm Password *</label>
            <input
              required
              minLength={6}
              type="password"
              value={companyData.confirmPassword}
              onChange={(e) => setCompanyData({ ...companyData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>
        </div>

        {/* Company Summary */}
        <div>
          <label className="block text-slate-600 font-bold mb-1">About Enterprise & Operational Scope *</label>
          <textarea
            required
            rows={2}
            value={companyData.companySummary}
            onChange={(e) => setCompanyData({ ...companyData, companySummary: e.target.value })}
            placeholder="Briefly describe your company's core operations, products, and apprentice mentorship capabilities..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        {/* Orientation & Assessment Scheduler */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border-2 border-[#f2b42c] space-y-2">
          <div className="flex items-center space-x-2 text-[#512d7c] font-black">
            <Calendar className="w-4 h-4 text-[#d97706]" />
            <span>MANDATORY INTAKE ORIENTATION & ASSESSMENT BRIEFING</span>
          </div>
          <p className="text-[11px] text-slate-600">
            To safeguard campus talent and guarantee smooth incubation operations, select a 20-minute Google Meet schedule with DGG Leadership before terminal access is authorized.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-0.5 text-[10px]">Select Meeting Date *</label>
              <input
                required
                type="date"
                value={companyData.assessmentDate}
                onChange={(e) => setCompanyData({ ...companyData, assessmentDate: e.target.value })}
                className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono-tech text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-0.5 text-[10px]">Preferred WAT Time Slot *</label>
              <select
                value={companyData.assessmentTime}
                onChange={(e) => setCompanyData({ ...companyData, assessmentTime: e.target.value })}
                className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono-tech text-xs font-bold"
              >
                <option>09:30 AM WAT</option>
                <option>10:00 AM WAT</option>
                <option>11:30 AM WAT</option>
                <option>02:00 PM WAT</option>
                <option>04:00 PM WAT</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer mt-3 flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering Enterprise & Scheduling...</span>
            </>
          ) : (
            <span>Book Assessment & Submit Registration ➔</span>
          )}
        </button>
      </form>
    </div>
  );
}