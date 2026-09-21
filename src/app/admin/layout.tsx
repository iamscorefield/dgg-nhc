'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Building2,
  Lock,
  Share2,
  FileSpreadsheet,
  LogOut,
  Clock,
  Menu,
  X,
  ShieldCheck,
  Zap,
  Briefcase,
  GitPullRequest,
  Gavel,
  Award,
  GraduationCap,
  Sun,
  Moon
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState('Master Operations Director');
  const [systemClearance, setSystemClearance] = useState('ROOT_SUPERADMIN');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [emergencyLockActive, setEmergencyLockActive] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Real-Time Live Clock
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setCurrentDateTime(`${datePart} • ${timePart}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Authenticated Admin Details
  useEffect(() => {
    async function loadAdminData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.first_name) {
          setAdminName(`${profile.first_name} ${profile.last_name || ''}`.trim());
        }
        if (profile.role) {
          setSystemClearance(profile.role.toUpperCase());
        }
      }
    }

    loadAdminData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navDepartments = [
    {
      group: 'Core Operations',
      items: [
        {
          name: 'Master Command Terminal',
          href: '/admin',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: 'Placements Desk',
          href: '/admin/placements',
          icon: Briefcase,
        },
        {
          name: 'Sprint Deliverables Review',
          href: '/admin/sprints',
          icon: GitPullRequest,
        },
        {
          name: 'Apprentice Vault & NHC IDs',
          href: '/admin/interns',
          icon: Users,
        },
        {
          name: 'Enterprise CAC Accreditation',
          href: '/admin/startups',
          icon: Building2,
        },
        {
          name: 'Resources & Masterclasses',
          href: '/admin/resources',
          icon: GraduationCap,
        },
      ],
    },
    {
      group: 'Financial Clearing',
      items: [
        {
          name: '10% Escrow & Disbursements',
          href: '/admin/escrow',
          icon: Lock,
        },
        {
          name: 'Multi-Domain Affiliate Audit',
          href: '/admin/affiliates',
          icon: Share2,
        },
      ],
    },
    {
      group: 'Governance & Security',
      items: [
        {
          name: 'Disputes & Arbitration',
          href: '/admin/disputes',
          icon: Gavel,
        },
        {
          name: 'Certificate & LMS Hash Mint',
          href: '/admin/certificates',
          icon: Award,
        },
        {
          name: 'System Audit Logs',
          href: '/admin/audit-logs',
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || (pathname.startsWith(href) && href !== '/admin');
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-300 ${darkMode ? 'bg-[#07020d] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden bg-[#512d7c] text-white border-b border-purple-900/40 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 relative shrink-0 flex items-center justify-center">
            <Image
              src="/dgg-logo.png"
              alt="DGG Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-sm tracking-wide">NexusHub Master Console</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-purple-200 hover:text-white rounded-lg cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#512d7c] text-slate-100 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shrink-0 border-r border-purple-900 shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Logo & Clearance Header */}
          <div className="p-5 border-b border-purple-800/60 flex items-center space-x-3 bg-[#3f2162]">
            <div className="w-10 h-10 relative shrink-0 flex items-center justify-center">
              <Image
                src="/dgg-logo.png"
                alt="DGG Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="font-black text-white text-sm tracking-tight block truncate">
                DGG-NexusHub
              </span>
              <span className="text-[9px] font-mono uppercase font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 inline-block">
                Master Clearinghouse
              </span>
            </div>
          </div>

          {/* Navigation Route Groups */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {navDepartments.map((dept, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-purple-200/60 block px-3">
                  {dept.group}
                </span>

                <div className="space-y-1">
                  {dept.items.map((item) => {
                    const active = isLinkActive(item.href, item.exact);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          active
                            ? 'bg-[#ff7a00] text-white shadow-md font-black border border-white/20'
                            : 'text-purple-100/80 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-white' : 'text-amber-300/80'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Session Footer */}
          <div className="p-4 border-t border-purple-800/60 space-y-3 bg-[#3f2162]">
            <div className="flex items-center justify-between text-xs px-2 font-mono">
              <span className="text-[10px] text-purple-200 truncate max-w-[120px]">{systemClearance}</span>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                <span>CLEARED</span>
              </span>
            </div>

            {/* Dark/Light Mode Switch Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border bg-white/10 border-white/20 text-yellow-300 hover:bg-white/15"
            >
              <div className="flex items-center space-x-2">
                {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-200" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] font-mono font-normal uppercase opacity-70">
                {darkMode ? 'Active' : 'Standby'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-bold text-rose-200 hover:text-white bg-rose-900/30 hover:bg-rose-900/50 border border-rose-700/30 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminate Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Administrative Surface */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className={`px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm border-b ${
          darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2 border ${
              darkMode ? 'bg-purple-950/60 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-[#512d7c]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className={darkMode ? 'text-white/60 font-medium' : 'text-slate-500 font-medium'}>Clearance:</span>
              <span className={darkMode ? 'text-white font-black' : 'text-slate-900 font-black'}>{adminName}</span>
            </div>

            <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold border ${
              darkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className={darkMode ? 'text-white/40 font-normal' : 'text-slate-400 font-normal'}>Node:</span>
              <span className="text-[#f2b42c] font-black">Lagos Core Gateway</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Circuit Breaker Toggle */}
            <button
              type="button"
              onClick={() => setEmergencyLockActive(!emergencyLockActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all cursor-pointer border ${
                emergencyLockActive
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : darkMode
                  ? 'bg-white/5 text-white/80 border-white/10 hover:border-rose-400'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>{emergencyLockActive ? 'PAYOUTS FROZEN' : 'CIRCUIT NORMAL'}</span>
            </button>

            {/* Live Clock */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
              darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentDateTime || 'Syncing Master Clock...'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Sub-Route Surface */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-[#07020d] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}