'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Wallet,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Briefcase,
  GraduationCap,
  Share2
} from 'lucide-react';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
}

interface FinancialRecord {
  id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  created_at: string;
}

export default function ModernEarningsWalletPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Balances split by stream
  const [affiliateBalance, setAffiliateBalance] = useState(0);
  const [stipendBalance, setStipendBalance] = useState(0);
  const [placementBalance, setPlacementBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);

  const [transactions, setTransactions] = useState<FinancialRecord[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const uid = authData.user.id;
      setUserId(uid);

      // Fetch profile and transactions from financial_transactions and referral_transactions
      const [
        { data: profile },
        { data: internProfile },
        { data: finTxs },
        { data: refTxs }
      ] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name').eq('id', uid).maybeSingle(),
        supabase.from('intern_profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('financial_transactions').select('*').eq('intern_id', uid),
        supabase.from('referral_transactions').select('*').eq('referrer_id', uid)
      ]);

      const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Apprentice';
      setNewBank((prev) => ({ ...prev, accountName: fullName }));

      // Bank account hydration
      if (internProfile?.payout_bank_name && internProfile?.payout_account_number) {
        setBankAccounts([
          {
            id: 'bank-primary',
            bankName: internProfile.payout_bank_name,
            accountNumber: internProfile.payout_account_number,
            accountName: fullName,
            isPrimary: true,
          },
        ]);
      } else {
        const localBanks = localStorage.getItem(`dgg_banks_${uid}`);
        if (localBanks) {
          try {
            setBankAccounts(JSON.parse(localBanks));
          } catch (e) {
            setBankAccounts([]);
          }
        }
      }

      // Process live transactions & categorize balances
      let affSum = 0;
      let stipSum = 0;
      let placeSum = 0;
      let pendSum = 0;

      const combined: FinancialRecord[] = [];

      // Process general financial transactions (Trial stipends, milestone releases from startups)
      (finTxs || []).forEach((tx: any) => {
        const amt = Number(tx.amount_naira || 0);
        combined.push({
          id: tx.id,
          amount: amt,
          type: tx.transaction_type,
          status: tx.status,
          description: tx.admin_notes || `Incoming ${tx.transaction_type.replace(/_/g, ' ')}`,
          created_at: tx.created_at,
        });

        if (tx.status === 'paid' || tx.status === 'approved') {
          if (tx.transaction_type === 'trial_stipend') stipSum += amt;
          else if (tx.transaction_type === 'milestone_release') placeSum += amt;
        } else {
          pendSum += amt;
        }
      });

      // Process referral affiliate transactions
      (refTxs || []).forEach((tx: any) => {
        const amt = Number(tx.commission_amount || tx.amount || 0);
        combined.push({
          id: tx.id,
          amount: amt,
          type: 'affiliate_commission',
          status: tx.status === 'APPROVED' ? 'paid' : 'pending',
          description: tx.product_name || 'Affiliate Referral Commission',
          created_at: tx.created_at || new Date().toISOString(),
        });

        if (tx.status === 'APPROVED') affSum += amt;
        else pendSum += amt;
      });

      setAffiliateBalance(affSum);
      setStipendBalance(stipSum);
      setPlacementBalance(placeSum);
      setPendingBalance(pendSum);
      setTransactions(combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

      const totalAvailable = affSum + stipSum + placeSum;
      setWithdrawAmount(totalAvailable > 0 ? String(totalAvailable) : '0');
    } catch (err) {
      console.error('Wallet sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const saveBankAccountsToStorage = (accounts: BankAccount[]) => {
    setBankAccounts(accounts);
    if (userId) {
      localStorage.setItem(`dgg_banks_${userId}`, JSON.stringify(accounts));
    }
  };

  const handleLinkBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (bankAccounts.length >= 3) {
      setErrorNotice('You can only link up to 3 bank accounts.');
      return;
    }

    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      setErrorNotice('Please fill in all bank details.');
      return;
    }

    if (newBank.accountNumber.length !== 10) {
      setErrorNotice('NUBAN account number must be exactly 10 digits.');
      return;
    }

    const isFirst = bankAccounts.length === 0;
    const newEntry: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: newBank.bankName,
      accountNumber: newBank.accountNumber,
      accountName: newBank.accountName,
      isPrimary: isFirst,
    };

    const updated = [...bankAccounts, newEntry];
    saveBankAccountsToStorage(updated);

    if (isFirst && userId) {
      await supabase
        .from('intern_profiles')
        .update({
          payout_bank_name: newBank.bankName,
          payout_account_number: newBank.accountNumber,
        })
        .eq('id', userId);
    }

    setNewBank({ bankName: '', accountNumber: '', accountName: newBank.accountName });
    setActionNotice('New settlement account linked successfully.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSetPrimary = async (id: string) => {
    const updated = bankAccounts.map((b) => ({ ...b, isPrimary: b.id === id }));
    saveBankAccountsToStorage(updated);
    const primary = updated.find((b) => b.isPrimary);
    if (primary && userId) {
      await supabase
        .from('intern_profiles')
        .update({ payout_bank_name: primary.bankName, payout_account_number: primary.accountNumber })
        .eq('id', userId);
    }
    setActionNotice('Primary disbursement account updated.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRemoveBank = async (id: string) => {
    const updated = bankAccounts.filter((b) => b.id !== id);
    saveBankAccountsToStorage(updated);
    setActionNotice('Bank account removed.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    const totalAvailable = affiliateBalance + stipendBalance + placementBalance;

    if (amountNum <= 0 || amountNum > totalAvailable) {
      alert('Invalid withdrawal amount or exceeds available balance.');
      return;
    }

    const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
    if (!primaryBank) {
      alert('Please add a primary bank account before withdrawing.');
      return;
    }

    if (!userId) return;
    setWithdrawing(true);

    try {
      const { error } = await supabase.from('financial_transactions').insert({
        intern_id: userId,
        amount_naira: amountNum,
        transaction_type: 'withdrawal_request',
        status: 'pending',
        admin_notes: `NUBAN Withdrawal Request to ${primaryBank.bankName} (${primaryBank.accountNumber})`,
      });

      if (error) {
        alert(`Withdrawal queue error: ${error.message}`);
        setWithdrawing(false);
        return;
      }

      setWithdrawing(false);
      setWithdrawalSuccess(true);
      setTimeout(() => {
        setWithdrawalSuccess(false);
        setShowWithdrawModal(false);
        loadWalletData();
      }, 2500);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING FINANCIAL CLEARINGHOUSE...
        </span>
      </div>
    );
  }

  const totalAvailableBalance = affiliateBalance + stipendBalance + placementBalance;
  const primaryBank = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Top Hero Balance Header */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
          <Wallet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
                Multi-Stream Earnings Wallet
              </span>
            </div>
            <button
              type="button"
              onClick={loadWalletData}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Refresh Balances"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-2 space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-white/70 block font-bold">
                Total Withdrawable Balance
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#f2b42c]">
                ₦ {totalAvailableBalance.toLocaleString()}
              </div>
              {pendingBalance > 0 && (
                <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-amber-300 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>₦{pendingBalance.toLocaleString()} pending administrative audit</span>
                </span>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                disabled={totalAvailableBalance <= 0}
                onClick={() => {
                  setWithdrawAmount(String(totalAvailableBalance));
                  setShowWithdrawModal(true);
                }}
                className="px-6 py-3.5 bg-[#f2b42c] hover:bg-[#e5a822] text-slate-900 font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Initiate NUBAN Withdrawal</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Breakdown cards inside hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 text-amber-200 mb-1 font-bold">
                <Share2 className="w-4 h-4" />
                <span>Affiliate Commissions</span>
              </div>
              <div className="text-lg font-black font-mono">₦ {affiliateBalance.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 text-purple-200 mb-1 font-bold">
                <GraduationCap className="w-4 h-4" />
                <span>Trial Stipends</span>
              </div>
              <div className="text-lg font-black font-mono">₦ {stipendBalance.toLocaleString()}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex items-center space-x-2 text-emerald-200 mb-1 font-bold">
                <Briefcase className="w-4 h-4" />
                <span>Enterprise Salaries</span>
              </div>
              <div className="text-lg font-black font-mono">₦ {placementBalance.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Linked Bank Accounts Manager */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Linked Settlement Accounts (NUBAN Bank Management)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Link up to 3 Nigerian commercial bank accounts for automatic payout dispatches.
          </p>
        </div>

        {errorNotice && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        <div className="space-y-3">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    {account.bankName} &bull;{' '}
                    <span className="font-mono text-[#512d7c] font-bold">{account.accountNumber}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{account.accountName}</p>
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center">
                {account.isPrimary ? (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs rounded-xl">
                    Primary Destination
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(account.id)}
                    className="text-xs text-slate-500 hover:text-[#512d7c] font-bold hover:underline cursor-pointer"
                  >
                    Make Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveBank(account.id)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {bankAccounts.length === 0 && (
            <div className="p-6 text-center text-slate-400 font-mono text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No bank account linked. Add an account below to receive payouts.
            </div>
          )}
        </div>

        {bankAccounts.length < 3 && (
          <form onSubmit={handleLinkBank} className="pt-4 border-t border-slate-100 space-y-4 text-xs">
            <span className="font-extrabold text-slate-900 block text-xs">Add New Bank Account</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GTBank, Kuda, Zenith, OPay"
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Account Number (10 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="0123456789"
                  value={newBank.accountNumber}
                  onChange={(e) =>
                    setNewBank({ ...newBank, accountNumber: e.target.value.replace(/\D/g, '') })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">Account Holder Name</label>
              <input
                type="text"
                required
                placeholder="Full Name as registered with Bank"
                value={newBank.accountName}
                onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Link Bank Account
            </button>
          </form>
        )}
      </div>

      {/* Transaction & Inflow Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Earnings & Inflow History Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit trail of startup stipends, placement salaries, and affiliate commissions.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {transactions.length} Total Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No financial entries recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3.5">SOURCE / STREAM</th>
                  <th className="pb-3.5">DESCRIPTION</th>
                  <th className="pb-3.5">AMOUNT</th>
                  <th className="pb-3.5">STATUS</th>
                  <th className="pb-3.5 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-mono font-bold text-[#512d7c]">
                      <span className="bg-purple-50 px-2 py-1 rounded-md uppercase text-[10px]">
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-slate-800 font-medium max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-600">
                      ₦ {Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.status === 'paid' || tx.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{tx.status === 'paid' || tx.status === 'approved' ? 'Paid / Cleared' : 'Pending Admin Approval'}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono text-[10px] text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  NUBAN Automated Settlement
                </span>
                <h3 className="text-base font-black text-slate-900">Initiate Withdrawal Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {withdrawalSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Withdrawal Dispatched!</h4>
                <p className="text-xs text-slate-500">
                  ₦{Number(withdrawAmount).toLocaleString()} queued for audit and transfer to your {primaryBank?.bankName} account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteWithdrawal} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount to Withdraw (NGN)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-mono">₦</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      max={totalAvailableBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Available: ₦{totalAvailableBalance.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono block">Primary Destination Bank</span>
                  {primaryBank ? (
                    <div>
                      <span className="font-bold text-slate-900 block">{primaryBank.bankName}</span>
                      <span className="text-slate-600 font-mono">{primaryBank.accountNumber} &bull; {primaryBank.accountName}</span>
                    </div>
                  ) : (
                    <span className="text-rose-600 font-bold">No primary bank account linked.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={withdrawing || !primaryBank || totalAvailableBalance <= 0}
                  className="w-full py-3 bg-[#f2b42c] hover:bg-[#e5a822] text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Queueing Withdrawal...</span>
                    </>
                  ) : (
                    <span>Confirm & Dispatch Withdrawal ➔</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}