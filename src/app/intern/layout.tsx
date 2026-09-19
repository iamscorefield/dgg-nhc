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
  LifeBuoy
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col lg:flex-row font-sans">
      {/* Mobile Top App Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
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
          <span className="font-extrabold text-sm text-slate-900">DGG-NexusHub</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Platform Identity */}
          <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
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
              <span className="font-black text-slate-900 text-sm tracking-tight block">
                DGG-NexusHub
              </span>
              <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Intern Terminal
              </span>
            </div>
          </div>

          {/* Scrollable Navigation Groups */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-amber-600 block px-3">
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
                            ? 'bg-[#512d7c] text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-[#f2b42c]' : 'text-slate-400'
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
          <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="font-mono text-[10px] text-slate-500 font-bold">{nhcId}</span>
              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Active Pass
              </span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
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
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#512d7c] text-xs font-bold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-slate-500 font-medium">Partner & Intern:</span>
              <span className="text-slate-900 font-extrabold">{userName}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-bold">
              <CreditCard className="w-3.5 h-3.5 text-[#512d7c]" />
              <span className="text-slate-400 font-normal">ID:</span>
              <span className="text-[#512d7c] font-black">{nhcId}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/intern/incubation/ai-help"
              className="px-3.5 py-1.5 bg-[#512d7c] hover:bg-[#3e215f] text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
              <span className="hidden md:inline">AI Tutor Support</span>
            </Link>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs font-bold shadow-inner">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{currentDateTime || 'Synchronizing Time...'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Sub-Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}