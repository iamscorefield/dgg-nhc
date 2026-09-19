'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  DollarSign,
  Download,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

interface ReferralTransaction {
  id: string;
  refId: string;
  clientName: string;
  propertySource: string;
  serviceProduct: string;
  commission: number;
  date: string;
  status: 'Completed' | 'Processing' | 'Escrowed' | 'Rejected';
  grossSale: number;
  commissionRate: string;
}

export default function ReferralTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTx, setSelectedTx] = useState<ReferralTransaction | null>(null);
  const [transactions, setTransactions] = useState<ReferralTransaction[]>([]);

  const loadTransactions = async () => {
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const userId = authData.user.id;

      // Query database using correct referrer_id column
      const { data: dbTxs, error: txError } = await supabase
        .from('referral_transactions')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (txError) {
        console.error('Referral transactions query notice:', txError.message || txError);
        setTransactions([]);
        return;
      }

      if (dbTxs) {
        const formatted: ReferralTransaction[] = dbTxs.map((t: any) => {
          let statusLabel: ReferralTransaction['status'] = 'Processing';
          const rawStatus = (t.status || '').toUpperCase();

          if (rawStatus === 'COMPLETED' || rawStatus === 'PAID') {
            statusLabel = 'Completed';
          } else if (rawStatus === 'APPROVED' || rawStatus === 'ESCROWED') {
            statusLabel = 'Escrowed';
          } else if (rawStatus === 'REJECTED' || rawStatus === 'CANCELLED') {
            statusLabel = 'Rejected';
          }

          const commAmount = Number(t.commission_amount || t.amount || 0);
          const grossAmount = Number(t.gross_sale || (commAmount > 0 ? commAmount * 5 : 0));

          return {
            id: t.id,
            refId: t.ref_code || `REF-${t.id.substring(0, 6).toUpperCase()}`,
            clientName: t.client_name || 'Ecosystem Subscriber',
            propertySource: t.property_source || t.origin_domain || 'learning.dglobalgrowthfield.com',
            serviceProduct: t.product_name || t.service_title || 'Platform Incubation Pass',
            commission: commAmount,
            grossSale: grossAmount,
            commissionRate: t.commission_rate || '15%',
            date: new Date(t.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            status: statusLabel,
          };
        });

        setTransactions(formatted);
      }
    } catch (err) {
      console.error('Failed to load referral ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const totalCompleted = transactions
    .filter((t) => t.status === 'Completed')
    .reduce((acc, curr) => acc + curr.commission, 0);

  const totalEscrowed = transactions
    .filter((t) => t.status === 'Escrowed' || t.status === 'Processing')
    .reduce((acc, curr) => acc + curr.commission, 0);

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      t.refId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serviceProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.propertySource.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Ref ID,Client Name,Origin Domain,Product/Service,Commission,Gross Sale,Status,Date']
        .concat(
          filteredTransactions.map(
            (t) =>
              `${t.refId},"${t.clientName}","${t.propertySource}","${t.serviceProduct}",₦${t.commission},₦${t.grossSale},${t.status},"${t.date}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dgg_referral_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING REFERRAL SETTLEMENT LEDGER...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
            Real-Time Audit Trail
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Referral Transactions Management
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Real-time ledger tracking of converted clients, attributed ecosystem properties, and verified commissions.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Settled Commissions</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              ₦{totalCompleted.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Locked in Escrow</span>
            <span className="text-xl font-black font-mono text-[#f2b42c]">
              ₦{totalEscrowed.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={loadTransactions}
            title="Refresh Transactions"
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Ref ID, client name, property, or service..."
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
              <option value="Completed">Completed</option>
              <option value="Escrowed">Escrowed</option>
              <option value="Processing">Processing</option>
            </select>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Export filtered transactions as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">REF ID</th>
                <th className="pb-3.5">CLIENT NAME</th>
                <th className="pb-3.5">PROPERTY SOURCE</th>
                <th className="pb-3.5">SERVICE PRODUCT</th>
                <th className="pb-3.5">COMMISSION</th>
                <th className="pb-3.5">DATE</th>
                <th className="pb-3.5 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No referral transactions recorded yet. Share your deep-links to generate commissions.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
                      {tx.refId}
                    </td>
                    <td className="py-4 font-bold text-slate-900">
                      {tx.clientName}
                    </td>
                    <td className="py-4 font-mono text-[#512d7c] font-semibold">
                      {tx.propertySource}
                    </td>
                    <td className="py-4 text-slate-700 font-medium">
                      {tx.serviceProduct}
                    </td>
                    <td className="py-4 font-mono font-black text-emerald-600">
                      ₦ {tx.commission.toLocaleString()}
                    </td>
                    <td className="py-4 font-mono text-slate-500">
                      {tx.date}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tx.status === 'Escrowed'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {tx.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {tx.status === 'Escrowed' && <Clock className="w-3 h-3 text-amber-600" />}
                        <span>{tx.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Transaction Audit Inspector
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedTx.refId}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Client & Attributed Product</span>
                <span className="font-bold text-slate-900 block">{selectedTx.clientName}</span>
                <span className="text-slate-600 block">{selectedTx.serviceProduct}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block">Gross Volume</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₦{selectedTx.grossSale.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-mono block">Earned ({selectedTx.commissionRate})</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₦{selectedTx.commission.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Attributed Domain:</span>
                  <span className="text-[#512d7c] font-bold">{selectedTx.propertySource}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recorded Date:</span>
                  <span className="text-slate-700">{selectedTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settlement State:</span>
                  <span className="font-bold text-emerald-600">{selectedTx.status}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}