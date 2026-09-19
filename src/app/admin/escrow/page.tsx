'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Building2,
  DollarSign,
  ArrowUpRight,
  X
} from 'lucide-react';

interface AdminTransaction {
  id: string;
  startup_id: string | null;
  intern_id: string | null;
  amount_naira: number;
  transaction_type: string;
  status: string;
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function ModernAdminEscrowPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Inspection & Approval Modal state
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch admin financial ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Compute live overview metrics
  const totalEscrowVolume = transactions
    .filter((tx) => tx.transaction_type === 'startup_escrow_fund' && tx.status === 'approved')
    .reduce((acc, curr) => acc + Number(curr.amount_naira), 0);

  const totalPendingPayouts = transactions
    .filter((tx) => tx.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount_naira), 0);

  const totalDisbursed = transactions
    .filter((tx) => tx.status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.amount_naira), 0);

  const handleMarkAsPaid = async (txId: string) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'paid',
          admin_notes: `Marked as Paid & Disbursed via NUBAN on ${new Date().toLocaleDateString()}`,
        })
        .eq('id', txId);

      if (error) {
        alert(`Failed to update status: ${error.message}`);
        setProcessingAction(false);
        return;
      }

      // Trigger notification email hook when payout is settled
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'intern_welcome', // Or specialized admin notification handler
            recipientEmail: 'scorefield@dglobalgrowthfield.com',
            name: 'Admin Clearance'
          }),
        });
      } catch (notifErr) {
        console.error('Admin notification dispatch error:', notifErr);
      }

      setActionNotice('Transaction successfully marked as Paid. Intern wallet updated instantly.');
      setTimeout(() => setActionNotice(null), 3500);
      setSelectedTx(null);
      await fetchLedger();
    } catch (err) {
      console.error('Error executing payout approval:', err);
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus =
      statusFilter === 'ALL' || tx.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.payment_reference && tx.payment_reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.admin_notes && tx.admin_notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.transaction_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          LOADING FINANCIAL CLEARINGHOUSE...
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Admin Financial Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Escrow & Payout Clearinghouse
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Review incoming startup escrow funds, audit trial stipends, and approve intern withdrawal requests with one-click bank clearance signals.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/75">Escrow Vault</span>
            <span className="text-lg font-black font-mono text-emerald-300">
              ₦ {totalEscrowVolume.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/75">Pending Payouts</span>
            <span className="text-lg font-black font-mono text-amber-300">
              ₦ {totalPendingPayouts.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={fetchLedger}
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
            placeholder="Search by transaction ID, reference, or type..."
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
            <option value="ALL">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Primary Transactions Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Master Financial Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any transaction item to inspect details and authorize payment clearance.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredTransactions.length} Total Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No financial records match your current filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3.5">TRANSACTION ID / REF</th>
                  <th className="pb-3.5">CATEGORY</th>
                  <th className="pb-3.5">AMOUNT</th>
                  <th className="pb-3.5">STATUS</th>
                  <th className="pb-3.5">NOTES / DETAILS</th>
                  <th className="pb-3.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
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
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.status === 'paid' || tx.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{tx.status}</span>
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 max-w-xs truncate">
                      {tx.admin_notes || 'No administrative notes'}
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {tx.status !== 'paid' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkAsPaid(tx.id)}
                          disabled={processingAction}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          Mark as Paid ➔
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Inspection Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Admin Payout Auditor
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedTx.payment_reference || `TX-${selectedTx.id.slice(0, 8)}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Type:</span>
                <span className="font-bold text-[#512d7c] uppercase">{selectedTx.transaction_type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold uppercase text-amber-700">{selectedTx.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date(selectedTx.created_at).toLocaleString()}</span>
              </div>
              {selectedTx.startup_id && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Startup ID:</span>
                  <span className="font-mono text-slate-600">{selectedTx.startup_id}</span>
                </div>
              )}
              {selectedTx.intern_id && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Intern ID:</span>
                  <span className="font-mono text-slate-600">{selectedTx.intern_id}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-black text-emerald-600 text-sm">₦ {Number(selectedTx.amount_naira).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-purple-200">
                {selectedTx.admin_notes || 'No notes provided.'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              {selectedTx.status !== 'paid' ? (
                <button
                  type="button"
                  onClick={() => handleMarkAsPaid(selectedTx.id)}
                  disabled={processingAction}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {processingAction ? 'Updating Ledger...' : 'Confirm Bank Transfer & Mark as Paid ➔'}
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-100 text-slate-500 text-center font-bold text-xs rounded-xl">
                  Already Settled & Paid
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}