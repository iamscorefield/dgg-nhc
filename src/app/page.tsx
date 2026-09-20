'use client';

import React, { useState } from 'react';
import BackgroundHUD from '@/components/auth/BackgroundHUD';
import StrategicModal from '@/components/shared/StrategicModal';
import Card0Selector from '@/components/auth/Card0Selector';
import Card1InternSignup from '@/components/auth/Card1InternSignup';
import Card2StartupSignup from '@/components/auth/Card2StartupSignup';
import CardSignIn from '@/components/auth/CardSignIn';
import { useRouter } from 'next/navigation';

export default function OnboardingGateway() {
  const router = useRouter();
  const [authState, setAuthState] = useState<'signin' | 'selector' | 'intern_signup' | 'startup_signup'>('signin');
  const [modalType, setModalType] = useState<'terms' | 'workflow' | null>(null);

  return (
    <div className="min-h-screen bg-[#07020d] text-white overflow-y-auto lg:overflow-hidden flex items-center justify-center relative p-4 pb-32 pt-24 lg:py-4 selection:bg-[#f2b42c] selection:text-[#512d7c]">
      {/* 1. Full-screen Background HUD Layer */}
      <BackgroundHUD />

      {/* 2. Main Authentication Card (High-Fidelity Semi-Frosted Surface) */}
      <main className="w-full max-w-[540px] z-20 transition-all duration-300 my-auto">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-2 border border-white/20 overflow-hidden">
             <img src="/dgg-logo.png" alt="DGG-NexusHub Logo" className="w-full h-full object-contain p-1.5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Welcome to DGG Nexus-Hub
          </h1>
          <p className="text-xs text-white/70 mt-1">Pan-African Campus Talent & Enterprise Gateway</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] text-slate-800">
          {authState === 'signin' && (
            <CardSignIn
              onBack={() => setAuthState('selector')}
              onSwitchToSignup={() => setAuthState('selector')}
              onSuccess={(role) => {
                if (role === 'admin') router.push('/admin');
                else if (role === 'entrepreneur') router.push('/startup');
                else router.push('/intern');
              }}
            />
          )}

          {authState === 'selector' && (
            <Card0Selector
              onSelectRole={(role) => {
                if (role === 'intern') setAuthState('intern_signup');
                else setAuthState('startup_signup');
              }}
              onSwitchToLogin={() => setAuthState('signin')}
            />
          )}

          {authState === 'intern_signup' && (
            <Card1InternSignup
              onBack={() => setAuthState('selector')}
              onSuccess={() => setAuthState('signin')}
            />
          )}

          {authState === 'startup_signup' && (
            <Card2StartupSignup
              onBack={() => setAuthState('selector')}
              onSuccess={() => setAuthState('signin')}
            />
          )}
        </div>
      </main>

      {/* 3. Strategic Footer Hub */}
      <footer className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 text-center w-full">
        {/* Left: Modal Triggers */}
        <div className="flex items-center justify-center gap-6 text-[11px] sm:text-xs font-bold tracking-wide w-full md:w-auto order-1">
          <button
            type="button"
            onClick={() => setModalType('terms')}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            Terms & Conditions <span className="text-[10px] text-[#f2b42c]">→</span>
          </button>
          <button
            type="button"
            onClick={() => setModalType('workflow')}
            className="text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            How It Works <span className="text-[10px] text-[#f2b42c]">→</span>
          </button>
        </div>

        {/* Center: Copyright */}
        <div className="text-[10px] sm:text-[11px] font-medium text-white/40 tracking-wide order-3 md:order-2 w-full md:w-auto">
          &copy; 2026 D-Global Growthfield. All Rights Reserved.
        </div>

        {/* Right: Real Ecosystem Links */}
        <div className="flex items-center justify-center md:items-end gap-x-5 text-[11px] sm:text-xs font-bold w-full md:w-auto order-2 md:order-3">
          <a
            href="https://dglobalgrowthfield.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f2b42c] hover:underline inline-flex items-center gap-1"
          >
            Visit Website <span className="text-[9px]">→</span>
          </a>
          <a
            href="https://learning.dglobalgrowthfield.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline inline-flex items-center gap-1"
          >
            Visit LMS <span className="text-[9px]">→</span>
          </a>
        </div>
      </footer>

      {/* 4. Center-Pinned Window System */}
      <StrategicModal type={modalType} onClose={() => setModalType(null)} />
    </div>
  );
}