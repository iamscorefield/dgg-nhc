'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  RefreshCw,
  AlertCircle,
  X,
  Users
} from 'lucide-react';

interface JobListing {
  id: string;
  db_id: string;
  title: string;
  track: string;
  stipend: number;
  workMode: string;
  location: string;
  applicantsCount: number;
  status: 'Active' | 'Closed' | 'Draft';
  datePosted: string;
}

export default function PostInternshipRolePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeJobs, setActiveJobs] = useState<JobListing[]>([]);
  const [actionProcessingId, setActionProcessingId] = useState<string | null>(null);

  // Form State
  const [customTrack, setCustomTrack] = useState('');
  const [roleData, setRoleData] = useState({
    title: '',
    track: 'TRK-01: Full Stack Development',
    stipend: '100000',
    workMode: 'Remote',
    location: 'Remote',
    duration: '3 Months Incubation',
    description: '',
    requirements: '',
  });

  const loadRoles = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }

    const uid = authData.user.id;

    // 1. Fetch live jobs posted by this startup
    const { data: listings, error } = await supabase
      .from('startup_jobs')
      .select('*')
      .eq('startup_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error.message);
      setActiveJobs([]);
      setLoading(false);
      return;
    }

    if (listings && listings.length > 0) {
      // 2. Fetch live applicant counts from placements / applications if available
      const { data: applications } = await supabase
        .from('placements')
        .select('id, role_title')
        .eq('startup_id', uid);

      const applicantMap: Record<string, number> = {};
      applications?.forEach((app) => {
        const key = app.role_title?.trim().toLowerCase();
        if (key) {
          applicantMap[key] = (applicantMap[key] || 0) + 1;
        }
      });

      const mapped: JobListing[] = listings.map((j: any) => {
        const titleKey = (j.role_title || '').trim().toLowerCase();
        const count = applicantMap[titleKey] || j.applicant_count || 0;

        return {
          id: j.job_code || `JOB-${j.id.slice(0, 6).toUpperCase()}`,
          db_id: j.id,
          title: j.role_title,
          track: j.track || 'Specialist Track',
          stipend: Number(j.stipend_amount || 0),
          workMode: j.work_mode || 'Remote',
          location: j.location || 'Remote',
          applicantsCount: count,
          status: j.status === 'Closed' ? 'Closed' : 'Active',
          datePosted: j.created_at
            ? new Date(j.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Recently',
        };
      });

      setActiveJobs(mapped);
    } else {
      setActiveJobs([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      alert('You must be logged in as an enterprise to post a role.');
      setSubmitting(false);
      return;
    }

    const stipendNum = Number(roleData.stipend);
    const generatedCode = `JOB-${Date.now().toString().slice(-4)}`;

    const finalTrack =
      roleData.track === 'CUSTOM'
        ? (customTrack.trim() || 'Specialist Track')
        : roleData.track;

    const { data, error } = await supabase
      .from('startup_jobs')
      .insert({
        startup_id: authData.user.id,
        job_code: generatedCode,
        role_title: roleData.title,
        track: finalTrack,
        stipend_amount: stipendNum,
        work_mode: roleData.workMode,
        location: roleData.location,
        description: roleData.description,
        requirements: roleData.requirements
          ? roleData.requirements.split(',').map((r) => r.trim()).filter(Boolean)
          : [],
        status: 'Active',
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      alert(`Failed to publish role: ${error.message}`);
      return;
    }

    const createdListing: JobListing = {
      id: data.job_code || generatedCode,
      db_id: data.id,
      title: data.role_title,
      track: data.track,
      stipend: stipendNum,
      workMode: data.work_mode,
      location: data.location,
      applicantsCount: 0,
      status: 'Active',
      datePosted: 'Today',
    };

    setActiveJobs([createdListing, ...activeJobs]);
    setSuccessNotice(true);
    setShowForm(false);
    setCustomTrack('');
    setRoleData({
      title: '',
      track: 'TRK-01: Full Stack Development',
      stipend: '100000',
      workMode: 'Remote',
      location: 'Remote',
      duration: '3 Months Incubation',
      description: '',
      requirements: '',
    });

    setTimeout(() => setSuccessNotice(false), 3500);
  };

  const handleToggleJobStatus = async (job: JobListing) => {
    setActionProcessingId(job.db_id);
    const newStatus = job.status === 'Active' ? 'Closed' : 'Active';

    const { error } = await supabase
      .from('startup_jobs')
      .update({ status: newStatus })
      .eq('id', job.db_id);

    setActionProcessingId(null);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
      return;
    }

    setActiveJobs((prev) =>
      prev.map((j) => (j.db_id === job.db_id ? { ...j, status: newStatus } : j))
    );
  };

  const handleDeleteJob = async (job: JobListing) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"?`)) return;

    setActionProcessingId(job.db_id);

    const { error } = await supabase
      .from('startup_jobs')
      .delete()
      .eq('id', job.db_id);

    setActionProcessingId(null);

    if (error) {
      alert(`Failed to delete role: ${error.message}`);
      return;
    }

    setActiveJobs((prev) => prev.filter((j) => j.db_id !== job.db_id));
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          Querying Verified Enterprise Job Board...
        </span>
      </div>
    );
  }

  const baseStipend = Number(roleData.stipend || 0);
  const platformFee = baseStipend * 0.1;
  const totalEscrow = baseStipend + platformFee;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#512d7c] via-[#3a1d5a] to-[#ff7a00] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#f2b42c]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-200">
              Campus Talent Ingestion
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Post Internship & Apprenticeship Roles
          </h1>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Broadcast openings to hundreds of pre-vetted campus talent. Listings automatically connect to DGG milestone escrow agreements.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-[#f2b42c] hover:bg-[#e0a21f] text-slate-900 font-extrabold text-xs rounded-xl shadow flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Close Editor' : 'Post New Role'}</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Role published successfully! Now visible to matching apprentice candidates.</span>
        </div>
      )}

      {/* Role Creation Form (Expandable) */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#512d7c]" />
              <span>Create Apprenticeship Opportunity</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify skills, scope of deliverables, and stipend terms for candidates.
            </p>
          </div>

          <form onSubmit={handleCreateJob} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Role Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Next.js Full Stack Apprentice"
                  value={roleData.title}
                  onChange={(e) => setRoleData({ ...roleData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 font-bold">Incubation Track</label>
                <select
                  value={roleData.track}
                  onChange={(e) => setRoleData({ ...roleData, track: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c] cursor-pointer"
                >
                  <option value="TRK-01: Full Stack Development">TRK-01: Full Stack Development</option>
                  <option value="TRK-02: Data Analytics">TRK-02: Data Analytics</option>
                  <option value="TRK-03: Product Design & Figma">TRK-03: Product Design & Figma</option>
                  <option value="TRK-04: Digital Marketing & SEO">TRK-04: Digital Marketing & SEO</option>
                  <option value="TRK-05: Video Making & Ads">TRK-05: Video Making & Ads</option>
                  <option value="TRK-06: Mobile App Dev (React Native)">TRK-06: Mobile App Dev (React Native)</option>
                  <option value="CUSTOM">Custom Track / Other...</option>
                </select>

                {roleData.track === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom track name (e.g. AI Prompt Engineering & Automation)"
                    value={customTrack}
                    onChange={(e) => setCustomTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-purple-50/50 border border-purple-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c] text-xs"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Monthly Stipend (NGN)</label>
                <input
                  type="number"
                  required
                  min={50000}
                  max={500000}
                  value={roleData.stipend}
                  onChange={(e) => setRoleData({ ...roleData, stipend: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Work Arrangement</label>
                <select
                  value={roleData.workMode}
                  onChange={(e) => setRoleData({ ...roleData, workMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c] cursor-pointer"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">Location / Hub</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagos, Hybrid or Remote"
                  value={roleData.location}
                  onChange={(e) => setRoleData({ ...roleData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">Key Skills (comma separated)</label>
              <input
                type="text"
                placeholder="Next.js, Tailwind, Supabase, TypeScript, GitHub"
                value={roleData.requirements}
                onChange={(e) => setRoleData({ ...roleData, requirements: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">Role Description & Core Deliverables</label>
              <textarea
                rows={3}
                required
                placeholder="Detail what the apprentice will build, sprint expectations, and reporting structure..."
                value={roleData.description}
                onChange={(e) => setRoleData({ ...roleData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              />
            </div>

            {/* Escrow Surcharge Calculation Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 font-mono text-xs">
              <span className="font-sans font-bold text-slate-700 block text-[11px]">
                Platform Facilitation Escrow Breakdown
              </span>
              <div className="flex justify-between text-slate-500">
                <span>Monthly Apprentice Stipend:</span>
                <span className="font-bold text-slate-900">₦{baseStipend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>DGG 10% Platform Facilitation Fee:</span>
                <span className="font-bold text-[#512d7c]">₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-black pt-1 border-t border-slate-200">
                <span>Required Monthly Escrow Commitment:</span>
                <span>₦{totalEscrow.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Publishing Role...' : 'Publish Internship Role to Talent Pool ➔'}
            </button>
          </form>
        </div>
      )}

      {/* Active Listings Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#ff7a00]" />
              <span>Your Active Job Postings</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage live job availability, track applicant pipelines, and adjust listing states.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={loadRoles}
              className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 font-bold">
              {activeJobs.length} Open Positions
            </span>
          </div>
        </div>

        {activeJobs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-sm text-slate-800">No Job Postings Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't posted any apprenticeship roles. Click <strong>Post New Role</strong> above to publish your first opening.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div
                key={job.db_id}
                className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-300 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      {job.id}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Posted {job.datePosted}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-slate-900">{job.title}</h3>
                  <p className="text-xs font-bold text-[#512d7c]">{job.track}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location} ({job.workMode})</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono font-bold text-emerald-600">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>₦{job.stipend.toLocaleString()} / mo</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-sm font-black font-mono text-slate-900 block">
                      {job.applicantsCount}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Candidates</span>
                  </div>

                  <button
                    type="button"
                    disabled={actionProcessingId === job.db_id}
                    onClick={() => handleToggleJobStatus(job)}
                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {job.status === 'Active' ? 'Close Role' : 'Reactivate'}
                  </button>

                  <button
                    type="button"
                    disabled={actionProcessingId === job.db_id}
                    onClick={() => handleDeleteJob(job)}
                    className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}