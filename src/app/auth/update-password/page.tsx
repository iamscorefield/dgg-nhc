'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import BackgroundHUD from '@/components/auth/BackgroundHUD';
import { CheckCircle2, Lock, ArrowLeft } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#07020d] text-white overflow-y-auto lg:overflow-hidden flex items-center justify-center relative p-4 pb-32 pt-24 lg:py-4 selection:bg-[#f2b42c] selection:text-[#512d7c]">
      {/* 1. Full-screen Background HUD Layer */}
      <BackgroundHUD />

      {/* 2. Main Update Password Card */}
      <main className="w-full max-w-[540px] z-20 transition-all duration-300 my-auto">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-2 border border-white/20">
            <span className="text-[#512d7c] text-2xl font-black font-mono">D</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
            Security Clearance
          </h1>
          <p className="text-xs text-white/70 mt-1">D Global Growthfield Access Vault</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.6)] text-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Secure Reset Portal
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-[#512d7c]">Set New Password</h3>
            <p className="text-slate-500 text-[11px]">
              Please choose a strong new password to protect your account access.
            </p>
          </div>

          {success ? (
            <div className="text-center py-6 space-y-3 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="text-sm font-bold text-slate-900">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-500">
                Redirecting you securely back to portal...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">New Secure Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                <span>{loading ? 'Updating Password...' : 'Save New Password ➔'}</span>
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}