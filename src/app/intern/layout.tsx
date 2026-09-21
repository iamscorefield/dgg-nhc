'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  UserCheck,
  Globe,
  BarChart3,
  Link2,
  Users,
  Wallet,
  FolderArchive,
  GraduationCap,
  Briefcase,
  Layers,
  Bot,
  LogOut,
  Sparkles,
  Clock,
  Calendar,
  CreditCard,
  Menu,
  X,
  Activity,
  LifeBuoy,
  Sun,
  Moon
} from 'lucide-react';

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Apprentice');
  const [nhcId, setNhcId] = useState('DGG-NHC-2026');
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);

  // 1. Real-time Live Date & Clock with Seconds
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

  // 2. Fetch authenticated intern details and live NHC ID
  useEffect(() => {
    async function loadUserData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const [
        { data: profile },
        { data: intern }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', authData.user.id)
          .maybeSingle(),
        supabase
          .from('intern_profiles')
          .select('nhc_id')
          .eq('id', authData.user.id)
          .maybeSingle()
      ]);

      if (profile) {
        setUserName(
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Apprentice'
        );
      }
      if (intern?.nhc_id) {
        setNhcId(intern.nhc_id);
      }
    }

    loadUserData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navSections = [
    {
      heading: 'Dashboard & Learning',
      items: [
        {
          name: 'Dashboard Overview',
          href: '/intern',
          icon: LayoutDashboard,
          exact: true,
        },
        {
          name: 'Student Profile, NHC ID & Projects',
          href: '/intern/profile',
          icon: UserCheck,
        },
        {
          name: 'Subdomain Portfolio',
          href: '/intern/portfolio',
          icon: Globe,
        },
      ],
    },
    {
      heading: 'Affiliate Earning Hub',
      items: [
        {
          name: 'Overview & Stats',
          href: '/intern/affiliate/overview',
          icon: BarChart3,
        },
        {
          name: 'Multi-Domain Deep-Links',
          href: '/intern/affiliate/deep-links',
          icon: Link2,
        },
        {
          name: 'Referral Transactions',
          href: '/intern/affiliate/transactions',
          icon: Users,
        },
        {
          name: 'Referral Analytics',
          href: '/intern/affiliate/analytics',
          icon: Activity,
        },
        {
          name: 'Earnings Wallet & Payout',
          href: '/intern/affiliate/wallet',
          icon: Wallet,
        },
        {
          name: 'Marketing Assets',
          href: '/intern/affiliate/assets',
          icon: FolderArchive,
        },
        {
          name: 'Learning Resources',
          href: '/intern/affiliate/resources',
          icon: GraduationCap,
        },
      ],
    },
    {
      heading: 'Incubation & Career',
      items: [
        {
          name: 'Incubation Offers',
          href: '/intern/incubation/startup',
          icon: Briefcase,
          exact: true,
        },
        {
          name: 'Sprint Runway Pipeline',
          href: '/intern/incubation/pipeline',
          icon: Layers,
          exact: true,
        },
        {
          name: 'Community & AI Help',
          href: '/intern/incubation/ai-help',
          icon: Bot,
        },
        {
          name: 'Dispute & Admin Desk',
          href: '/intern/support',
          icon: LifeBuoy,
        },
      ],
    },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || (pathname.startsWith(href) && href !== '/intern');
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

      {/* Persistent Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shrink-0 border-r ${
          darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Platform Identity */}
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
                Intern Terminal
              </span>
            </div>
          </div>

          {/* Scrollable Navigation Groups */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#f2b42c] block px-3">
                  {section.heading}
                </span>

                <div className="space-y-1">
                  {section.items.map((item) => {
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

          {/* Bottom Account Strip */}
          <div className={`p-4 border-t space-y-2.5 ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
            <div className="flex items-center justify-between text-xs px-2">
              <span className={`font-mono text-[10px] font-bold ${darkMode ? 'text-white/60' : 'text-slate-500'}`}>{nhcId}</span>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Active Pass
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
              <span>Exit Terminal</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dynamic Surface */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dynamic Header */}
        <header className={`px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm border-b ${
          darkMode ? 'bg-[#0d0614] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-2 border ${
              darkMode ? 'bg-purple-950/60 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-[#512d7c]'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className={darkMode ? 'text-white/60 font-medium' : 'text-slate-500 font-medium'}>Partner & Intern:</span>
              <span className={darkMode ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold'}>{userName}</span>
            </div>

            <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-bold border ${
              darkMode ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <CreditCard className="w-3.5 h-3.5 text-[#f2b42c]" />
              <span className={darkMode ? 'text-white/40 font-normal' : 'text-slate-400 font-normal'}>ID:</span>
              <span className="text-[#f2b42c] font-black">{nhcId}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/intern/incubation/ai-help"
              className="px-3.5 py-1.5 bg-[#512d7c] hover:bg-[#3e215f] text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer border border-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
              <span className="hidden md:inline">AI Tutor Support</span>
            </Link>

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-inner border ${
              darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentDateTime || 'Synchronizing Time...'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Sub-Route Content */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-[#07020d] text-white' : 'bg-[#f8fafc] text-slate-800'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}