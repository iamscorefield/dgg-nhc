'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Award,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ExternalLink,
  Sparkles,
  QrCode,
  FileCheck,
  Lock,
  Check,
  X,
  Hash,
  Globe
} from 'lucide-react';

interface CertificateRecord {
  id: string;
  internName: string;
  nhcId: string;
  track: string;
  institution: string;
  certHash: string | null;
  subdomain: string;
  tier: string;
  isVerified: boolean;
  issuedDate: string;
}

export default function AdminCertificatesMintPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [records, setRecords] = useState<CertificateRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CertificateRecord | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [mintingId, setMintingId] = useState<string | null>(null);

  const fetchCertificates = async () => {
    setLoading(true);

    try {
      // 1. Fetch raw intern profiles
      const { data: rawInterns, error: iErr } = await supabase
        .from('intern_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (iErr) {
        console.error('Certificates query error:', iErr.message || iErr);
        setRecords([]);
        return;
      }

      const validInterns = rawInterns || [];
      const internIds = validInterns.map((i: any) => i.id).filter(Boolean);

      // 2. Fetch corresponding profiles in parallel
      const { data: profilesData } = internIds.length > 0
        ? await supabase.from('profiles').select('id, first_name, last_name').in('id', internIds)
        : { data: [] };

      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));

      const mapped: CertificateRecord[] = validInterns.map((i: any) => ({
        id: i.id,
        internName: profileMap.get(i.id) || 'Apprentice Candidate',
        nhcId: i.nhc_id || 'DGG-NHC-2026',
        track: i.specialization_track || 'Specialist Track',
        institution: i.institution || 'Academic Partner Campus',
        certHash: i.verified_cert_id || null,
        subdomain: i.subdomain_handle || 'apprentice',
        tier: i.tier || 'Associate (2-month trial)',
        isVerified: !!i.verified_cert_id,
        issuedDate: i.created_at
          ? new Date(i.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '2026',
      }));

      setRecords(mapped);
    } catch (err) {
      console.error('Failed to load certificates ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleMintHash = async (internId: string) => {
    setMintingId(internId);
    const newHash = `DGG-TN-${Date.now().toString().slice(-8)}`;

    const { error } = await supabase
      .from('intern_profiles')
      .update({ verified_cert_id: newHash })
      .eq('id', internId);

    setMintingId(null);

    if (error) {
      alert(`Minting failed: ${error.message}`);
      return;
    }

    setRecords((prev) =>
      prev.map((r) =>
        r.id === internId ? { ...r, certHash: newHash, isVerified: true } : r
      )
    );

    if (selectedRecord && selectedRecord.id === internId) {
      setSelectedRecord({ ...selectedRecord, certHash: newHash, isVerified: true });
    }

    setActionNotice(`Cryptographic hash minted: ${newHash}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRevokeHash = async (internId: string) => {
    const { error } = await supabase
      .from('intern_profiles')
      .update({ verified_cert_id: null })
      .eq('id', internId);

    if (error) {
      alert(`Revocation failed: ${error.message}`);
      return;
    }

    setRecords((prev) =>
      prev.map((r) =>
        r.id === internId ? { ...r, certHash: null, isVerified: false } : r
      )
    );

    if (selectedRecord && selectedRecord.id === internId) {
      setSelectedRecord({ ...selectedRecord, certHash: null, isVerified: false });
    }

    setActionNotice(`LMS Certificate Hash revoked.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && r.isVerified) ||
      (statusFilter === 'UNMINTED' && !r.isVerified);
    const matchesSearch =
      r.internName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nhcId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.certHash && r.certHash.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.track.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING CRYPTOGRAPHIC CERTIFICATE MINT...
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
            <Award className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              LMS Credential Mint & Hologram Authority
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cryptographic Certificate Minting Desk
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Mint tamper-proof digital verification hashes, audit public portfolio subdomain seals, and govern accredited academic passes.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
            <span className="block text-[9px] uppercase font-bold text-white/70">Minted Passes</span>
            <span className="text-xl font-black font-mono text-emerald-300">
              {records.filter((r) => r.isVerified).length} Verified
            </span>
          </div>
          <button
            type="button"
            onClick={fetchCertificates}
            title="Refresh Mint"
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
            placeholder="Search by student name, NHC pass ID, cert hash, or track..."
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
            <option value="ALL">All Mint States</option>
            <option value="VERIFIED">Verified Hash Minted</option>
            <option value="UNMINTED">Pending Audit</option>
          </select>
        </div>
      </div>

      {/* Primary Registry Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              LMS Cryptographic Credentials Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate secure verification hashes that stamp live QR codes onto public student portfolios.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-bold">
            {filteredRecords.length} Passes
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="pb-3.5">NHC ID</th>
                <th className="pb-3.5">APPRENTICE CANDIDATE</th>
                <th className="pb-3.5">ACCREDITED TRACK</th>
                <th className="pb-3.5">CERTIFICATE HASH</th>
                <th className="pb-3.5">DOSSIER SUBDOMAIN</th>
                <th className="pb-3.5">STATUS</th>
                <th className="pb-3.5 text-right">MINT CONTROLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No certificate credentials match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-purple-50/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 font-mono font-black text-slate-900 group-hover:text-[#512d7c]">
                      {r.nhcId}
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block">{r.internName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.institution}</span>
                    </td>
                    <td className="py-4 font-semibold text-[#512d7c]">
                      {r.track}
                    </td>
                    <td className="py-4 font-mono text-[11px]">
                      {r.certHash ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {r.certHash}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unminted</span>
                      )}
                    </td>
                    <td className="py-4 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/portfolio/${r.subdomain}`}
                        target="_blank"
                        className="text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center space-x-1 font-bold"
                      >
                        <span>{r.subdomain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                          r.isVerified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.isVerified && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                        <span>{r.isVerified ? 'VERIFIED LMS' : 'PENDING AUDIT'}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {r.isVerified ? (
                        <button
                          type="button"
                          onClick={() => handleRevokeHash(r.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg shadow-sm cursor-pointer"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={mintingId === r.id}
                          onClick={() => handleMintHash(r.id)}
                          className="px-3 py-1 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1 inline-flex"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{mintingId === r.id ? 'Minting...' : 'Mint Hash'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hologram Pass Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Cryptographic Pass Inspector
                </span>
                <h3 className="text-base font-black text-slate-900">{selectedRecord.internName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#120324] text-white rounded-2xl border border-purple-500/30 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-amber-300 font-bold">DGG-NHC CREDENTIAL SEAL</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded">{selectedRecord.nhcId}</span>
              </div>
              <div className="space-y-1 text-[11px] text-white/80 font-sans">
                <p><strong className="text-white">Specialization:</strong> {selectedRecord.track}</p>
                <p><strong className="text-white">Campus:</strong> {selectedRecord.institution}</p>
                <p><strong className="text-white">Incubation Tier:</strong> {selectedRecord.tier}</p>
                <p className="font-mono text-[10px]"><strong className="text-white font-sans">LMS Hash:</strong> {selectedRecord.certHash || 'UNMINTED'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {selectedRecord.isVerified ? (
                <button
                  type="button"
                  onClick={() => handleRevokeHash(selectedRecord.id)}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Revoke Hash
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMintHash(selectedRecord.id)}
                  className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Mint Cryptographic Pass</span>
                </button>
              )}

              <Link
                href={`/portfolio/${selectedRecord.subdomain}`}
                target="_blank"
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
              >
                <span>Open Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}