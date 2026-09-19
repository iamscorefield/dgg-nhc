'use client';

import React, { useState } from 'react';
import { ShieldCheck, Loader2, ArrowLeft, CheckCircle2, CheckCircle, ExternalLink } from 'lucide-react';

interface Card1InternSignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

const DEFAULT_TRACKS = [
  'TRK-01: Full Stack Development',
  'TRK-02: Data Analytics',
  'TRK-03: Growth Marketing & SEO',
  'TRK-04: Product Design & UI/UX',
  'TRK-05: Video Ads & Media',
  'TRK-06: Virtual Assistance',
  'TRK-07: Digital Monetization & Affiliate',
];

const POPULAR_STATES = [
  'Lagos State',
  'Abuja (FCT)',
  'Rivers State (Port Harcourt)',
  'Oyo State (Ibadan)',
  'Ogun State (Abeokuta)',
  'Enugu State',
  'Plateau State (Jos)',
  'Remote / Global',
];

export default function Card1InternSignup({ onBack, onSuccess }: Card1InternSignupProps) {
  const [certId, setCertId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState<string | null>(null);

  // Custom Selection Toggles
  const [isCustomTrack, setIsCustomTrack] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);

  // Success Slip State
  const [registeredData, setRegisteredData] = useState<{
    nhcId: string;
    subdomainHandle: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    educationLevel: 'Undergraduate (100 - 500 Level)',
    institution: '',
    discipline: '',
    experienceYears: '0 (Fresher / Entry Level)',
    specializationTrack: 'TRK-01: Full Stack Development',
    stateOfResidence: 'Lagos State',
    password: '',
    confirmPassword: ''
  });

  const handleVerifyCert = async () => {
    if (!certId.trim()) {
      setVerifyFeedback('Please input a valid Certificate / ID Number.');
      return;
    }

    setIsVerifying(true);
    setVerifyFeedback(null);

    try {
      const res = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: certId.trim() })
      });
      const data = await res.json();

      if (data.success && data.record) {
        setIsVerified(true);

        const verifiedTrack = data.record.track || formData.specializationTrack;
        if (!DEFAULT_TRACKS.includes(verifiedTrack)) {
          setIsCustomTrack(true);
        }

        setFormData((prev) => ({
          ...prev,
          firstName: data.record.firstName || prev.firstName,
          lastName: data.record.lastName || prev.lastName,
          institution: data.record.institution || prev.institution,
          discipline: data.record.discipline || prev.discipline,
          specializationTrack: verifiedTrack,
        }));
        setVerifyFeedback('✓ ID verified against database! Verified fields auto-locked.');
      } else {
        setIsVerified(false);
        setVerifyFeedback(data.message || 'ID not located. You can enter details manually.');
      }
    } catch {
      setIsVerified(false);
      setVerifyFeedback('Verification service temporarily unreachable. Manual input enabled.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please verify.');
      return;
    }

    if (!formData.specializationTrack.trim()) {
      alert('Please select or specify a specialization track.');
      return;
    }

    if (!formData.stateOfResidence.trim()) {
      alert('Please select or specify your state or region.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register-intern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          educationLevel: formData.educationLevel,
          institution: formData.institution,
          discipline: formData.discipline,
          workExperience: formData.experienceYears,
          specializationTrack: formData.specializationTrack,
          stateOfResidence: formData.stateOfResidence,
          verifiedCertId: certId.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRegisteredData({
          nhcId: data.nhcId,
          subdomainHandle: data.subdomainHandle,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        });
      } else {
        alert(`Registration failed: ${data.message}`);
      }
    } catch {
      alert('Network error connecting to registration service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredData) {
    return (
      <div className="text-center py-5 space-y-4 text-slate-800">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-200">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Identity & Workspace Provisioned
          </span>
          <h3 className="text-lg font-black text-[#512d7c] mt-1.5">
            Welcome to DGG-NexusHub, {registeredData.firstName}!
          </h3>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Assigned NHC ID:</span>
            <span className="font-mono-tech text-[#512d7c] font-black text-sm bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {registeredData.nhcId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Allocated Subdomain:</span>
            <span className="font-mono-tech text-amber-700 font-bold flex items-center space-x-1">
              <span>{registeredData.subdomainHandle}.nexushub.africa</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-bold">Authentication Email:</span>
            <span className="font-semibold text-slate-800">{registeredData.email}</span>
          </div>

          <p className="text-slate-500 text-[11px] leading-relaxed pt-1">
            Your intern profile, live subdomain portfolio, and affiliate downline ledger are ready. Proceed to the terminal to sign into your workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer text-xs"
        >
          Proceed to Terminal Login ➔
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs text-slate-800">
      {/* Header & Step Tracker */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Category</span>
        </button>
        <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-[#512d7c] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
          Step 1 of 2: Intern Profile
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Certificate / Sponsor ID Box with Inline Verify Action */}
        <div className="p-3.5 rounded-2xl bg-purple-50/50 border-2 border-purple-200/80 space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-[#512d7c]">
            EXTERNAL CERTIFICATE / SPONSOR ID NUMBER (OPTIONAL LOOKUP)
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. DGG-TN-20250903"
              className="w-full h-11 pl-3.5 pr-24 bg-white border border-purple-200 rounded-xl font-mono-tech text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
            <button
              type="button"
              onClick={handleVerifyCert}
              disabled={isVerifying}
              className="absolute right-1.5 px-4 h-8 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isVerified ? (
                <CheckCircle2 className="w-3 h-3 text-[#f2b42c]" />
              ) : (
                <ShieldCheck className="w-3 h-3" />
              )}
              <span>{isVerifying ? 'Checking...' : isVerified ? 'Verified' : 'Verify'}</span>
            </button>
          </div>
          {verifyFeedback && (
            <p
              className={`text-[10px] font-medium leading-tight ${
                isVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {verifyFeedback}
            </p>
          )}
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">First Name *</label>
            <input
              required
              type="text"
              readOnly={isVerified}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Amina"
              className={`w-full p-2.5 border rounded-xl font-medium ${
                isVerified ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Last Name *</label>
            <input
              required
              type="text"
              readOnly={isVerified}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Bello"
              className={`w-full p-2.5 border rounded-xl font-medium ${
                isVerified ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Corporate / Personal Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Corporate / Campus Email *</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="amina.bello@ui.edu.ng"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Phone Number *</label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234 803 123 4567"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono-tech"
            />
          </div>
        </div>

        {/* Academic Details: Education Level & School */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Current Education Level *</label>
            <select
              value={formData.educationLevel}
              onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option>Undergraduate (100 - 500 Level)</option>
              <option>JUPEB / Direct Entry Candidate</option>
              <option>Polytechnic (ND / HND)</option>
              <option>B.Sc Graduate / NYSC Corp Member</option>
              <option>Postgraduate / Professional Master</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">School / Institution *</label>
            <input
              required
              type="text"
              readOnly={isVerified}
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g. University of Jos"
              className={`w-full p-2.5 border rounded-xl font-medium ${
                isVerified ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
        </div>

        {/* Discipline of Study & Work Experience Years */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Discipline of Study *</label>
            <input
              required
              type="text"
              readOnly={isVerified}
              value={formData.discipline}
              onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
              placeholder="e.g. Mass Communication / Computer Science"
              className={`w-full p-2.5 border rounded-xl font-medium ${
                isVerified ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Work Experience *</label>
            <select
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              <option>0 (Fresher / Entry Level)</option>
              <option>1 Year Practical Experience</option>
              <option>2 Years Experience</option>
              <option>3+ Years Intermediate Professional</option>
            </select>
          </div>
        </div>

        {/* Track & State of Residence (Both with Custom Inputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Specialization Track *</label>
            <select
              disabled={isVerified}
              value={isCustomTrack ? 'CUSTOM' : formData.specializationTrack}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomTrack(true);
                  setFormData({ ...formData, specializationTrack: '' });
                } else {
                  setIsCustomTrack(false);
                  setFormData({ ...formData, specializationTrack: e.target.value });
                }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              {DEFAULT_TRACKS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="CUSTOM">Other (Specify Custom Track)...</option>
            </select>

            {isCustomTrack && !isVerified && (
              <input
                required
                type="text"
                value={formData.specializationTrack}
                onChange={(e) => setFormData({ ...formData, specializationTrack: e.target.value })}
                placeholder="e.g. TRK-08: AI Automation Specialist"
                className="w-full mt-2 p-2 bg-white border border-[#512d7c] rounded-xl font-bold text-slate-900"
              />
            )}
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">State / Region of Residence *</label>
            <select
              value={isCustomState ? 'OTHER' : formData.stateOfResidence}
              onChange={(e) => {
                if (e.target.value === 'OTHER') {
                  setIsCustomState(true);
                  setFormData({ ...formData, stateOfResidence: '' });
                } else {
                  setIsCustomState(false);
                  setFormData({ ...formData, stateOfResidence: e.target.value });
                }
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            >
              {POPULAR_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
              <option value="OTHER">Other (Specify Custom Region)...</option>
            </select>

            {isCustomState && (
              <input
                required
                type="text"
                value={formData.stateOfResidence}
                onChange={(e) => setFormData({ ...formData, stateOfResidence: e.target.value })}
                placeholder="e.g. Kaduna State or Accra, Ghana"
                className="w-full mt-2 p-2 bg-white border border-[#512d7c] rounded-xl font-medium text-slate-900"
              />
            )}
          </div>
        </div>

        {/* Password & Repeat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Password (Min. 6 chars) *</label>
            <input
              required
              minLength={6}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1">Confirm Password *</label>
            <input
              required
              minLength={6}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer mt-3 flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering Intern Profile...</span>
            </>
          ) : (
            <span>Proceed to Workspace & Downline Setup ➔</span>
          )}
        </button>
      </form>
    </div>
  );
}