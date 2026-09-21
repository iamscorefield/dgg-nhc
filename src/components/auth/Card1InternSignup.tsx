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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
        setVerifyFeedback('✓ ID verified! Name and academic fields auto-locked.');
      } else {
        setIsVerified(false);
        setVerifyFeedback(data.message || 'ID not located. You can enter details manually.');
      }
    } catch {
      setIsVerified(false);
      setVerifyFeedback('Verification service unreachable. Manual input enabled.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.firstName.trim()) {
      alert('Please complete the verification or enter your name.');
      return;
    }
    if (currentStep === 2 && (!formData.email.trim() || !formData.phone.trim())) {
      alert('Please provide your email and phone number.');
      return;
    }
    if (currentStep === 3 && (!formData.institution.trim() || !formData.discipline.trim())) {
      alert('Please complete your academic institutional details.');
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

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match. Please verify.');
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
      <div className="text-center py-5 space-y-4 text-white">
        <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-emerald-500/30">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Identity & Workspace Provisioned
          </span>
          <h3 className="text-lg font-black text-white mt-1.5">
            Welcome to DGG-NexusHub, {registeredData.firstName}!
          </h3>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-left space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/60 font-bold">Assigned NHC ID:</span>
            <span className="font-mono-tech text-[#f2b42c] font-black text-sm bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              {registeredData.nhcId}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/60 font-bold">Allocated Subdomain:</span>
            <span className="font-mono-tech text-amber-300 font-bold flex items-center space-x-1">
              <span>{registeredData.subdomainHandle}.nexushub.africa</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <span className="text-white/60 font-bold">Authentication Email:</span>
            <span className="font-semibold text-white">{registeredData.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer text-xs border border-white/10"
        >
          Proceed to Terminal Login ➔
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs text-white">
      {/* Header & Step Progress Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={handlePrevStep}
          className="inline-flex items-center space-x-1 text-white/60 hover:text-white font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{currentStep === 1 ? 'Category' : 'Back'}</span>
        </button>
        <span className="text-[10px] font-mono-tech font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
          Step {currentStep} of {totalSteps}: Intern Profile
        </span>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#f2b42c] transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* STEP 1: CERTIFICATE ID & NAMES */}
        {currentStep === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#f2b42c]">
                Input your Valid CERTIFICATE ID
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder="e.g. DGG-TN-20250903"
                  className="w-full h-11 pl-3.5 pr-24 bg-white/12 border border-white/10 rounded-xl font-mono-tech text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#f2b42c]"
                />
                <button
                  type="button"
                  onClick={handleVerifyCert}
                  disabled={isVerifying}
                  className="absolute right-1.5 px-4 h-8 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-50 border border-white/20"
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
                <p className={`text-[10px] font-medium leading-tight ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {verifyFeedback}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">First Name *</label>
                <input
                  required
                  type="text"
                  readOnly={isVerified}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Amina"
                  className={`w-full p-2.5 border rounded-xl font-medium text-white placeholder:text-white/40 ${isVerified ? 'bg-white/5 border-white/20 text-white/70' : 'bg-white/12 border-white/10'}`}
                />
              </div>
              <div>
                <label className="block text-white/80 font-bold mb-1">Last Name *</label>
                <input
                  required
                  type="text"
                  readOnly={isVerified}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Bello"
                  className={`w-full p-2.5 border rounded-xl font-medium text-white placeholder:text-white/40 ${isVerified ? 'bg-white/5 border-white/20 text-white/70' : 'bg-white/12 border-white/10'}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONTACT & CREDENTIALS */}
        {currentStep === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">Corporate / Campus Email *</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="amina.bello@ui.edu.ng"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-medium text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <label className="block text-white/80 font-bold mb-1">Phone Number *</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 803 123 4567"
                className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl font-mono-tech text-white placeholder:text-white/40"
              />
            </div>
          </div>
        )}

        {/* STEP 3: ACADEMIC DETAILS & TRACKS */}
        {currentStep === 3 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">Education Level *</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value })}
                  className="w-full p-2.5 bg-[#0d0614] border border-white/10 rounded-xl font-bold text-white cursor-pointer"
                >
                  <option className="bg-[#07020d] text-white">Undergraduate (100 - 500 Level)</option>
                  <option className="bg-[#07020d] text-white">JUPEB / Direct Entry Candidate</option>
                  <option className="bg-[#07020d] text-white">Polytechnic (ND / HND)</option>
                  <option className="bg-[#07020d] text-white">B.Sc Graduate / NYSC Corp Member</option>
                  <option className="bg-[#07020d] text-white">Postgraduate / Professional Master</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 font-bold mb-1">School / Institution *</label>
                <input
                  required
                  type="text"
                  readOnly={isVerified}
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. University of Jos"
                  className={`w-full p-2.5 border rounded-xl font-medium text-white placeholder:text-white/40 ${isVerified ? 'bg-white/5 border-white/20 text-white/70' : 'bg-white/12 border-white/10'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-bold mb-1">Specialization Track *</label>
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
                className="w-full p-2.5 bg-[#0d0614] border border-white/10 rounded-xl font-bold text-white cursor-pointer"
              >
                {DEFAULT_TRACKS.map((t) => (
                  <option key={t} value={t} className="bg-[#07020d] text-white">{t}</option>
                ))}
                <option value="CUSTOM" className="bg-[#07020d] text-white">Other (Specify Custom Track)...</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 4: PASSWORDS & LOCATION */}
        {currentStep === 4 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <label className="block text-white/80 font-bold mb-1">State / Region of Residence *</label>
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
                className="w-full p-2.5 bg-[#0d0614] border border-white/10 rounded-xl font-bold text-white cursor-pointer"
              >
                {POPULAR_STATES.map((st) => (
                  <option key={st} value={st} className="bg-[#07020d] text-white">{st}</option>
                ))}
                <option value="OTHER" className="bg-[#07020d] text-white">Other (Specify Custom Region)...</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-white/80 font-bold mb-1">Password *</label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-white/12 border border-white/10 rounded-xl text-white placeholder:text-white/40"
                />
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
                  <span>Registering Profile...</span>
                </>
              ) : (
                <span>Complete Registration ➔</span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}