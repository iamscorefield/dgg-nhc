'use client';

import React from 'react';
import { GraduationCap, Building2, LogIn, ArrowRight } from 'lucide-react';

interface Card0SelectorProps {
  onSelectRole: (role: 'intern' | 'startup') => void;
  onSwitchToLogin: () => void;
}

export default function Card0Selector({ onSelectRole, onSwitchToLogin }: Card0SelectorProps) {
  return (
    <div className="space-y-5 text-white">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Select Registration Category
        </h2>
        <p className="text-xs text-white/60">
          Choose your track to begin verified onboarding into the NexusHub Ecosystem
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {/* Option 1: Student / Intern */}
        <button
          type="button"
          onClick={() => onSelectRole('intern')}
          className="w-full group p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#f2b42c] transition-all text-left flex items-center justify-center cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 w-full">
            <div className="w-12 h-12 rounded-xl bg-[#512d7c] text-[#f2b42c] flex items-center justify-center font-bold shrink-0 shadow-md border border-white/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <h3 className="font-extrabold text-sm text-white group-hover:text-[#f2b42c] transition-colors">
                Student Intern & Affiliate Partner
              </h3>
              <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                Tuition-free tech tracks, verified NHC credentials & 3-month startup matching
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#f2b42c] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </button>

        {/* Option 2: Entrepreneur / Startup */}
        <button
          type="button"
          onClick={() => onSelectRole('startup')}
          className="w-full group p-4 sm:p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#f2b42c] transition-all text-left flex items-center justify-center cursor-pointer"
        >
          <div className="flex items-center space-x-3.5 w-full">
            <div className="w-12 h-12 rounded-xl bg-[#f2b42c] text-[#512d7c] flex items-center justify-center font-bold shrink-0 shadow-md border border-white/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <h3 className="font-extrabold text-sm text-white group-hover:text-[#f2b42c] transition-colors">
                Entrepreneur & Hiring Enterprise
              </h3>
              <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                Access certified cross-disciplinary talent with mandatory executive assessment
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-[#f2b42c] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </div>
        </button>
      </div>

      <div className="pt-4 border-t border-white/10 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#f2b42c] hover:underline cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Already registered? Sign In to Workspace</span>
        </button>
      </div>
    </div>
  );
}