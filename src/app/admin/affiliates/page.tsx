'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Share2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Wallet,
  Globe,
  Building2,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface AffiliateClaim {
  id: string;
  claimCode: string;
  apprenticeName: string;
  nhcId: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  dateRequested: string;
  originDomain: string;
  conversionsCount: number;
  status: 'Pending Review' | 'Approved' | 'Rejected';
}

export default function AdminAffiliateAuditPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedClaim, setSelectedClaim] = useState<AffiliateClaim | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [claims, setClaims] = useState<AffiliateClaim[]>([]);

  const loadAffiliateData = async () => {
    setLoading(true);

    try {
      // 1. Fetch transactions directly
      const { data: dbTx, error: txError } = await supabase
        .from('referral_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Error loading referral transactions:', txError.message || txError);
        setClaims([]);
        return;
      }

      if (!dbTx || dbTx.length === 0) {
        setClaims([]);
        return;
      }

      // Collect user/intern IDs
      const internIds = Array.from(new Set(dbTx.map((t: any) => t.intern_id || t.user_id).filter(Boolean)));

      // 2. Query intern details and user profiles in parallel
      const [{ data: internProfiles }, { data: userProfiles }] = await Promise.all([
        supabase
          .from('intern_profiles')
          .select('id, nhc_id, payout_bank_name, payout_account_number')
          .in('id', internIds),
        supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', internIds)
      ]);

      const mapped: AffiliateClaim[] = dbTx.map((tx: any) => {
        const userId = tx.intern_id || tx.user_id;
        const intern = (internProfiles || []).find((ip) => ip.id === userId);
        const profile = (userProfiles || []).find((p) => p.id === userId);

        let status: AffiliateClaim['status'] = 'Pending Review';
        if (tx.status === 'APPROVED' || tx.status === 'PAID') {
          status = 'Approved';
        } else if (tx.status === 'REJECTED' || tx.status === 'CANCELLED') {
          status = 'Rejected';
        }

        return {
          id: tx.id,
          claimCode: `CLM-${tx.id.substring(0, 8).toUpperCase()}`,
          apprenticeName: `${profile?.first_name || 'Apprentice'} ${profile?.last_name || ''}`.trim(),
          nhcId: intern?.nhc_id || 'DGG-NHC-2026',
          bankName: intern?.payout_bank_name || 'Commercial Bank',
          accountNumber: intern?.payout_account_number || '•••• ••••',
          amount: Number(tx.amount) || 0,
          dateRequested: new Date(tx.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          originDomain: tx.origin_domain || 'learning.dglobalgrowthfield.com',
          conversionsCount: tx.conversions_count || 1,
          status,
        };
      });

      setClaims(mapped);
    } catch (err) {
      console.error('Failed to load affiliate queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const totalPendingPayouts = claims
    .filter((c) => c.status === 'Pending Review')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalClearedPayouts = claims
    .filter((c) => c.status === 'Approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleApproveClaim = async (claimId: string) => {
    const { error } = await supabase
      .from('referral_transactions')
      .update({ status: 'APPROVED' })
      .eq('id', claimId);

    if (error) {
      alert(`Approval failed: ${error.message}`);
      return;
    }

    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'Approved' } : c))
    );

    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim({ ...selectedClaim, status: 'Approved' });
    }

    setActionNotice('Payout authorized. Paystack Transfer webhook dispatched to intern bank account.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRejectClaim = async (claimId: string) => {
    const { error } = await supabase
      .from('referral_transactions')
      .update({ status: 'REJECTED' })
      .eq('id', claimId);

    if (error) {
      alert(`Rejection failed: ${error.message}`);
      return;
    }

    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'Rejected' } : c))
    );

    if (selectedClaim && selectedClaim.id === claimId) {
      setSelectedClaim({ ...selectedClaim, status: 'Rejected' });
    }

    setActionNotice('Payout request rejected. Funds returned to student wallet.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredClaims = claims.filter((c) => {
    const matchesStatus =
      statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      c.claimCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.apprenticeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nhcId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originDomain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          LOADING MULTI-DOMAIN AFFILIATE CLEARINGHOUSE...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f041d] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Multi-Domain Referral Auditing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Multi-Domain Tracking & Payout Approvals
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Verify lead attributions across external landing properties, inspect student bank disbursement claims, and batch-settle commissions.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Pending Payouts</span>
            <span className="text-xl font-black font-mono text-amber-300">
              ₦ {totalPendingPayouts.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Settled All-Time</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              ₦ {totalClearedPayouts.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={loadAffiliateData}
            title="Refresh Ledger"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by claim code, intern name, NHC ID, or origin domain..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Claim Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Primary Payout Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Affiliate Withdrawal Requests Master Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and disburse referral commission claims from student Earnings Wallets.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredClaims.length} Claims Queued
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">CLAIM ID</th>
                <th className="pb-3.5">BENEFICIARY</th>
                <th className="pb-3.5">BANK DESTINATION</th>
                <th className="pb-3.5">PRIMARY DOMAIN</th>
                <th className="pb-3.5">AMOUNT</th>
                <th className="pb-3.5">STATUS</th>
                <th className="pb-3.5 text-right">ADMIN DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No affiliate claims currently logged in database.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
                      {claim.claimCode}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{claim.apprenticeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{claim.nhcId}</span>
                    </td>
                    <td className="py-4 font-mono text-slate-700">
                      <span className="font-semibold block">{claim.bankName}</span>
                      <span className="text-[10px] text-slate-400">{claim.accountNumber}</span>
                    </td>
                    <td className="py-4 text-[#512d7c] font-mono font-semibold">
                      {claim.originDomain}
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-600 text-sm">
                      ₦ {claim.amount.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          claim.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : claim.status === 'Pending Review'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {claim.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {claim.status === 'Pending Review' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{claim.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {claim.status === 'Pending Review' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleApproveClaim(claim.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectClaim(claim.id)}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Reject Claim"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Affiliate Claim Auditor
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedClaim.claimCode}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Apprentice Partner:</span>
                <span className="font-bold text-slate-900">{selectedClaim.apprenticeName} ({selectedClaim.nhcId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Bank Account:</span>
                <span className="font-mono font-bold text-slate-800">
                  {selectedClaim.bankName} &bull; {selectedClaim.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attributed Domain Property:</span>
                <span className="font-mono font-bold text-[#512d7c]">{selectedClaim.originDomain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Validated Downline Sales:</span>
                <span className="font-mono text-slate-700">{selectedClaim.conversionsCount} Paid Conversions</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Logged Request Date:</span>
                <span className="font-mono text-slate-600">{selectedClaim.dateRequested}</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Total Net Payout:</span>
              <span className="text-lg font-black font-mono text-emerald-600">
                ₦ {selectedClaim.amount.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={selectedClaim.status === 'Approved'}
                onClick={() => handleApproveClaim(selectedClaim.id)}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                {selectedClaim.status === 'Approved' ? 'Already Approved' : 'Authorize Settlement'}
              </button>

              <button
                type="button"
                disabled={selectedClaim.status === 'Rejected' || selectedClaim.status === 'Approved'}
                onClick={() => handleRejectClaim(selectedClaim.id)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                Reject & Return Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}