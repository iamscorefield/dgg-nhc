'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Activity,
  Globe,
  Clock,
  Laptop,
  Smartphone,
  MapPin,
  RefreshCw,
  Eye,
  ExternalLink
} from 'lucide-react';

interface ClickLog {
  id: string;
  subdomain_handle: string;
  target_page: string;
  visitor_ip: string;
  visitor_city: string;
  visitor_country: string;
  device_type: string;
  duration_seconds: number;
  created_at: string;
  updated_at?: string;
}

export default function ReferralAnalyticsTab() {
  const [logs, setLogs] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Mask IP for privacy and disintermediation
  const maskIp = (ip: string) => {
    if (!ip || ip === '127.0.0.1' || ip === '::1') return '127.0.0.1 (Local)';
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
    return `${ip.substring(0, 7)}***`;
  };

  // Precise dynamic duration formatter
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const loadAnalytics = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('referral_clicks_ledger')
      .select('*')
      .eq('intern_id', authData.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();

    // Listen to live database updates via Supabase Realtime
    const channel = supabase
      .channel('live_referral_clicks_stream')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referral_clicks_ledger',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as ClickLog;
            setLogs((prev) => [newRow, ...prev.filter((item) => item.id !== newRow.id).slice(0, 49)]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as ClickLog;
            setLogs((prev) =>
              prev.map((item) => (item.id === updatedRow.id ? updatedRow : item))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute metrics
  const totalClicks = logs.length;
  const uniqueCountries = new Set(
    logs.map((l) => `${l.visitor_city}-${l.visitor_country}`).filter(Boolean)
  ).size;

  const validDurations = logs.map((l) => l.duration_seconds || 0).filter((d) => d > 0);
  const averageDuration =
    validDurations.length > 0
      ? Math.round(validDurations.reduce((acc, curr) => acc + curr, 0) / validDurations.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-black text-slate-900">Live Referral & Traffic Analytics</h2>
          </div>
          <p className="text-xs text-slate-500">
            Real-time telemetry tracking visitor origins, IPs, dwell duration, and page destinations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono-tech uppercase font-bold">Total Inbound Clicks</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClicks}</div>
          <span className="text-[10px] text-emerald-600 font-bold">&#8593; Real-time active tracking</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono-tech uppercase font-bold">Audience Reach</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{uniqueCountries} Regions</div>
          <span className="text-[10px] text-slate-500 font-medium">Distinct geographic territories</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono-tech uppercase font-bold">Avg. Dwell Duration</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatDuration(averageDuration)}</div>
          <span className="text-[10px] text-slate-500 font-medium">Average active time spent on page</span>
        </div>
      </div>

      {/* Visitor Event Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-mono-tech font-bold uppercase tracking-wider text-slate-600">
            Visitor Event Ledger (Latest 50 Entries)
          </span>
          <span className="text-[10px] font-mono-tech bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Live Heartbeat Active
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No traffic clicks logged yet.</p>
            <p className="text-[11px] text-slate-400">
              Share your deep-links or portfolio address to inspect real-time inbound traffic.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono-tech text-[10px] uppercase">
                  <th className="p-4">Visitor / Location</th>
                  <th className="p-4">Target Landing Page</th>
                  <th className="p-4">Masked IP</th>
                  <th className="p-4">Device</th>
                  <th className="p-4">Dwell Duration</th>
                  <th className="p-4">Logged Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="font-bold text-slate-900">
                          {log.visitor_city}, {log.visitor_country}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-1.5 font-mono-tech text-purple-700 font-semibold max-w-xs truncate">
                        <span>{log.target_page}</span>
                        {log.target_page.startsWith('http') && <ExternalLink className="w-3 h-3 shrink-0" />}
                      </div>
                    </td>

                    <td className="p-4 font-mono-tech text-slate-500 text-[11px]">
                      {maskIp(log.visitor_ip)}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {log.device_type === 'Mobile' ? (
                          <Smartphone className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Laptop className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{log.device_type}</span>
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-bold font-mono-tech text-amber-900 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-[11px]">
                        {formatDuration(log.duration_seconds)}
                      </span>
                    </td>

                    <td className="p-4 text-[11px] font-mono-tech text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}