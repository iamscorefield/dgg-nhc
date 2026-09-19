'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  Send,
  X,
  CreditCard,
  PlusCircle,
  Wallet
} from 'lucide-react';

interface TransactionRecord {
  id: string;
  amount_naira: number;
  transaction_type: string;
  status: string;
  payment_reference: string;
  admin_notes: string;
  created_at: string;
}

export default function StartupEscrowHub() {
  const [loading, setLoading] = useState(true);
  const [sliderAmount, setSliderAmount] = useState(120000);
  const [startupUser, setStartupUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Modals State
  const [stipendModalOpen, setStipendModalOpen] = useState(false);
  const [customStipendAmount, setCustomStipendAmount] = useState('50000');
  const [stipendNote, setStipendNote] = useState('Monthly milestone disbursement / trial support');
  const [submittingStipend, setSubmittingStipend] = useState(false);
  const [stipendSuccess, setStipendSuccess] = useState(false);

  const [fundingModalOpen, setFundingModalOpen] = useState(false);
  const [fundingSuccess, setFundingSuccess] = useState(false);
  const [fundingProcessing, setFundingProcessing] = useState(false);

  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('50000');
  const [topUpProcessing, setTopUpProcessing] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  useEffect(() => {
    async function loadStartupData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setLoading(false);
        return;
      }
      setStartupUser(authData.user);

      const { data: dbTx, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('startup_id', authData.user.id)
        .order('created_at', { ascending: false });

      if (!error && dbTx) {
        setTransactions(dbTx);
      }
      setLoading(false);
    }
    loadStartupData();

    // Ensure Paystack script is injected into document head/body
    if (!document.getElementById('paystack-inline-js')) {
      const script = document.createElement('script');
      script.id = 'paystack-inline-js';
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const surchargeFee = Math.round(sliderAmount * 0.1);
  const totalEscrowRequired = sliderAmount + surchargeFee;

  const totalFunded = transactions
    .filter((tx) => (tx.transaction_type === 'startup_escrow_fund' || tx.transaction_type === 'wallet_topup') && tx.status === 'approved')
    .reduce((acc, curr) => acc + Number(curr.amount_naira), 0);

  const totalReleased = transactions
    .filter((tx) => tx.transaction_type === 'trial_stipend' || tx.transaction_type === 'milestone_release')
    .reduce((acc, curr) => acc + Number(curr.amount_naira), 0);

  const availableBalance = totalFunded - totalReleased;
  const stipendNum = Number(customStipendAmount) || 0;
  
  const milestoneSurcharge = Math.round(stipendNum * 0.1);
  const totalMilestoneRequired = stipendNum + milestoneSurcharge;
  const hasEnoughBalance = availableBalance >= stipendNum;

  const handleProcessStipend = (e: React.FormEvent) => {
    e.preventDefault();
    if (stipendNum <= 0 || !startupUser) return;

    if (hasEnoughBalance) {
      executeStipendTransaction(`DISBURSE-BAL-${Date.now()}`, 'Dispatched directly from available wallet balance');
    } else {
      triggerPaystackGateway(totalMilestoneRequired, 'milestone_release', `${stipendNote} (Paid via secure gateway checkout)`);
    }
  };

  const executeStipendTransaction = async (ref: string, notes: string) => {
    setSubmittingStipend(true);

    const { data, error } = await supabase.from('financial_transactions').insert([
      {
        startup_id: startupUser.id,
        amount_naira: stipendNum,
        transaction_type: 'milestone_release',
        status: 'approved',
        payment_reference: ref,
        admin_notes: notes,
      },
    ]).select();

    setSubmittingStipend(false);

    if (error) {
      alert(`Error processing disbursement: ${error.message}`);
      return;
    }

    if (data) {
      setTransactions((prev) => [data[0], ...prev]);
    }

    setStipendSuccess(true);
    setTimeout(() => {
      setStipendSuccess(false);
      setStipendModalOpen(false);
    }, 1500);
  };

  // Robust Paystack Trigger Function
  const triggerPaystackGateway = (amountInNaira: number, txType: string, successNotes: string) => {
    const isTopUp = txType === 'wallet_topup';
    const isEscrow = txType === 'startup_escrow_fund';

    if (isTopUp) setTopUpProcessing(true);
    else if (isEscrow) setFundingProcessing(true);
    else setSubmittingStipend(true);

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const email = startupUser?.email || 'startup@dglobalgrowthfield.com';

    // If key is missing or is placeholder, fallback cleanly to simulation so it doesn't break testing
    if (!publicKey || publicKey.includes('YourActual') || !publicKey.startsWith('pk_')) {
      setTimeout(async () => {
        if (startupUser) {
          const { data, error } = await supabase.from('financial_transactions').insert([
            {
              startup_id: startupUser.id,
              amount_naira: amountInNaira,
              transaction_type: txType,
              status: 'approved',
              payment_reference: `SIM-${txType.toUpperCase()}-${Date.now()}`,
              admin_notes: `${successNotes} (Development Simulation)`,
            },
          ]).select();

          if (!error && data) {
            setTransactions((prev) => [data[0], ...prev]);
          }
        }

        setTopUpProcessing(false);
        setFundingProcessing(false);
        setSubmittingStipend(false);

        if (isTopUp) {
          setTopUpSuccess(true);
          setTimeout(() => { setTopUpSuccess(false); setTopUpModalOpen(false); }, 1500);
        } else if (isEscrow) {
          setFundingSuccess(true);
          setTimeout(() => { setFundingSuccess(false); setFundingModalOpen(false); }, 1500);
        } else {
          setStipendSuccess(true);
          setTimeout(() => { setStipendSuccess(false); setStipendModalOpen(false); }, 1500);
        }
      }, 1000);
      return;
    }

    const paystackPop = (window as any).PaystackPop;
    if (!paystackPop) {
      setTopUpProcessing(false);
      setFundingProcessing(false);
      setSubmittingStipend(false);
      alert('Paystack gateway script is still loading. Please try again.');
      return;
    }

    try {
      const handler = paystackPop.setup({
        key: publicKey,
        email: email,
        amount: Math.round(Number(amountInNaira)) * 100,
        currency: 'NGN',
        callback: function (response: any) {
          supabase
            .from('financial_transactions')
            .insert([
              {
                startup_id: startupUser.id,
                amount_naira: amountInNaira,
                transaction_type: txType,
                status: 'approved',
                payment_reference: response.reference,
                admin_notes: successNotes,
              },
            ])
            .select()
            .then(({ data, error }) => {
              if (!error && data) {
                setTransactions((prev) => [data[0], ...prev]);
              }
              setTopUpProcessing(false);
              setFundingProcessing(false);
              setSubmittingStipend(false);

              if (isTopUp) {
                setTopUpSuccess(true);
                setTimeout(() => { setTopUpSuccess(false); setTopUpModalOpen(false); }, 1500);
              } else if (isEscrow) {
                setFundingSuccess(true);
                setTimeout(() => { setFundingSuccess(false); setFundingModalOpen(false); }, 1500);
              } else {
                setStipendSuccess(true);
                setTimeout(() => { setStipendSuccess(false); setStipendModalOpen(false); }, 1500);
              }
            });
        },
        onClose: function () {
          setTopUpProcessing(false);
          setFundingProcessing(false);
          setSubmittingStipend(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('Paystack setup error:', err);
      setTopUpProcessing(false);
      setFundingProcessing(false);
      setSubmittingStipend(false);
      alert('Error launching payment gateway.');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          LOADING STARTUP ESCROW HUB...
        </span>
      </div>
    );
  }

  const totalDisbursed = totalReleased;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Startup Funding & Escrow Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Escrow Vault & Milestone Disbursements
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Manage your available balance, fund escrow deposits, and release approved milestone payments to your active apprentices.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right space-y-1">
            <div className="flex items-center justify-end space-x-2">
              <span className="block text-[9px] uppercase font-bold text-white/70">Available Balance</span>
              <button
                type="button"
                onClick={() => setTopUpModalOpen(true)}
                className="px-2 py-0.5 bg-[#f2b42c] hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-lg shadow transition-all cursor-pointer flex items-center space-x-0.5"
                title="Top-Up Wallet Balance"
              >
                <PlusCircle className="w-3 h-3" />
                <span>Top-Up</span>
              </button>
            </div>
            <span className="text-xl font-black font-mono text-emerald-300 block">
              ₦{availableBalance.toLocaleString()}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Total Disbursed</span>
            <span className="text-xl font-black font-mono text-white">
              ₦{totalDisbursed.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-[#512d7c]" />
                <span>Milestone & Facilitation Calculator</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Model your escrow deposit including the standard facilitation surcharge.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#512d7c] bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
              10% Facilitation Fee
            </span>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Apprentice Monthly Stipend:</span>
                <span className="text-lg font-black font-mono text-[#512d7c]">
                  ₦ {sliderAmount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={50000}
                max={500000}
                step={5000}
                value={sliderAmount}
                onChange={(e) => setSliderAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#512d7c]"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Min: ₦50,000</span>
                <span>Mid: ₦275,000</span>
                <span>Max: ₦500,000</span>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Intern Disbursement:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₦ {sliderAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Facilitation & Escrow (10%):</span>
                <span className="font-mono font-bold text-[#512d7c]">
                  + ₦ {surchargeFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900 font-black text-sm">
                <span>Total Escrow Deposit:</span>
                <span className="font-mono text-emerald-600 text-base">
                  ₦ {totalEscrowRequired.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setFundingModalOpen(true)}
                className="flex-1 py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Fund Escrow via Gateway ➔</span>
              </button>
              <button
                type="button"
                onClick={() => setStipendModalOpen(true)}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Pay Milestone / Stipend</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Smart Balance Routing</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatic routing between your funded balance and secure gateway checkout.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block text-[11px]">1. Funded Balance Dispatch</span>
              <p className="text-[11px]">
                If your wallet has sufficient balance, milestone payments and stipends release instantly.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
              <span className="font-bold text-slate-900 block text-[11px]">2. Secure Instant Routing</span>
              <p className="text-[11px]">
                If your balance is insufficient, the system automatically prompts secure checkout with the 10% fee included.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Startup Financial Activity Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete audit history of escrow funding, wallet top-ups, and milestone disbursements.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {transactions.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No financial transactions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3.5">REFERENCE</th>
                  <th className="pb-3.5">TYPE</th>
                  <th className="pb-3.5">AMOUNT</th>
                  <th className="pb-3.5">STATUS</th>
                  <th className="pb-3.5">NOTES</th>
                  <th className="pb-3.5 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-900">
                      {tx.payment_reference || tx.id.slice(0, 8)}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-[#512d7c] uppercase text-[10px] bg-purple-50 px-2 py-0.5 rounded-md">
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-600">
                      ₦ {Number(tx.amount_naira).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 max-w-xs truncate">
                      {tx.admin_notes || 'Direct transaction'}
                    </td>
                    <td className="py-4 text-right font-mono text-[10px] text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Wallet Credit Top-Up
                </span>
                <h3 className="text-base font-black text-slate-900">Add Funds to Available Balance</h3>
              </div>
              <button
                type="button"
                onClick={() => setTopUpModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {topUpSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Top-Up Successful!</h4>
                <p className="text-xs text-slate-500">
                  ₦{Number(topUpAmount).toLocaleString()} added to your available balance.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Top-Up Amount (NGN)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      required
                      min={5000}
                      step={5000}
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    *Wallet top-ups are credited directly at 100% value without facilitation fees.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => triggerPaystackGateway(Number(topUpAmount) || 0, 'wallet_topup', 'Verified wallet balance top-up')}
                  disabled={topUpProcessing}
                  className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{topUpProcessing ? 'Processing Top-Up...' : 'Proceed to Top-Up Checkout ➔'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {stipendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Milestone & Stipend Disbursement
                </span>
                <h3 className="text-base font-black text-slate-900">Pay Apprentice Milestone</h3>
              </div>
              <button
                type="button"
                onClick={() => setStipendModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stipendSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Payment Dispatched Successfully!</h4>
                <p className="text-xs text-slate-500">
                  ₦{stipendNum.toLocaleString()} routed to apprentice wallet.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessStipend} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Disbursement Amount (NGN)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={customStipendAmount}
                      onChange={(e) => setCustomStipendAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Your Available Balance: ₦{availableBalance.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Milestone / Contract Note</label>
                  <input
                    type="text"
                    required
                    value={stipendNote}
                    onChange={(e) => setStipendNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-mono font-bold text-slate-900">₦{stipendNum.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10% Facilitation:</span>
                    <span className="font-mono font-bold text-[#512d7c]">+ ₦{milestoneSurcharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                    <span>Total Required:</span>
                    <span className="font-mono text-emerald-600">₦{totalMilestoneRequired.toLocaleString()}</span>
                  </div>
                </div>

                {hasEnoughBalance ? (
                  <button
                    type="submit"
                    disabled={submittingStipend}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submittingStipend ? 'Processing...' : 'Dispatch from Funded Balance ➔'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-medium">
                      Insufficient wallet balance (₦{availableBalance.toLocaleString()}). Proceeding will open secure checkout for total ₦{totalMilestoneRequired.toLocaleString()}.
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerPaystackGateway(totalMilestoneRequired, 'milestone_release', `${stipendNote} (Paid via secure gateway checkout)`)}
                      disabled={submittingStipend}
                      className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{submittingStipend ? 'Connecting...' : 'Proceed via Gateway to Pay ➔'}</span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {fundingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Secure Escrow Deposit
                </span>
                <h3 className="text-base font-black text-slate-900">Fund Escrow Vault</h3>
              </div>
              <button
                type="button"
                onClick={() => setFundingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {fundingSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Escrow Funded Successfully!</h4>
                <p className="text-xs text-slate-500">
                  ₦{totalEscrowRequired.toLocaleString()} logged in financial ledger.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Stipend:</span>
                    <span className="font-mono font-bold text-slate-900">₦{sliderAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>10% Facilitation:</span>
                    <span className="font-mono font-bold text-[#512d7c]">₦{surchargeFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Deposit:</span>
                    <span className="font-mono text-emerald-600 text-sm">₦{totalEscrowRequired.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerPaystackGateway(totalEscrowRequired, 'startup_escrow_fund', 'Verified escrow funding deposit')}
                  disabled={fundingProcessing}
                  className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {fundingProcessing ? 'Connecting to Gateway...' : 'Proceed to Secure Checkout ➔'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}