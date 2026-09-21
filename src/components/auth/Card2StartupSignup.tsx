'use client';

import React, { useState } from 'react';
import { ArrowLeft, Calendar, Loader2, CheckCircle, Lock } from 'lucide-react';

interface Card2StartupSignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function Card2StartupSignup({ onBack, onSuccess }: Card2StartupSignupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

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

  const handleNextStep = () => {
    if (currentStep === 1 && (!companyData.companyName.trim() || !companyData.rcNumber.trim())) {
      alert('Please fill in your company name and RC number.');
      return;
    }
    if (currentStep === 2 && (!companyData.founderName.trim() || !companyData.founderRole.trim())) {
      alert('Please provide your representative details.');
      return;
    }
    if (currentStep === 3 && (!companyData.corporateEmail.trim() || !companyData.phone.trim())) {
      alert('Please provide your corporate email and phone contact.');
      return;
    }
    if (currentStep === 4 && (!companyData.physicalAddress.trim() || !companyData.websiteUrl.trim())) {
      alert('Please provide your office address and website URL.');
      return;
    }
    if (currentStep === 5 && (companyData.password.length < 6 || companyData.password !== companyData.confirmPassword)) {
      alert('Passwords must match and be at least 6 characters.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    if (currentStep === 1) {
      onBack();
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } catch {
      alert('Network error submitting enterprise profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (meetingBooked) {
    return (
      <div className="text-center py-6 space-y-4 text-white">
        <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-500/30">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-white">
          Orientation Assessment Confirmed!
        </h3>
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-left space-y-2">
          <p className="text-white/80">
            <span className="font-bold text-white">Organization:</span> {companyData.companyName} ({companyData.rcNumber})
          </p>
          <p className="text-white/80">
            <span className="font-bold text-white">Scheduled Meeting Slot:</span>{' '}
            <span className="font-mono-tech text-[#f2b42c] font-bold">
              {companyData.assessmentDate} at {companyData.assessmentTime} WAT
            </span>
          </p>
          <p className="text-white/60 text-[11px] leading-relaxed pt-1 border-t border-white/10">
            A secure Google Meet invitation has been dispatched to{' '}
            <span className="font-bold text-white">{companyData.corporateEmail}</span>. Your employer hiring terminal will unlock following this briefing.
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md border border-white/10"
        >
          Return to Login Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs text-white">
      {/* Header & Step Tracker */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={handlePrevStep}
          className="inline-flex items-center space-x-1 text-white/60 hover:text-white font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{currentStep === 1 ? 'Category' : 'Back'}</span>
        </button>
        <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          Step {currentStep} of {totalSteps}: Enterprise Intake
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#f2b42c] transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* STEP 1: COMPANY & RC NUMBER */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">Company / Business Name *</label>
              <input
                required
                type="text"
                value={companyData.companyName}
                onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                placeholder="e.g. AfriPay Fintech Hub Ltd."
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-bold text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">CAC Registration / RC Number *</label>
              <input
                required
                type="text"
                value={companyData.rcNumber}
                onChange={(e) => setCompanyData({ ...companyData, rcNumber: e.target.value })}
                placeholder="RC-1428901 / BN-290192"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-mono-tech font-bold text-[#f2b42c] placeholder:text-white/40"
              />
            </div>
          </div>
        )}

        {/* STEP 2: FOUNDER & ROLE */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">Founder / Lead Representative *</label>
              <input
                required
                type="text"
                value={companyData.founderName}
                onChange={(e) => setCompanyData({ ...companyData, founderName: e.target.value })}
                placeholder="Dr. Alabi Oladapo"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">Executive Designation *</label>
              <input
                required
                type="text"
                value={companyData.founderRole}
                onChange={(e) => setCompanyData({ ...companyData, founderRole: e.target.value })}
                placeholder="Managing Director / Founder"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
              />
            </div>
          </div>
        )}

        {/* STEP 3: INDUSTRY, EMAIL & PHONE */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">Business Industry / Sector *</label>
              <select
                value={companyData.businessCategory}
                onChange={(e) => setCompanyData({ ...companyData, businessCategory: e.target.value })}
                className="w-full p-2.5 bg-[#0d0614] border border-white/10 rounded-xl font-bold text-white cursor-pointer"
              >
                <option className="bg-[#07020d] text-white">Financial Technology & Payments (FinTech)</option>
                <option className="bg-[#07020d] text-white">Educational Technology & E-Learning (EdTech)</option>
                <option className="bg-[#07020d] text-white">Software Development & Cloud Services</option>
                <option className="bg-[#07020d] text-white">E-Commerce, Mega Store & Retail</option>
                <option className="bg-[#07020d] text-white">Oil, Gas & Energy Operations</option>
                <option className="bg-[#07020d] text-white">Creative Media, Ads & Agency</option>
                <option className="bg-[#07020d] text-white">Healthcare & Life Sciences</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">Corporate Email *</label>
                <input
                  required
                  type="email"
                  value={companyData.corporateEmail}
                  onChange={(e) => setCompanyData({ ...companyData, corporateEmail: e.target.value })}
                  placeholder="founder@afripay.ng"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40 text-xs"
                />
              </div>
              <div>
                <label className="block text-white/80 font-bold mb-1">Direct Phone *</label>
                <input
                  required
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  placeholder="+234 802 987"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-mono-tech text-white placeholder:text-white/40 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ADDRESS, STATE & WEBSITE */}
        {currentStep === 4 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">Physical Office Address *</label>
              <input
                required
                type="text"
                value={companyData.physicalAddress}
                onChange={(e) => setCompanyData({ ...companyData, physicalAddress: e.target.value })}
                placeholder="12 Isaac John St, Ikeja GRA"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">Hub State *</label>
                <select
                  value={companyData.operatingState}
                  onChange={(e) => setCompanyData({ ...companyData, operatingState: e.target.value })}
                  className="w-full p-2.5 bg-[#0d0614] border border-white/10 rounded-xl font-bold text-white cursor-pointer text-xs"
                >
                  <option className="bg-[#07020d] text-white">Lagos State (Ikeja / Island Hub)</option>
                  <option className="bg-[#07020d] text-white">Ogun State (Abeokuta / Ota)</option>
                  <option className="bg-[#07020d] text-white">Abuja FCT Central Hub</option>
                  <option className="bg-[#07020d] text-white">Rivers State (Port Harcourt)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 font-bold mb-1">Website URL *</label>
                <input
                  required
                  type="url"
                  value={companyData.websiteUrl}
                  onChange={(e) => setCompanyData({ ...companyData, websiteUrl: e.target.value })}
                  placeholder="https://afripay.ng"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-mono-tech text-white placeholder:text-white/40 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PASSWORDS & ABOUT */}
        {currentStep === 5 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={companyData.password}
                  onChange={(e) => setCompanyData({ ...companyData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <label className="block text-white/80 font-bold mb-1">Confirm Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={companyData.confirmPassword}
                  onChange={(e) => setCompanyData({ ...companyData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">About Enterprise & Scope *</label>
              <textarea
                required
                rows={2}
                value={companyData.companySummary}
                onChange={(e) => setCompanyData({ ...companyData, companySummary: e.target.value })}
                placeholder="Briefly describe core operations and mentorship capabilities..."
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
              />
            </div>
          </div>
        )}

        {/* STEP 6: ORIENTATION SCHEDULER */}
        {currentStep === 6 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-black">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>MANDATORY INTAKE ORIENTATION & ASSESSMENT BRIEFING</span>
              </div>
              <p className="text-[11px] text-white/60">
                Select a 20-minute Google Meet schedule with DGG Leadership before terminal access is authorized.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-white/80 font-bold mb-0.5 text-[10px]">Meeting Date *</label>
                  <input
                    required
                    type="date"
                    value={companyData.assessmentDate}
                    onChange={(e) => setCompanyData({ ...companyData, assessmentDate: e.target.value })}
                    className="w-full p-2 bg-white/12 border border-amber-500/30 rounded-xl font-mono-tech text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/80 font-bold mb-0.5 text-[10px]">Time Slot *</label>
                  <select
                    value={companyData.assessmentTime}
                    onChange={(e) => setCompanyData({ ...companyData, assessmentTime: e.target.value })}
                    className="w-full p-2 bg-[#0d0614] border border-amber-500/30 rounded-xl font-mono-tech text-xs font-bold text-white cursor-pointer"
                  >
                    <option className="bg-[#07020d] text-white">09:30 AM WAT</option>
                    <option className="bg-[#07020d] text-white">10:00 AM WAT</option>
                    <option className="bg-[#07020d] text-white">11:30 AM WAT</option>
                    <option className="bg-[#07020d] text-white">02:00 PM WAT</option>
                    <option className="bg-[#07020d] text-white">04:00 PM WAT</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center justify-between pt-2">
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full py-3 bg-[#f2b42c] text-[#512d7c] font-black uppercase tracking-wider rounded-xl hover:opacity-95 shadow-lg transition-all cursor-pointer text-xs"
            >
              Next Step ➔
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60 border border-white/10 text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Enterprise...</span>
                </>
              ) : (
                <span>Book Assessment & Submit ➔</span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}