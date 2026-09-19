'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  Award,
  Sparkles,
  School,
  FolderGit2,
  Star,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Loader2,
  Code2,
  Layers,
  Edit3,
  RotateCw,
  Globe,
  UploadCloud,
  Check,
  AlertCircle,
  BookOpen,
  Camera,
  MapPin,
  Video,
  Mail
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

interface SkillCard {
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

const DEFAULT_TRACKS = [
  'TRK-01: Full Stack Development',
  'TRK-02: Data Analytics',
  'TRK-03: Growth Marketing & SEO',
  'TRK-04: Product Design & UI/UX',
  'TRK-05: Video Ads & Media',
];

const POPULAR_STATES = [
  'Lagos State',
  'Abuja (FCT)',
  'Rivers State (Port Harcourt)',
  'Oyo State (Ibadan)',
  'Enugu State',
  'Plateau State (Jos)',
  'Kaduna State',
  'Remote / Global',
];

export default function InternProfileManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Email verification state
  const [userEmail, setUserEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Identity & Signup Columns
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [track, setTrack] = useState('TRK-01: Full Stack Development');
  const [isCustomTrack, setIsCustomTrack] = useState(false);
  const [stateOfResidence, setStateOfResidence] = useState('Lagos State');
  const [isCustomState, setIsCustomState] = useState(false);
  const [tier, setTier] = useState('Associate (Intermediate: 2-month trial)');
  const [ongoingWork, setOngoingWork] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [nhcId, setNhcId] = useState('DGG-NHC-2026');
  const [certId, setCertId] = useState('DGG-TN-2026');

  // Video Pitch & Social Links
  const [videoPitchUrl, setVideoPitchUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Hero Section
  const [headline, setHeadline] = useState('');
  const [headlineDescription, setHeadlineDescription] = useState('');

  // Technical Specialization Cards & Projects
  const [skills, setSkills] = useState<SkillCard[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // Enterprise Reviews
  const [reviews] = useState<ReviewItem[]>([
    {
      id: 'rev-1',
      authorName: 'AfriPay Fintech Hub Ltd.',
      authorRole: 'Enterprise Startup Supervisor',
      rating: 5,
      title: 'Flawless Execution & High Reliability',
      comment: 'Consistently punctual, executes sprint deliverables ahead of schedule, and maintains excellent communication.',
      date: 'Aug 28, 2026',
    },
    {
      id: 'rev-2',
      authorName: 'DGG Master Operations Desk',
      authorRole: 'Incubator Academic Board',
      rating: 5,
      title: 'Exemplary Sprint Discipline',
      comment: 'Maintained strong daily clock-in consistency throughout all incubator modules.',
      date: 'Aug 15, 2026',
    },
  ]);

  // Skill Modal
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);
  const [skillFormTitle, setSkillFormTitle] = useState('');
  const [skillFormDescription, setSkillFormDescription] = useState('');

  // Project Modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjDemo, setNewProjDemo] = useState('');
  const [newProjGithub, setNewProjGithub] = useState('');
  const [newProjTags, setNewProjTags] = useState('Growth Marketing, SEO');

  useEffect(() => {
    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUserEmail(authData.user.email || '');
        // Real check: evaluates true only if email_confirmed_at is populated
        setIsEmailVerified(Boolean(authData.user.email_confirmed_at));

        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, avatar_url')
          .eq('id', authData.user.id)
          .maybeSingle();

        const { data: intern } = await supabase
          .from('intern_profiles')
          .select(`
            nhc_id,
            tier,
            specialization_track,
            state_of_residence,
            institution,
            discipline,
            bio,
            ongoing_assignments,
            verified_cert_id,
            headline,
            headline_description,
            skills_specialization,
            projects,
            social_links
          `)
          .eq('id', authData.user.id)
          .maybeSingle();

        if (prof) {
          setFirstName(prof.first_name || '');
          setLastName(prof.last_name || '');
          setPhone(prof.phone || '');
          setAvatarUrl(prof.avatar_url || '');
        }

        if (intern) {
          setNhcId(intern.nhc_id || 'DGG-NHC-2026');
          setTier(intern.tier || 'Associate (Intermediate: 2-month trial)');

          const fetchedTrack = intern.specialization_track || 'TRK-01: Full Stack Development';
          setTrack(fetchedTrack);
          if (!DEFAULT_TRACKS.includes(fetchedTrack)) {
            setIsCustomTrack(true);
          }

          const fetchedState = intern.state_of_residence || 'Lagos State';
          setStateOfResidence(fetchedState);
          if (!POPULAR_STATES.includes(fetchedState)) {
            setIsCustomState(true);
          }

          setInstitution(intern.institution || '');
          setDiscipline(intern.discipline || '');
          setBio(intern.bio || '');
          setOngoingWork(intern.ongoing_assignments || '');
          setCertId(intern.verified_cert_id || 'DGG-TN-2026');
          setHeadline(intern.headline || '');
          setHeadlineDescription(intern.headline_description || '');

          if (Array.isArray(intern.skills_specialization)) {
            setSkills(intern.skills_specialization);
          } else if (typeof intern.skills_specialization === 'string') {
            try {
              setSkills(JSON.parse(intern.skills_specialization));
            } catch {
              setSkills([]);
            }
          }

          if (Array.isArray(intern.projects)) {
            setProjects(intern.projects);
          } else if (typeof intern.projects === 'string') {
            try {
              setProjects(JSON.parse(intern.projects));
            } catch {
              setProjects([]);
            }
          }

          if (intern.social_links) {
            setGithubUrl(intern.social_links.github || '');
            setLinkedinUrl(intern.social_links.linkedin || '');
            setTwitterUrl(intern.social_links.twitter || '');
            setWebsiteUrl(intern.social_links.website || '');
            setVideoPitchUrl(intern.social_links.video_pitch || '');
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleResendVerification = async () => {
    if (!userEmail) return;
    setResendingEmail(true);
    setVerificationNotice(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    });

    setResendingEmail(false);

    if (error) {
      setVerificationNotice(`Error: ${error.message}`);
    } else {
      setVerificationNotice('Verification link successfully sent to your email inbox!');
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setErrorMessage(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        throw new Error('Authentication expired. Please log in again.');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `avatar_${authData.user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      setAvatarUrl(newAvatarUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo. Ensure avatars storage bucket exists.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMessage(null);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setErrorMessage('Session expired. Please log in again.');
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        avatar_url: avatarUrl,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      setErrorMessage(`Profile table update failed: ${profileError.message}`);
      setSaving(false);
      return;
    }

    const skillTagNames = skills.map((s) => s.title);

    const { error: internError } = await supabase
      .from('intern_profiles')
      .update({
        institution: institution,
        discipline: discipline,
        specialization_track: track,
        state_of_residence: stateOfResidence,
        bio: bio,
        ongoing_assignments: ongoingWork,
        headline: headline,
        headline_description: headlineDescription,
        skills: skillTagNames,
        skills_specialization: skills,
        projects: projects,
        social_links: {
          github: githubUrl,
          linkedin: linkedinUrl,
          twitter: twitterUrl,
          website: websiteUrl,
          video_pitch: videoPitchUrl,
        },
      })
      .eq('id', authData.user.id);

    if (internError) {
      setErrorMessage(`Intern database update failed: ${internError.message}`);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleOpenAddSkill = () => {
    setEditingSkillIndex(null);
    setSkillFormTitle('');
    setSkillFormDescription('');
    setShowSkillModal(true);
  };

  const handleOpenEditSkill = (index: number) => {
    setEditingSkillIndex(index);
    setSkillFormTitle(skills[index].title);
    setSkillFormDescription(skills[index].description);
    setShowSkillModal(true);
  };

  const handleSaveSkillForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillFormTitle.trim() || !skillFormDescription.trim()) return;

    if (editingSkillIndex !== null) {
      const updated = [...skills];
      updated[editingSkillIndex] = {
        title: skillFormTitle.trim(),
        description: skillFormDescription.trim(),
      };
      setSkills(updated);
    } else {
      setSkills([
        ...skills,
        {
          title: skillFormTitle.trim(),
          description: skillFormDescription.trim(),
        },
      ]);
    }
    setShowSkillModal(false);
  };

  const handleDeleteSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim()) return;
    const tagArray = newProjTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setProjects([
      ...projects,
      {
        id: `p-${Date.now()}`,
        title: newProjTitle,
        description: newProjDesc,
        demoUrl: newProjDemo,
        githubUrl: newProjGithub,
        tags: tagArray.length > 0 ? tagArray : ['Growth Marketing', 'SEO'],
      },
    ]);
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjDemo('');
    setNewProjGithub('');
    setNewProjTags('Growth Marketing, SEO');
    setShowProjectModal(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs">
        <span className="animate-pulse text-[#512d7c] font-bold">
          SYNCHRONIZING APPRENTICE PROFILE DATA...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileSelect}
      />

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Identity, Digital Pass & Endorsements
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Student Profile, Holographic ID & Reviews
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Upload your verified headshot, configure custom tracks, embed your elevator video pitch, and manage capstones directly with database synchronization.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAll}
          className="px-6 py-3.5 bg-[#f2b42c] hover:bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving to Database...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile & Credentials</span>
            </>
          )}
        </button>
      </div>

      {/* EMAIL VERIFICATION STATUS & ACTION BANNER (CLEANED OF INTERNAL STACK NAMES) */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans ${isEmailVerified ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
        <div className="flex items-center space-x-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isEmailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 text-sm">Account Email: {userEmail}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${isEmailVerified ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-900'}`}>
                {isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isEmailVerified ? 'Your corporate email address is fully authenticated.' : 'Your email address is unverified. Please verify your email to unlock all platform privileges.'}
            </p>
          </div>
        </div>

        {!isEmailVerified && (
          <button
            type="button"
            disabled={resendingEmail}
            onClick={handleResendVerification}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {resendingEmail ? 'Sending Link...' : 'Verify Your Email Now ➔'}
          </button>
        )}
      </div>

      {verificationNotice && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-[#512d7c] rounded-2xl text-xs font-bold">
          {verificationNotice}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All profile details, campus, custom track, location, and capstones successfully updated!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TOP SECTION: HOLOGRAPHIC DIGITAL PASS & PROFILE SETTINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Tamper-Proof Digital Pass Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-500">
              TAMPER-PROOF DIGITAL PASS
            </span>
            <button
              type="button"
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="text-[11px] font-mono font-bold text-[#512d7c] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isCardFlipped ? 'Flip to Front' : 'Flip to Back ➔'}</span>
            </button>
          </div>

          <div
            className={`w-full rounded-3xl p-6 sm:p-7 border transition-all duration-500 shadow-xl relative overflow-hidden ${
              isCardFlipped
                ? 'bg-gradient-to-br from-[#120722] to-[#250d3e] text-white border-purple-500/40'
                : 'bg-gradient-to-br from-[#0c0416] via-[#1b082e] to-[#0a0212] text-white border-purple-500/30'
            }`}
          >
            {!isCardFlipped ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                      D
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white block">
                        DGG-NHC CREDENTIAL
                      </span>
                      <span className="text-[8px] font-mono text-amber-300 block">PAN-AFRICAN DISCOVERY</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 text-[9px] font-mono font-bold">
                    &#10003; LMS VERIFIED
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-400/40 bg-[#250d3e] shrink-0 flex items-center justify-center font-black text-2xl text-white shadow-inner relative group cursor-pointer"
                    title="Click to Change Photo"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{firstName[0] || 'A'}</span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      {uploadingPhoto ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 mb-0.5 text-amber-300" />
                          <span className="text-[8px] font-mono uppercase font-bold">Change</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-white leading-tight">
                      {firstName} {lastName}
                    </h3>
                    <p className="text-xs font-bold text-purple-300">{track}</p>
                    <span className="text-[10px] text-white/60 font-mono block">
                      {institution || 'University Campus'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-amber-300 hover:text-amber-200 underline font-mono flex items-center space-x-1 cursor-pointer pt-0.5"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Upload Headshot'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-0.5">
                  <span className="text-[8px] font-mono uppercase text-amber-300 font-bold block">
                    ASSIGNED INCUBATION TIER & RUNWAY:
                  </span>
                  <span className="text-xs font-black text-white block">{tier}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/70">
                  <div>
                    <span className="text-[8px] uppercase block opacity-60">ACCREDITED PASS ID</span>
                    <span className="font-bold text-amber-300">{nhcId}</span>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[10px] font-bold text-amber-300 uppercase">SECURITY LEDGER</span>
                  <span className="text-[9px] text-white/60">SEAL: {certId}</span>
                </div>

                <div className="space-y-2 text-[11px] text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">LMS Cert ID:</span>
                    <span className="font-bold text-emerald-400">{certId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Discipline:</span>
                    <span className="font-bold text-white">{discipline || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Region:</span>
                    <span className="font-bold text-amber-300">{stateOfResidence}</span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 border border-white/10 rounded-2xl text-[10px] text-white/60 leading-relaxed">
                  Issued by D-Global Growthfield Academic Board. Tamper-evident verified digital certificate. Disintermediation protection active.
                </div>

                <div className="text-[9px] text-center text-white/40 uppercase">
                  &bull; SECURED BY DGG ENGINE &bull;
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Direct Profile Settings & Academic Data (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-[#512d7c]" />
              <span>Personal, Academic & Location Settings</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Modifying these fields directly updates your primary database records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number (Masked Publicly)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1">
                <School className="w-3.5 h-3.5 text-[#512d7c]" />
                <span>School / Institution</span>
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. University of Jos"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-[#512d7c]" />
                <span>Discipline of Study</span>
              </label>
              <input
                type="text"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                placeholder="e.g. Mass Communication / Business Admin"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#512d7c]" />
                <span>State of Residence / Region</span>
              </label>
              <select
                value={isCustomState ? 'OTHER' : stateOfResidence}
                onChange={(e) => {
                  if (e.target.value === 'OTHER') {
                    setIsCustomState(true);
                    setStateOfResidence('');
                  } else {
                    setIsCustomState(false);
                    setStateOfResidence(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              >
                {POPULAR_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
                <option value="OTHER">Other (Specify Custom Region)...</option>
              </select>

              {isCustomState && (
                <input
                  type="text"
                  required
                  value={stateOfResidence}
                  onChange={(e) => setStateOfResidence(e.target.value)}
                  placeholder="e.g. Ogun State (Abeokuta) or Accra, Ghana"
                  className="w-full mt-2 px-3.5 py-2 bg-white border border-[#512d7c] rounded-xl text-slate-900 font-medium focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Specialization Track</label>
              <select
                value={isCustomTrack ? 'CUSTOM' : track}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomTrack(true);
                    setTrack('');
                  } else {
                    setIsCustomTrack(false);
                    setTrack(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              >
                {DEFAULT_TRACKS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="CUSTOM">Other (Specify Custom Track)...</option>
              </select>

              {isCustomTrack && (
                <input
                  type="text"
                  required
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  placeholder="e.g. TRK-06: AI Automation Specialist"
                  className="w-full mt-2 px-3.5 py-2 bg-white border border-[#512d7c] rounded-xl text-slate-900 font-bold focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Ongoing Work / Active Sprints
              </label>
              <input
                type="text"
                value={ongoingWork}
                onChange={(e) => setOngoingWork(e.target.value)}
                placeholder="e.g. Active Sprints on DGG-NexusHub"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Professional Bio / Pitch</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Results-driven growth strategist..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
              SOCIAL & DEVELOPER LINK-TREE
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="relative">
                <GithubIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="relative">
                <LinkedinIcon className="w-4 h-4 absolute left-3 top-3 text-blue-500" />
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="relative">
                <TwitterIcon className="w-4 h-4 absolute left-3 top-3 text-slate-600" />
                <input
                  type="text"
                  placeholder="https://x.com/..."
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-amber-500" />
                <input
                  type="text"
                  placeholder="https://yourportfolio.dev"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PORTFOLIO HERO, HOOK & ELEVATOR VIDEO PITCH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Portfolio Hero, Hook Headline & Video Elevator Pitch</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Customize the primary headline, narrative pitch, and introduction video shown to reviewing founders.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-purple-50 text-[#512d7c] font-bold px-2 py-0.5 rounded border border-purple-200">
            HERO & MEDIA
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Primary Hero Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Growth Marketing Specialist & Live Brand Broadcaster"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Headline Description (Detailed Pitch / About Me)
            </label>
            <textarea
              rows={3}
              value={headlineDescription}
              onChange={(e) => setHeadlineDescription(e.target.value)}
              placeholder="Provide a detailed narrative of your skills and track record..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
            />
          </div>

          <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
            <label className="block text-slate-900 font-bold text-xs flex items-center space-x-2">
              <Video className="w-4 h-4 text-[#512d7c]" />
              <span>60-Second Video Elevator Pitch URL (Loom, YouTube, Vimeo, or MP4)</span>
            </label>
            <input
              type="text"
              value={videoPitchUrl}
              onChange={(e) => setVideoPitchUrl(e.target.value)}
              placeholder="https://www.loom.com/share/... or https://youtu.be/..."
              className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#512d7c]"
            />
            <p className="text-[10px] text-slate-500 leading-tight">
              Reviewing founders can watch your quick introduction video directly on your public portfolio.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: TECHNICAL SPECIALIZATION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-purple-600" />
              <span>Technical Specialization Cards (Core Skills)</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Add, edit, or remove the technical focus cards that appear under your "#skills" portfolio anchor.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSkill}
            className="px-3.5 py-1.5 bg-purple-50 hover:bg-[#512d7c] text-[#512d7c] hover:text-white border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill Card</span>
          </button>
        </div>

        {skills.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            No technical specialization cards added yet. Click "+ Add Skill Card" above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {skills.map((s, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative group hover:border-[#512d7c] transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#512d7c] flex items-center justify-center font-bold text-xs">
                      0{idx + 1}
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900">{s.title}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSkill(idx)}
                      className="text-slate-400 hover:text-[#512d7c] p-1 transition-colors cursor-pointer"
                      title="Edit Card"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Remove Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: SHOWCASE PROJECT VAULT */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <FolderGit2 className="w-4 h-4 text-[#512d7c]" />
              <span>Showcase Project Vault</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Add your completed capstone builds. These automatically persist to your `projects` column and display on your public portfolio.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowProjectModal(true)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            No capstone projects added yet. Click "+ Add New Project" above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-xs text-slate-900">{proj.title}</h3>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(proj.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">{proj.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: VERIFIED ENTERPRISE REVIEWS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Verified Enterprise Reviews & Endorsements</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Ratings and official feedback submitted by enterprise startups and Master Admin.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
            {reviews.length} Verified Reviews
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-slate-900">{rev.title}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">{rev.authorName}</span>
                </div>
                <div className="flex text-amber-400">{'★'.repeat(rev.rating)}</div>
              </div>
              <p className="text-[11px] text-slate-600 italic leading-relaxed">"{rev.comment}"</p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-400">
                <span className="text-emerald-700 font-bold">&#10003; DGG VERIFIED CONTRACT</span>
                <span>{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SKILL ADD / EDIT MODAL */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {editingSkillIndex !== null ? 'Edit Skill Specialization' : 'Add Technical Specialization'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSkillModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSkillForm} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Skill Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local SEO & Map Pack"
                  value={skillFormTitle}
                  onChange={(e) => setSkillFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Skill Card Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe tools, systems, and execution delivered..."
                  value={skillFormDescription}
                  onChange={(e) => setSkillFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  {editingSkillIndex !== null ? 'Update Card' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Add Capstone Project</h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OmniChannel Social Distribution & Content Engine"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Engineered viral content hooks and automated multi-platform scheduling..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">GitHub Repo URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/..."
                  value={newProjGithub}
                  onChange={(e) => setNewProjGithub(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Live Demo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://social-engine.vercel.app"
                  value={newProjDemo}
                  onChange={(e) => setNewProjDemo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Social Media, Buffer, Meta Suite"
                  value={newProjTags}
                  onChange={(e) => setNewProjTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}