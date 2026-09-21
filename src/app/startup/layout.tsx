'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  Users,
  Building,
  Briefcase,
  ShieldCheck,
  Clock,
  LogOut,
  Menu,
  X,
  FileCheck,
  MessageSquare,
  KanbanSquare,
  Wallet,
  LifeBuoy,
  Sun,
  Moon
} from 'lucide-react';

export default function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState('Enterprise Partner');
  const [rcNumber, setRcNumber] = useState('RC-PENDING');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);

  // 1. Live Real-Time Date & Clock
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

  // 2. Fetch authenticated startup data
  useEffect(() => {
    async function loadStartupData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data: startup } = await supabase
        .from('startup_profiles')
        .select('company_name, rc_number')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (startup) {
        if (startup.company_name) setCompanyName(startup.company_name);
        if (startup.rc_number) setRcNumber(startup.rc_number);
      }
    }
    loadStartupData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navSections = [
    {
      heading: 'Overview & Sourcing',
      items: [
        {
          name: 'Startup Overview',
          href: '/startup',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: 'Intern Directory & Negotiation',
          href: '/startup/directory',
          icon: Users,
        },
        {
          name: 'Post Internship Role',
          href: '/startup/post-role',
          icon: Briefcase,
        },
      ],
    },
    {
      heading: 'Talent Workstation',
      items: [
        {
          name: 'Hiring Pipeline (Kanban)',
          href: '/startup/pipeline',
          icon: KanbanSquare,
        },
        {
          name: 'Sprint Review Desk',
          href: '/startup/sprints',
          icon: FileCheck,
        },
        {
          name: 'Direct Workspace Messages',
          href: '/startup/messages',
          icon: MessageSquare,
        },
      ],
    },
    {
      heading: 'Finance & Mediation',
      items: [
        {
          name: 'Escrow & Stipends Hub',
          href: '/startup/escrow',
          icon: Wallet,
        },
        {
          name: 'Dispute & Mediation Desk',
          href: '/startup/support',
          icon: LifeBuoy,
        },
        {
          name: 'Company Profile & Verification',
          href: '/startup/profile',
          icon: Building,
        },
      ],
    },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-300 ${darkMode ? 'bg-[#07020d] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
      {/* Mobile Top App Bar */}
      <div className={`lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b ${darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center space-x-2">
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
          <span className="font-extrabold text-sm">DGG-NexusHub</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`p-2 rounded-lg cursor-pointer ${darkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Fixed Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shrink-0 border-r ${
          darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Branding */}
          <div className={`p-5 border-b flex items-center space-x-3 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
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
            <div>
              <span className={`font-black text-sm tracking-tight block ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                DGG-NexusHub
              </span>
              <span className="text-[10px] font-mono uppercase font-bold text-[#f2b42c] bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                Enterprise Desk
              </span>
            </div>
          </div>

          {/* Navigation Items Organized by Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#f2b42c] block px-3 mb-1">
                  {sec.heading}
                </span>

                <div className="space-y-1">
                  {sec.items.map((item) => {
                    const active = isLinkActive(item.href, item.exact);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          active
                            ? 'bg-[#512d7c] text-white shadow-sm border border-white/20'
                            : darkMode
                            ? 'text-white/70 hover:bg-white/5 hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-[#f2b42c]' : darkMode ? 'text-white/40' : 'text-slate-400'
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

          {/* Account/Security Footer Strip */}
          <div className={`p-4 border-t space-y-2.5 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
            <div className="flex items-center justify-between text-xs px-2">
              <span className={`font-mono text-[10px] font-bold ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{rcNumber}</span>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified RC</span>
              </span>
            </div>

            {/* Dark/Light Mode Switch Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                darkMode ? 'bg-white/10 border-white/20 text-yellow-300 hover:bg-white/15' : 'bg-slate-200/70 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-purple-700" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <span className="text-[10px] font-mono font-normal uppercase opacity-70">
                {darkMode ? 'Active' : 'Standby'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className={`w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                darkMode ? 'text-rose-400 hover:bg-rose-950/40' : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Enterprise Desk</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dynamic View Surface */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dynamic Top Header */}
        <header className={`px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm border-b ${
          darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Company Identity & RC Badge */}
          <div className="flex items-center space-x-2.5">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2 border ${
              darkMode ? 'bg-purple-950/60 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-[#512d7c]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className={darkMode ? 'text-white/60 font-medium' : 'text-slate-500 font-medium'}>Enterprise:</span>
              <span className={darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>{companyName}</span>
            </div>

            <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold border ${
              darkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <FileCheck className="w-3.5 h-3.5 text-[#f2b42c]" />
              <span className={darkMode ? 'text-white/40 font-normal' : 'text-slate-400 font-normal'}>RC:</span>
              <span className="text-[#f2b42c] font-black">{rcNumber}</span>
            </div>
          </div>

          {/* Verification Status & Real-Time Date/Clock */}
          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-flex items-center space-x-1 text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Incubator Access: Cleared</span>
            </span>

            {/* Live Clock & Date */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-inner border ${
              darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentDateTime || 'Synchronizing Time...'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-[#07020d] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}