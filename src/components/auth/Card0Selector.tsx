'use client';

import React from 'react';
import { GraduationCap, Building2, LogIn, ArrowRight } from 'lucide-react';

interface Card0SelectorProps {
  onSelectRole: (role: 'intern' | 'startup') => void;
  onSwitchToLogin: () => void;
}

export default function Card0Selector({ onSelectRole, onSwitchToLogin }: Card0SelectorProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Select Registration Category
        </h2>
        <p className="text-xs text-slate-500">
          Choose your track to begin verified onboarding into the NexusHub Ecosystem
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {/* Option 1: Student / Intern */}
        <button
          type="button"
          onClick={() => onSelectRole('intern')}
          className="w-full group p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-purple-50/60 border-2 border-slate-200 hover:border-[#512d7c] transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#512d7c] text-[#f2b42c] flex items-center justify-center font-bold shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#512d7c] transition-colors">
                Student Intern & Affiliate Partner
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Tuition-free tech tracks, verified NHC credentials & 3-month startup matching
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#512d7c] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>

        {/* Option 2: Entrepreneur / Startup */}
        <button
          type="button"
          onClick={() => onSelectRole('startup')}
          className="w-full group p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border-2 border-slate-200 hover:border-[#f2b42c] transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#f2b42c] text-[#512d7c] flex items-center justify-center font-bold shrink-0 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#512d7c] transition-colors">
                Entrepreneur & Hiring Enterprise
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Access certified cross-disciplinary talent with mandatory executive assessment
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#f2b42c] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
        </button>
      </div>

      <div className="pt-4 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center space-x-2 text-xs font-bold text-[#512d7c] hover:underline cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Already registered? Sign In to Workspace</span>
        </button>
      </div>
    </div>
  );
}