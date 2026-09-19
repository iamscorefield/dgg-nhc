'use client';

import React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Calendar
} from 'lucide-react';

export interface EscrowEntry {
  id: string;
  placement_id: string;
  intern_name: string;
  intern_track: string;
  amount: number;
  surcharge_fee: number;
  status: 'PENDING' | 'HELD_IN_ESCROW' | 'DISBURSED' | 'REFUNDED';
  invoice_reference?: string;
  disbursement_due_date?: string;
  created_at: string;
}

interface EscrowTransactionLedgerProps {
  entries: EscrowEntry[];
  loading: boolean;
}

export default function EscrowTransactionLedger({
  entries,
  loading,
}: EscrowTransactionLedgerProps) {
  const getStatusBadge = (status: EscrowEntry['status']) => {
    switch (status) {
      case 'HELD_IN_ESCROW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>HELD IN ESCROW</span>
          </span>
        );
      case 'DISBURSED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>DISBURSED TO INTERN</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>REFUNDED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <span>PENDING DEPOSIT</span>
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <span className="animate-pulse font-bold">DECRYPTING ESCROW LEDGER ENTRIES...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center space-y-2 bg-white border border-slate-200 rounded-3xl">
        <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-xs text-slate-600 font-medium">No escrow records initiated yet.</p>
        <p className="text-[11px] text-slate-400">
          When candidates accept incubation terms and pass their probation runway, financial commitments appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm font-sans">
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-[#512d7c]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Stipend & Facilitation Audit Trail
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-medium">
          Automated Monthly Clearing
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-400 font-mono text-[10px] uppercase">
              <th className="p-4">Reference & Candidate</th>
              <th className="p-4">Base Stipend</th>
              <th className="p-4">10% Platform Fee</th>
              <th className="p-4">Total Reserved</th>
              <th className="p-4">Escrow Status</th>
              <th className="p-4">Disbursement Schedule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
            {entries.map((item) => {
              const totalAmount = Number(item.amount || 0) + Number(item.surcharge_fee || 0);

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.intern_name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.invoice_reference || `ESC-${item.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span className="block text-[10px] text-purple-700 font-medium">{item.intern_track}</span>
                    </div>
                  </td>

                  <td className="p-4 font-mono font-bold text-slate-900">
                    ₦{Number(item.amount || 0).toLocaleString()}
                  </td>

                  <td className="p-4 font-mono text-purple-700 font-semibold">
                    ₦{Number(item.surcharge_fee || 0).toLocaleString()}
                  </td>

                  <td className="p-4 font-mono font-black text-slate-950">
                    ₦{totalAmount.toLocaleString()}
                  </td>

                  <td className="p-4">
                    {getStatusBadge(item.status)}
                  </td>

                  <td className="p-4 text-[11px] font-mono text-slate-600">
                    {item.disbursement_due_date ? (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(item.disbursement_due_date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Upon Milestone Approval</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}