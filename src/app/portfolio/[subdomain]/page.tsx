'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReferralTracker from '@/components/analytics/ReferralTracker';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  ExternalLink,
  Star,
  School,
  Bookmark,
  Check,
  MapPin,
  Mail,
  Code2,
  Cpu,
  Layers,
  ChevronRight,
  Globe,
  Lock,
  Building,
  FileCheck,
  BookOpen,
  Video,
} from 'lucide-react';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TwitterIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface SkillSpecializationItem {
  title: string;
  description: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  demoUrl: string;
  githubUrl: string;
  tags: string[];
}

interface ReviewItem {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
}

interface PortfolioState {
  id: string;
  name: string;
  nhcId: string;
  tier: string;
  track: string;
  institution: string;
  discipline: string;
  rawEmail: string;
  location: string;
  avatarUrl: string;
  bio: string;
  headline: string;
  headlineDescription: string;
  ongoingAssignments: string;
  verifiedCertId: string;
  sprintAttendanceScore: string;
  template: number;
  skillsSpecialization: SkillSpecializationItem[];
  projects: ProjectItem[];
  reviews: ReviewItem[];
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
    website: string;
    video_pitch?: string;
  };
}

export default function DynamicSubdomainPortfolioPage() {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

  // Auth Context
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'startup' | 'intern' | 'admin' | 'guest'>('guest');

  // Modals
  const [showGateModal, setShowGateModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [interceptorTarget, setInterceptorTarget] = useState<string>('');

  // Incubation Offer Details
  const [contractTerm, setContractTerm] = useState<'6_MONTHS' | '1_YEAR' | '2_YEARS'>('1_YEAR');
  const [proposedStipend, setProposedStipend] = useState<number>(150000);
  const [roleTitle, setRoleTitle] = useState('');
  const [dispatchingOffer, setDispatchingOffer] = useState(false);
  const [offerSuccessNotice, setOfferSuccessNotice] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioState>({
    id: '',
    name: 'Apprentice Candidate',
    nhcId: 'DGG-NHC-2026',
    tier: 'Associate (Intermediate: 2-month trial)',
    track: 'Engineering',
    institution: 'University Campus',
    discipline: 'Computer Science',
    rawEmail: '',
    location: 'Lagos State',
    avatarUrl: '',
    bio: '',
    headline: 'Bridging Technical Execution with Enterprise Engineering.',
    headlineDescription: 'Building scalable systems and driving conversions.',
    ongoingAssignments: 'Active Sprints on DGG-NexusHub',
    verifiedCertId: 'DGG-TN-2026',
    sprintAttendanceScore: '100%',
    template: 5,
    skillsSpecialization: [],
    projects: [],
    reviews: [],
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: '',
      website: '',
      video_pitch: '',
    },
  });

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return 'verified-candidate@dgg.link';
    const [local, domain] = email.split('@');
    if (local.length <= 3) return `${local[0]}•••@${domain}`;
    const visibleStart = local.slice(0, 3);
    const maskedLength = Math.min(local.length - 3, 8);
    return `${visibleStart}${'•'.repeat(maskedLength)}@${domain}`;
  };

  const formatVideoEmbedUrl = (rawUrl?: string) => {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();

    if (trimmed.includes('loom.com/share/')) {
      return trimmed.replace('loom.com/share/', 'loom.com/embed/');
    }
    if (trimmed.includes('youtu.be/')) {
      const id = trimmed.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (trimmed.includes('youtube.com/watch?v=')) {
      const id = trimmed.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (trimmed.includes('vimeo.com/')) {
      const id = trimmed.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return trimmed;
  };

  useEffect(() => {
    async function loadCandidateAndAuth() {
      if (!subdomain) return;

      const { data: authData } = await supabase.auth.getUser();
      let detectedRole: 'startup' | 'intern' | 'admin' | 'guest' = 'guest';

      if (authData?.user) {
        setCurrentUser(authData.user);
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (prof?.role) {
          if (prof.role === 'entrepreneur' || prof.role === 'startup') {
            detectedRole = 'startup';
          } else {
            detectedRole = prof.role as any;
          }
          setUserRole(detectedRole);
        }
      }

      const { data: intern, error } = await supabase
        .from('intern_profiles')
        .select(`
          id,
          nhc_id,
          tier,
          specialization_track,
          state_of_residence,
          institution,
          discipline,
          bio,
          headline,
          headline_description,
          skills,
          skills_specialization,
          sprint_attendance_score,
          verified_cert_id,
          ongoing_assignments,
          portfolio_template,
          projects,
          social_links,
          profiles ( first_name, last_name, email, avatar_url )
        `)
        .eq('subdomain_handle', subdomain)
        .maybeSingle();

      if (intern && !error) {
        if (authData?.user && detectedRole === 'startup') {
          const { data: placement } = await supabase
            .from('placements')
            .select('id, pipeline_stage')
            .eq('startup_id', authData.user.id)
            .eq('intern_id', intern.id)
            .maybeSingle();

          if (placement) {
            setBookmarked(true);
          }
        }

        const { data: evaluations } = await supabase
          .from('intern_performance_evaluations')
          .select(`
            id,
            written_endorsement,
            technical_score,
            created_at,
            startup_id,
            profiles:startup_id ( first_name, last_name )
          `)
          .eq('intern_id', intern.id)
          .eq('is_public_on_dossier', true);

        const loadedReviews: ReviewItem[] = evaluations && evaluations.length > 0
          ? evaluations.map((ev: any) => {
              const evalProfile = Array.isArray(ev.profiles) ? ev.profiles[0] : ev.profiles;
              return {
                id: ev.id,
                authorName: `${evalProfile?.first_name || 'Enterprise'} ${evalProfile?.last_name || 'Supervisor'}`.trim(),
                authorRole: 'Verified Incubator Supervisor',
                rating: Number(ev.technical_score) || 5,
                title: 'Practical Sprint Endorsement',
                comment: ev.written_endorsement || 'Demonstrated strong execution during active trial.',
                date: new Date(ev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
              };
            })
          : [
              {
                id: 'rev-1',
                authorName: 'DGG NexusHub Desk',
                authorRole: 'Incubator Academic Board',
                rating: 5,
                title: 'High Sprint Consistency',
                comment: 'Consistent attendance and milestone deliverable submission across core tracks.',
                date: 'Sep 2026',
              },
            ];

        let parsedSkills: SkillSpecializationItem[] = [];
        if (Array.isArray(intern.skills_specialization) && intern.skills_specialization.length > 0) {
          parsedSkills = intern.skills_specialization;
        } else if (typeof intern.skills_specialization === 'string') {
          try {
            parsedSkills = JSON.parse(intern.skills_specialization);
          } catch {
            parsedSkills = [];
          }
        }

        if (parsedSkills.length === 0 && Array.isArray(intern.skills)) {
          parsedSkills = intern.skills.map((tag: string) => ({
            title: tag,
            description: `Hands-on practical delivery and sprint execution focused on ${tag}.`,
          }));
        }

        let parsedProjects: ProjectItem[] = [];
        if (Array.isArray(intern.projects)) {
          parsedProjects = intern.projects;
        } else if (typeof intern.projects === 'string') {
          try {
            parsedProjects = JSON.parse(intern.projects);
          } catch {
            parsedProjects = [];
          }
        }

        const links = intern.social_links || {
          github: '',
          linkedin: '',
          twitter: '',
          website: '',
          video_pitch: '',
        };

        const internProfileObj = Array.isArray(intern.profiles) ? intern.profiles[0] : intern.profiles;

        setPortfolio((prev) => ({
          ...prev,
          id: intern.id,
          name: `${internProfileObj?.first_name || 'Apprentice'} ${internProfileObj?.last_name || ''}`.trim(),
          nhcId: intern.nhc_id || prev.nhcId,
          tier: intern.tier || prev.tier,
          track: intern.specialization_track || prev.track,
          institution: intern.institution || prev.institution,
          discipline: intern.discipline || prev.discipline,
          rawEmail: internProfileObj?.email || prev.rawEmail,
          location: intern.state_of_residence || prev.location,
          avatarUrl: internProfileObj?.avatar_url || '',
          bio: intern.bio || prev.bio,
          headline: intern.headline?.trim() ? intern.headline : prev.headline,
          headlineDescription: intern.headline_description?.trim()
            ? intern.headline_description
            : (intern.bio || prev.headlineDescription),
          sprintAttendanceScore: intern.sprint_attendance_score || '100%',
          ongoingAssignments: intern.ongoing_assignments || prev.ongoingAssignments,
          verifiedCertId: intern.verified_cert_id || prev.verifiedCertId,
          template: Number(intern.portfolio_template) || 5,
          skillsSpecialization: parsedSkills,
          projects: parsedProjects,
          reviews: loadedReviews,
          socialLinks: links,
        }));

        setRoleTitle(`${intern.specialization_track?.split(':')[1]?.trim() || 'Specialist'} Associate`);
      }
      setLoading(false);
    }

    loadCandidateAndAuth();
  }, [subdomain]);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBookmark = async () => {
    if (!currentUser || userRole !== 'startup') {
      setInterceptorTarget('Candidate Shortlist');
      setShowGateModal(true);
      return;
    }

    const trialMonths = portfolio.tier.includes('Fellow') ? 1 : portfolio.tier.includes('Associate') ? 2 : 3;

    if (bookmarked) {
      const { error } = await supabase
        .from('placements')
        .delete()
        .eq('startup_id', currentUser.id)
        .eq('intern_id', portfolio.id)
        .eq('pipeline_stage', 'SHORTLISTED');

      if (error) {
        console.error('Error removing bookmark:', error);
        alert(`Failed to remove bookmark: ${error.message}`);
        return;
      }
      setBookmarked(false);
    } else {
      const { data: existing } = await supabase
        .from('placements')
        .select('id')
        .eq('startup_id', currentUser.id)
        .eq('intern_id', portfolio.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('placements')
          .update({
            pipeline_stage: 'SHORTLISTED',
            status: 'INVITED',
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating placement to bookmark:', error);
          alert(`Database Error: ${error.message}`);
          return;
        }
      } else {
        const { error } = await supabase.from('placements').insert({
          startup_id: currentUser.id,
          intern_id: portfolio.id,
          role_title: roleTitle || `${portfolio.track} Associate`,
          intern_tier: portfolio.tier,
          trial_duration_months: trialMonths,
          contract_term: contractTerm,
          pre_agreed_stipend: proposedStipend,
          terms_agreed_by_startup: true,
          terms_agreed_by_intern: false,
          status: 'INVITED',
          pipeline_stage: 'SHORTLISTED',
        });

        if (error) {
          console.error('Error inserting bookmark placement:', error);
          alert(`Database Insert Error: ${error.message}`);
          return;
        }
      }

      setBookmarked(true);
    }
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInterceptAction = (channelName: string, externalUrl?: string) => {
    if (externalUrl && (externalUrl.startsWith('http://') || externalUrl.startsWith('https://'))) {
      window.open(externalUrl, '_blank');
      return;
    }

    setInterceptorTarget(channelName);
    if (userRole === 'startup') {
      setShowOfferModal(true);
    } else {
      setShowGateModal(true);
    }
  };

  const handleDispatchOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchingOffer(true);

    const trialMonths = portfolio.tier.includes('Fellow') ? 1 : portfolio.tier.includes('Associate') ? 2 : 3;

    if (!currentUser) {
      setDispatchingOffer(false);
      return;
    }

    const { data: existing } = await supabase
      .from('placements')
      .select('id')
      .eq('startup_id', currentUser.id)
      .eq('intern_id', portfolio.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('placements')
        .update({
          role_title: roleTitle,
          pipeline_stage: 'OFFER_EXTENDED',
          status: 'INVITED',
          contract_term: contractTerm,
          pre_agreed_stipend: proposedStipend,
          trial_duration_months: trialMonths,
          terms_agreed_by_startup: true,
          terms_agreed_by_intern: false,
        })
        .eq('id', existing.id);

      if (error) {
        setDispatchingOffer(false);
        console.error('Error updating offer:', error);
        alert(`Failed to send offer: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from('placements').insert({
        startup_id: currentUser.id,
        intern_id: portfolio.id,
        role_title: roleTitle,
        intern_tier: portfolio.tier,
        trial_duration_months: trialMonths,
        contract_term: contractTerm,
        pre_agreed_stipend: proposedStipend,
        terms_agreed_by_startup: true,
        terms_agreed_by_intern: false,
        status: 'INVITED',
        pipeline_stage: 'OFFER_EXTENDED',
      });

      if (error) {
        setDispatchingOffer(false);
        console.error('Error inserting offer:', error);
        alert(`Failed to send offer: ${error.message}`);
        return;
      }
    }

    setDispatchingOffer(false);
    setOfferSuccessNotice(true);
    setBookmarked(true);
    setTimeout(() => {
      setOfferSuccessNotice(false);
      setShowOfferModal(false);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-mono text-xs text-amber-300">
        <span className="animate-pulse">DECRYPTING VERIFIED TALENT CREDENTIALS...</span>
      </div>
    );
  }

  const tmpl = portfolio.template;

  const rootCanvas =
    tmpl === 1
      ? 'bg-[#04080e] text-emerald-300 font-mono'
      : tmpl === 2
      ? 'bg-[#f8fafc] text-slate-900 font-sans'
      : tmpl === 3
      ? 'bg-[#08020f] text-slate-100 font-sans'
      : tmpl === 4
      ? 'bg-[#ffffff] text-slate-800 font-sans'
      : 'bg-[#fefce8] text-black font-sans';

  const cardBox =
    tmpl === 1
      ? 'bg-[#08101a] border border-emerald-900/60 shadow-lg'
      : tmpl === 2
      ? 'bg-white border border-slate-200 shadow-sm'
      : tmpl === 3
      ? 'bg-[#120722]/80 border border-purple-500/20 backdrop-blur-xl shadow-2xl'
      : tmpl === 4
      ? 'bg-white border border-slate-200 shadow-md'
      : 'bg-white border-[3.5px] border-black shadow-[5px_5px_0px_0px_#000]';

  const brandAccent =
    tmpl === 1
      ? 'text-emerald-400'
      : tmpl === 2
      ? 'text-[#512d7c]'
      : tmpl === 3
      ? 'text-purple-400'
      : tmpl === 4
      ? 'text-indigo-600'
      : 'text-purple-700';

  const highlightBox =
    tmpl === 1
      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
      : tmpl === 2
      ? 'bg-slate-100 border border-slate-300 text-slate-800'
      : tmpl === 3
      ? 'bg-purple-950/40 border border-purple-500/30 text-purple-200'
      : tmpl === 4
      ? 'bg-indigo-50 border border-indigo-100 text-indigo-900'
      : 'bg-amber-100 border-2 border-black text-black';

  const navBar =
    tmpl === 1
      ? 'bg-[#04080e]/90 border-emerald-900/40'
      : tmpl === 2
      ? 'bg-slate-50/90 border-slate-200'
      : tmpl === 3
      ? 'bg-[#08020f]/90 border-purple-500/20'
      : tmpl === 4
      ? 'bg-white/90 border-slate-200'
      : 'bg-[#fefce8]/90 border-black';

  const navButtonActive =
    tmpl === 1
      ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
      : tmpl === 2
      ? 'text-slate-900 border-b-2 border-[#512d7c] font-bold'
      : tmpl === 3
      ? 'text-purple-400 border-b-2 border-purple-400 font-bold'
      : tmpl === 4
      ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
      : 'text-black border-b-[3px] border-black font-black';

  const hireCtaButton =
    tmpl === 1
      ? 'bg-emerald-600 hover:bg-emerald-500 text-black font-bold'
      : tmpl === 2
      ? 'bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold'
      : tmpl === 3
      ? 'bg-purple-600 hover:bg-purple-500 text-white font-bold'
      : tmpl === 4
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold'
      : 'bg-purple-600 hover:bg-purple-700 text-white font-black border-2 border-black shadow-[3px_3px_0px_#000]';

  const videoEmbedSrc = formatVideoEmbedUrl(portfolio.socialLinks.video_pitch);

  return (
    <div className={`min-h-screen ${rootCanvas} p-4 sm:p-8 lg:p-12 transition-colors duration-300`}>
      <ReferralTracker subdomain={subdomain} targetPage={`/portfolio/${subdomain}`} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b pb-3 border-current/20">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider">
            {tmpl === 5 ? (
              <span className="bg-black text-[#fefce8] px-3 py-1 font-black">
                NEO-BRUTALIST APPRENTICE ID // {portfolio.nhcId}
              </span>
            ) : (
              <span>DGG-NHC ACCREDITED TALENT DOSSIER // {portfolio.nhcId}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleBookmark}
              type="button"
              className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                bookmarked
                  ? 'bg-purple-600 text-white rounded-xl'
                  : tmpl === 5
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'border border-current/30 hover:bg-current/10 rounded-xl'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
              <span>{bookmarked ? 'Shortlisted' : 'Bookmark'}</span>
            </button>

            <button
              onClick={copyUrl}
              type="button"
              className={`px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                tmpl === 5
                  ? 'bg-black text-[#fefce8] hover:bg-slate-800 shadow-[3px_3px_0px_#000]'
                  : 'border border-current/30 hover:bg-current/10 rounded-xl'
              }`}
            >
              {copied ? 'COPIED!' : 'SHARE URL'}
            </button>
          </div>
        </div>

        {/* Master Dual-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          {/* Left Column */}
          <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            <div className={`p-6 sm:p-7 rounded-3xl ${cardBox} space-y-6`}>
              <div className="flex items-start space-x-4">
                <div
                  className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center font-black text-2xl ${
                    tmpl === 5
                      ? 'border-4 border-black bg-amber-300 shadow-[3px_3px_0px_#000]'
                      : 'border-2 border-current/30 bg-black/40'
                  }`}
                >
                  {portfolio.avatarUrl ? (
                    <img src={portfolio.avatarUrl} alt={portfolio.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{portfolio.name[0] || 'A'}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className={`text-[10px] font-mono font-bold uppercase block ${brandAccent}`}>
                    {portfolio.nhcId}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black leading-tight">{portfolio.name}</h1>
                  <p className="text-xs font-bold opacity-80">{portfolio.track}</p>
                  <p className="text-[11px] opacity-60 font-mono">{portfolio.institution}</p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl space-y-1 ${highlightBox}`}>
                <span className="text-[9px] font-mono uppercase font-bold opacity-70 block">
                  OFFICIAL TIER EVALUATION:
                </span>
                <span className="text-xs font-black block leading-snug">
                  {portfolio.tier}
                </span>
              </div>

              <div className="space-y-2.5 text-xs opacity-80 pt-2 border-t border-current/10">
                <div className="flex items-center space-x-2.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="font-mono">{maskEmail(portfolio.rawEmail)}</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span className="font-mono font-bold text-[11px]">{portfolio.verifiedCertId}</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded font-mono">
                    LMS ACCREDITED
                  </span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 opacity-60 text-amber-500" />
                  <span className="font-medium">{portfolio.location}</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-current/10">
                <span className="text-[9px] font-mono uppercase opacity-50 block font-bold">
                  Developer Repositories & Profiles
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleInterceptAction('GitHub Repositories', portfolio.socialLinks.github)}
                    title="Inspect GitHub Code"
                    className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-colors cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInterceptAction('LinkedIn Verification', portfolio.socialLinks.linkedin)}
                    title="Inspect LinkedIn Dossier"
                    className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-colors text-blue-500 cursor-pointer"
                  >
                    <LinkedinIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInterceptAction('Twitter / X Feed', portfolio.socialLinks.twitter)}
                    title="Inspect Twitter Profile"
                    className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-colors cursor-pointer"
                  >
                    <TwitterIcon className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInterceptAction('Live Website Link', portfolio.socialLinks.website)}
                    title="Inspect Web Architecture"
                    className="p-2 rounded-xl bg-current/5 hover:bg-current/10 transition-colors text-amber-500 cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 text-[10px] font-mono opacity-60 flex items-center justify-between border-t border-current/10">
                <span>PASS: {portfolio.verifiedCertId}</span>
                <span className="text-emerald-500 font-bold">&#10003; CRYPTOGRAPHICALLY SEALED</span>
              </div>
            </div>
          </aside>

          {/* Right Column */}
          <main className="lg:col-span-8 space-y-12">
            <header className={`sticky top-0 z-30 ${navBar} backdrop-blur-md border-b py-3 flex items-center justify-between`}>
              <nav className="flex items-center space-x-6 text-xs font-mono uppercase tracking-wider overflow-x-auto">
                {['about', 'skills', 'projects', 'education', 'reviews'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => scrollTo(sec)}
                    className={`pb-1 transition-all cursor-pointer ${
                      activeSection === sec ? navButtonActive : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </nav>

              <button
                type="button"
                onClick={() => handleInterceptAction('Direct Incubation Pipeline')}
                className={`px-4 py-1.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center space-x-1 ${hireCtaButton}`}
              >
                <span>Hire Apprentice</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </header>

            {/* Section: About */}
            <section id="about" className="space-y-6 scroll-mt-24">
              <div className="space-y-3">
                <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${brandAccent}`}>
                  // ENTERPRISE TALENT DOSSIER
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  {portfolio.headline}
                </h2>
                <p className="text-sm opacity-80 leading-relaxed max-w-2xl">
                  {portfolio.headlineDescription}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl ${cardBox} text-center space-y-1`}>
                  <div className="text-2xl font-black font-mono">{portfolio.sprintAttendanceScore}</div>
                  <div className="text-[10px] font-mono opacity-60 uppercase">Sprint Attendance</div>
                </div>

                <div className={`p-4 rounded-2xl ${cardBox} text-center space-y-1`}>
                  <div className="text-2xl font-black font-mono">
                    {portfolio.projects.length > 0 ? `${portfolio.projects.length}+` : '0+'}
                  </div>
                  <div className="text-[10px] font-mono opacity-60 uppercase">Capstones Built</div>
                </div>

                <div className={`p-4 rounded-2xl ${cardBox} text-center space-y-1`}>
                  <div className="text-2xl font-black font-mono">{portfolio.reviews.length}</div>
                  <div className="text-[10px] font-mono opacity-60 uppercase">Verified Reviews</div>
                </div>

                <div className={`p-4 rounded-2xl ${cardBox} text-center space-y-1`}>
                  <div className="text-2xl font-black font-mono">
                    {portfolio.tier.includes('Fellow') ? '1 MO' : portfolio.tier.includes('Associate') ? '2 MO' : '3 MO'}
                  </div>
                  <div className="text-[10px] font-mono opacity-60 uppercase">Trial Runway</div>
                </div>
              </div>

              {portfolio.ongoingAssignments && (
                <div className={`p-4 rounded-2xl ${cardBox} flex items-center space-x-3 text-xs`}>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <div>
                    <span className="font-mono text-[9px] uppercase opacity-60 block">CURRENT SPRINT ASSIGNMENT:</span>
                    <span className="font-bold">{portfolio.ongoingAssignments}</span>
                  </div>
                </div>
              )}

              {videoEmbedSrc && (
                <div className={`p-6 rounded-3xl ${cardBox} space-y-3`}>
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">
                      60-Second Video Elevator Pitch
                    </span>
                  </div>

                  <div className="w-full aspect-video rounded-2xl overflow-hidden border border-current/10 bg-black/80 flex items-center justify-center">
                    {videoEmbedSrc.endsWith('.mp4') || videoEmbedSrc.endsWith('.webm') ? (
                      <video src={videoEmbedSrc} controls className="w-full h-full object-cover" />
                    ) : (
                      <iframe
                        src={videoEmbedSrc}
                        title="Candidate Video Pitch"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Section: Skills */}
            <section id="skills" className="space-y-4 scroll-mt-24">
              <div className="border-b border-current/10 pb-2">
                <span className={`text-[10px] font-mono uppercase font-bold block ${brandAccent}`}>
                  Core Engineering & Architecture
                </span>
                <h3 className="text-xl font-black tracking-tight">Technical Specialization</h3>
              </div>

              {portfolio.skillsSpecialization.length === 0 ? (
                <div className={`p-6 rounded-2xl ${cardBox} text-center text-xs opacity-60 font-mono`}>
                  No skill specialization cards published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {portfolio.skillsSpecialization.map((skill, sIdx) => (
                    <div key={sIdx} className={`p-5 rounded-2xl ${cardBox} space-y-2`}>
                      {sIdx === 0 && <Code2 className={`w-5 h-5 ${brandAccent}`} />}
                      {sIdx === 1 && <Cpu className="w-5 h-5 text-sky-500" />}
                      {sIdx >= 2 && <Layers className="w-5 h-5 text-amber-500" />}
                      <h4 className="font-black text-sm">{skill.title}</h4>
                      <p className="text-xs opacity-75 leading-relaxed">{skill.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section: Projects */}
            <section id="projects" className="space-y-4 scroll-mt-24">
              <div className="border-b border-current/10 pb-2 flex justify-between items-center">
                <div>
                  <span className={`text-[10px] font-mono uppercase font-bold block ${brandAccent}`}>
                    Verified Portfolio Builds
                  </span>
                  <h3 className="text-xl font-black tracking-tight">Production Capstones</h3>
                </div>
                <span className="text-xs font-mono opacity-60">{portfolio.projects.length} Repositories</span>
              </div>

              {portfolio.projects.length === 0 ? (
                <div className={`p-8 rounded-3xl ${cardBox} text-center text-xs opacity-60 font-mono`}>
                  No production capstone builds uploaded to registry yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.projects.map((proj) => (
                    <div key={proj.id} className={`p-6 sm:p-7 rounded-3xl ${cardBox} space-y-4`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black">{proj.title}</h4>
                          <span className={`text-[10px] font-mono font-bold ${brandAccent}`}>
                            DGG-VERIFIED REPOSITORY
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {proj.githubUrl && (
                            <button
                              type="button"
                              onClick={() => handleInterceptAction(`Repository: ${proj.title}`, proj.githubUrl)}
                              className={`px-3 py-1.5 rounded-xl border border-current/20 text-xs font-bold flex items-center space-x-1.5 hover:bg-current/10 transition-all cursor-pointer ${
                                tmpl === 5 ? 'border-2 border-black shadow-[2px_2px_0px_#000]' : ''
                              }`}
                            >
                              <GithubIcon className="w-3.5 h-3.5" />
                              <span>Source Code</span>
                            </button>
                          )}

                          {proj.demoUrl && (
                            <a
                              href={proj.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${hireCtaButton}`}
                            >
                              <span>Live Demo</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{proj.description}</p>

                      {proj.tags && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-current/10">
                          {proj.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono ${
                                tmpl === 5
                                  ? 'bg-purple-200 border-2 border-black font-black text-black'
                                  : 'bg-current/5 border border-current/15'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section: Education */}
            <section id="education" className="space-y-4 scroll-mt-24">
              <div className="border-b border-current/10 pb-2">
                <span className={`text-[10px] font-mono uppercase font-bold block ${brandAccent}`}>
                  Academic History
                </span>
                <h3 className="text-xl font-black tracking-tight">University & Degrees</h3>
              </div>

              <div className={`p-6 rounded-2xl ${cardBox} space-y-2`}>
                <div className="flex items-center space-x-2 opacity-70">
                  <School className="w-4 h-4" />
                  <span className="font-mono text-[10px] font-bold uppercase">Accredited Academic Record</span>
                </div>
                <h4 className="font-black text-base">{portfolio.institution}</h4>
                <div className="flex items-center space-x-2 text-xs opacity-80">
                  <BookOpen className="w-3.5 h-3.5 text-[#512d7c]" />
                  <span>{portfolio.discipline || 'Undergraduate Degree Program'}</span>
                </div>
              </div>
            </section>

            {/* Section: Reviews */}
            <section id="reviews" className="space-y-4 scroll-mt-24">
              <div className="border-b border-current/10 pb-2 flex justify-between items-center">
                <div>
                  <span className={`text-[10px] font-mono uppercase font-bold block ${brandAccent}`}>
                    Tripartite Feedback
                  </span>
                  <h3 className="text-xl font-black tracking-tight">Enterprise Endorsements</h3>
                </div>
                <span className="text-xs font-mono text-emerald-500 font-bold">&#10003; Verified Placements</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {portfolio.reviews.map((rev) => (
                  <div key={rev.id} className={`p-6 rounded-3xl ${cardBox} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm">{rev.authorName}</h4>
                        <span className="text-[10px] font-mono opacity-60">{rev.authorRole}</span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className={`text-xs opacity-90 leading-relaxed italic p-3 rounded-xl ${
                      tmpl === 5 ? 'bg-amber-50 border-2 border-black' : 'bg-current/5 border border-current/10'
                    }`}>
                      "{rev.comment}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pt-1">
                      <span className="text-emerald-500 font-bold flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>VERIFIED RECORD</span>
                      </span>
                      <span>{rev.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="pt-10 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono opacity-60 pb-12">
              <div>&copy; {new Date().getFullYear()} {portfolio.name}. All rights reserved.</div>
              <div className="font-bold flex items-center space-x-1.5">
                <span>Powered by</span>
                <span className={tmpl === 5 ? 'bg-amber-300 text-black px-1.5 py-0.5 border border-black font-black' : 'text-amber-400'}>
                  D-Global Growthfield Ltd
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Modal 1: Access Gate */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold uppercase text-[#512d7c]">
                  Enterprise Authorization Required
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-950">
                Connect with {portfolio.name}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                To inspect candidate repositories, bookmark profiles, or propose a zero-risk incubation trial, register as an enterprise partner.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Access Point:</span>
                <span className="font-bold text-slate-800">{interceptorTarget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proof-of-Value Runway:</span>
                <span className="font-bold text-emerald-700">{portfolio.tier}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href={`/auth/signup?role=startup&target=${portfolio.nhcId}`}
                className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Building className="w-4 h-4" />
                <span>Register Startup to Connect ➔</span>
              </Link>

              <Link
                href={`/auth/login?redirect=/portfolio/${subdomain}`}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
              >
                Already an Enterprise Partner? Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Incubation Offer */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">
                  Direct Enterprise Incubation Desk
                </span>
                <h3 className="text-base font-black text-slate-950">
                  Propose Terms to {portfolio.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {offerSuccessNotice ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Incubation Offer Dispatched!</h4>
                <p className="text-xs text-slate-600">
                  {portfolio.name} has been notified and placed in your active Hiring Pipeline.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDispatchOffer} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Proposed Position Title</label>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Post-Trial Contract Term</label>
                    <select
                      value={contractTerm}
                      onChange={(e) => setContractTerm(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="6_MONTHS">6 Months Term</option>
                      <option value="1_YEAR">1 Year Term (Standard)</option>
                      <option value="2_YEARS">2 Years Term (Max Term)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pre-Agreed Monthly Stipend (₦)</label>
                    <input
                      type="number"
                      min={50000}
                      max={500000}
                      step={5000}
                      value={proposedStipend}
                      onChange={(e) => setProposedStipend(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Free Proof-of-Value Runway:</span>
                    <span className="font-bold text-emerald-700">{portfolio.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pre-Agreed Monthly Salary:</span>
                    <span className="font-bold text-slate-900">₦{proposedStipend.toLocaleString()} / mo</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 text-[11px] text-purple-800 font-bold">
                    <span>10% Platform Facilitation Surcharge:</span>
                    <span>₦{(proposedStipend * 0.1).toLocaleString()} / mo</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The trial is 100% free ($0 commitment). The pre-agreed monthly stipend locks into escrow upon successful trial completion.
                </p>

                <button
                  type="submit"
                  disabled={dispatchingOffer}
                  className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{dispatchingOffer ? 'Sending Official Offer...' : 'Send Official Incubation Offer ➔'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}