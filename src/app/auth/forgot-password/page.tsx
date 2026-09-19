'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import BackgroundHUD from '@/components/auth/BackgroundHUD';
import { ArrowLeft, CheckCircle2, Mail, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#07020d] text-white overflow-y-auto lg:overflow-hidden flex items-center justify-center relative p-4 pb-32 pt-24 lg:py-4 selection:bg-[#f2b42c] selection:text-[#512d7c]">
      {/* 1. Full-screen Background HUD Layer */}
      <BackgroundHUD />

      {/* 2. Main Recovery Card (Matching Landing Page Frosted Surface) */}
      <main className="w-full max-w-[540px] z-20 transition-all duration-300 my-auto">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-2 border border-white/20">
            <span className="text-[#512d7c] text-2xl font-black font-mono">D</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Password Recovery Vault
          </h1>
          <p className="text-xs text-white/70 mt-1">D Global Growthfield Security Clearance</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] text-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-1 text-slate-500 hover:text-[#512d7c] font-bold transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#512d7c] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Security Protocol
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-[#512d7c]">Reset Your Password</h3>
            <p className="text-slate-500 text-[11px]">
              Enter your registered corporate or personal email to receive a secure recovery link.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-6 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-sm font-bold text-slate-900">Recovery Link Sent!</h3>
              <p className="text-xs text-slate-500">
                Check your inbox at <span className="text-slate-900 font-mono font-bold">{email}</span> for instructions to update your password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">Registered Account Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@dglobalgrowthfield.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <span>{loading ? 'Dispatching Recovery Link...' : 'Send Password Reset Link ➔'}</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}