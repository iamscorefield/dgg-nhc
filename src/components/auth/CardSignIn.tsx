'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Loader2, ArrowLeft, Lock, Mail, Calendar, Clock, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

interface CardSignInProps {
  onBack?: () => void;
  onSwitchToSignup?: () => void;
  onSuccess?: (role: string) => void;
}

export default function CardSignIn({ onBack, onSwitchToSignup, onSuccess }: CardSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pending assessment state for startups
  const [pendingStartup, setPendingStartup] = useState<{
    companyName: string;
    rcNumber: string;
    assessmentDate: string;
    assessmentTime: string;
    corporateEmail: string;
  } | null>(null);

  const handleGoToSignup = () => {
    if (onSwitchToSignup) {
      onSwitchToSignup();
    } else if (onBack) {
      onBack();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: otpCode.trim(),
      type: 'email',
    });

    if (error || !data.user) {
      setErrorMessage(error?.message || 'Invalid or expired verification code.');
      setLoading(false);
      return;
    }

    await routeUserAfterAuth(data.user.id, cleanEmail);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError || !authData.user) {
        setErrorMessage(authError?.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      await routeUserAfterAuth(authData.user.id, cleanEmail);
    } catch (err: any) {
      console.error('Sign-in exception:', err);
      setErrorMessage(err?.message || 'Network or server error during sign-in.');
      setLoading(false);
    }
  };

  const routeUserAfterAuth = async (userId: string, cleanEmail: string) => {
    let { data: profile } = await supabase
      .from('profiles')
      .select('role, status, first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: fallbackProfile } = await supabase
        .from('profiles')
        .select('role, status, first_name, last_name')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (fallbackProfile) {
        profile = fallbackProfile;
      } else {
        setErrorMessage('Profile record not found for this account.');
        setLoading(false);
        return;
      }
    }

    if (profile.role === 'entrepreneur' && profile.status === 'pending_assessment') {
      const { data: startup } = await supabase
        .from('startup_profiles')
        .select('company_name, rc_number, assessment_date, assessment_time, corporate_email')
        .eq('id', userId)
        .maybeSingle();

      setPendingStartup({
        companyName: startup?.company_name || 'Your Enterprise',
        rcNumber: startup?.rc_number || 'RC Pending',
        assessmentDate: startup?.assessment_date || 'Upcoming Slot',
        assessmentTime: startup?.assessment_time || '10:00 AM WAT',
        corporateEmail: startup?.corporate_email || cleanEmail,
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    if (profile.role === 'admin') {
      if (onSuccess) onSuccess('admin');
      router.push('/admin');
    } else if (profile.role === 'entrepreneur') {
      if (onSuccess) onSuccess('entrepreneur');
      router.push('/startup');
    } else {
      if (onSuccess) onSuccess('intern');
      router.push('/intern');
    }
  };

  if (pendingStartup) {
    return (
      <div className="text-center py-4 space-y-4 text-slate-800">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
            Intake Orientation Underway
          </span>
          <h3 className="text-base font-black text-[#512d7c] mt-1.5">
            Briefing Pending for {pendingStartup.companyName}
          </h3>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2">
          <p className="text-slate-600">
            <span className="font-bold text-slate-900">Registration Status:</span> Intake received & verified ({pendingStartup.rcNumber}).
          </p>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[#512d7c] font-black text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Scheduled Briefing Call</span>
            </div>
            <p className="font-mono text-amber-900 font-bold text-xs pl-5">
              {pendingStartup.assessmentDate} at {pendingStartup.assessmentTime}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPendingStartup(null)}
          className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
        >
          Sign In With Another Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={handleGoToSignup}
          className="inline-flex items-center space-x-1 text-slate-500 hover:text-[#512d7c] font-bold transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Category</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setUseOtpMode(!useOtpMode);
            setOtpSent(false);
            setErrorMessage(null);
          }}
          className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 hover:bg-purple-100 cursor-pointer"
        >
          {useOtpMode ? 'Switch to Password Sign-In' : 'Use Email OTP (2FA)'}
        </button>
      </div>

      <div>
        <h3 className="text-base font-black text-[#512d7c]">
          {useOtpMode ? 'Secure Email OTP Sign-In' : ' Sign-In...'}
        </h3>
        <p className="text-slate-500 text-[11px]">
          {useOtpMode ? 'Receive a secure 6-digit login code via email.' : 'Access your Intern Workspace or Startup/Entreprenuer Hiring Portal.'}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {useOtpMode ? (
        !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-3.5">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Corporate / Registered Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@dglobalgrowthfield.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Login OTP Code ➔</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3.5">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>OTP code sent to <strong className="font-mono">{email}</strong></span>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Enter 6-Digit Verification Code</label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Code & Enter Terminal ➔</span>}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleSignIn} className="space-y-3.5">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Corporate / Registered Email</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@dglobalgrowthfield.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-600 font-bold">Access Password</label>
              <Link href="/auth/forgot-password" className="text-[11px] font-bold text-[#512d7c] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#512d7c] to-[#ff7a00] hover:opacity-95 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer mt-2 flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Authorize & Enter Terminal ➔</span>}
          </button>
        </form>
      )}

      <div className="pt-2 text-center border-t border-slate-100">
        <p className="text-slate-500 text-[11px]">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={handleGoToSignup}
            className="text-[#512d7c] font-bold hover:underline cursor-pointer inline-flex items-center space-x-1"
          >
            <span>Create an Account</span>
          </button>
        </p>
      </div>
    </div>
  );
}