'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  RefreshCw,
  FolderGit2,
  User,
  Star,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Check,
  Building,
  Sparkles,
  Edit3,
  Layers,
  Save,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SprintSubmission {
  id: string;
  placement_id: string;
  intern_id: string;
  month_number: number;
  week_number: number;
  title: string;
  description: string;
  deliverable_url?: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  supervisor_feedback?: string;
  created_at: string;
  placements?: {
    role_title: string;
    pre_agreed_stipend: number;
    intern_tier: string;
  };
  intern_name?: string;
}

interface AttendanceLog {
  id: string;
  placement_id: string;
  intern_name: string;
  role_title: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string;
  notes: string;
}

interface PlacementOption {
  placement_id: string;
  intern_id: string;
  intern_name: string;
  role_title: string;
  intern_tier: string;
  pre_agreed_stipend: number;
}

function getTotalMonths(tierString: string = ''): number {
  const lower = tierString.toLowerCase();
  if (lower.includes('3-month') || lower.includes('junior') || lower.includes('entry') || lower.includes('newbie')) {
    return 3;
  }
  if (lower.includes('2-month') || lower.includes('associate') || lower.includes('intermediate')) {
    return 2;
  }
  return 1;
}

// Check for emails or phone numbers
function containsContactDetails(text: string): boolean {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10,14}\b|(?:\+234|0)[789][01]\d{8}/;
  return emailPattern.test(text) || phonePattern.test(text);
}

export default function StartupSprintReviewDesk() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SprintSubmission[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [activeInterns, setActiveInterns] = useState<PlacementOption[]>([]);
  const [selectedIntern, setSelectedIntern] = useState<PlacementOption | null>(null);

  // Sprint Runway Navigation
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [allDbMilestones, setAllDbMilestones] = useState<SprintSubmission[]>([]);

  // Deliverable Evaluation Modal
  const [selectedSubmission, setSelectedSubmission] = useState<SprintSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit Sprint Task Modal
  const [editingMilestone, setEditingMilestone] = useState<{
    id?: string;
    month_number: number;
    week_number: number;
    title: string;
    description: string;
  } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Rate Apprentice Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedApprenticeToReview, setSelectedApprenticeToReview] = useState<PlacementOption | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    const uid = authData.user.id;
    setCurrentUserId(uid);

    // 1. Fetch placements belonging to this startup
    const { data: placementsData } = await supabase
      .from('placements')
      .select('id, role_title, pre_agreed_stipend, intern_tier, intern_id, status')
      .eq('startup_id', uid);

    if (!placementsData || placementsData.length === 0) {
      setSubmissions([]);
      setAttendanceLogs([]);
      setActiveInterns([]);
      setLoading(false);
      return;
    }

    const placementIds = placementsData.map((p) => p.id);
    const internIds = Array.from(new Set(placementsData.map((p) => p.intern_id)));

    // 2. Fetch profiles for apprentice names
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', internIds);

    const nameMap: Record<string, string> = {};
    profilesData?.forEach((prof) => {
      nameMap[prof.id] = `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Apprentice Intern';
    });

    const activeList: PlacementOption[] = placementsData.map((p) => ({
      placement_id: p.id,
      intern_id: p.intern_id,
      intern_name: nameMap[p.intern_id] || 'Apprentice Intern',
      role_title: p.role_title,
      intern_tier: p.intern_tier || 'Associate (Intermediate: 2-month trial)',
      pre_agreed_stipend: Number(p.pre_agreed_stipend || 0),
    }));
    setActiveInterns(activeList);

    if (!selectedIntern && activeList.length > 0) {
      setSelectedIntern(activeList[0]);
    }

    // 3. Fetch Sprint Milestones
    const { data: milestonesData } = await supabase
      .from('sprint_milestones')
      .select('*')
      .in('placement_id', placementIds)
      .order('created_at', { ascending: false });

    if (milestonesData) {
      const enriched: SprintSubmission[] = milestonesData.map((m: any) => {
        const placement = placementsData.find((p) => p.id === m.placement_id);
        return {
          ...m,
          month_number: m.month_number || 1,
          placements: placement,
          intern_name: nameMap[m.intern_id] || 'Apprentice Intern',
        };
      });
      setSubmissions(enriched);
      setAllDbMilestones(enriched);
    }

    // 4. Fetch Verified Attendance Logs
    const { data: attendanceData } = await supabase
      .from('attendance_logs')
      .select('*')
      .in('placement_id', placementIds)
      .order('created_at', { ascending: false });

    if (attendanceData) {
      setAttendanceLogs(
        attendanceData.map((att: any) => {
          const placement = placementsData.find((p) => p.id === att.placement_id);
          const inDate = new Date(att.check_in);
          const outDate = att.check_out ? new Date(att.check_out) : null;
          return {
            id: att.id,
            placement_id: att.placement_id,
            intern_name: nameMap[att.intern_id] || 'Apprentice Intern',
            role_title: placement?.role_title || 'Apprentice Role',
            date: inDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            checkIn: inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: outDate ? outDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Session',
            duration: att.duration_text || 'Active',
            notes: att.notes || 'Executed scheduled sprint deliverables.',
          };
        })
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewAction = async (submissionId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setProcessingId(submissionId);

    const { error } = await supabase
      .from('sprint_milestones')
      .update({
        status: newStatus,
        supervisor_feedback: feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    setProcessingId(null);

    if (error) {
      alert(`Review submission failed: ${error.message}`);
      return;
    }

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: newStatus, supervisor_feedback: feedback }
          : s
      )
    );

    setAllDbMilestones((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? { ...s, status: newStatus, supervisor_feedback: feedback }
          : s
      )
    );

    setSelectedSubmission(null);
    setFeedback('');
  };

  const handleSaveSprintTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (!editingMilestone || !selectedIntern) return;

    // Prohibit phone numbers or email addresses
    if (containsContactDetails(editTitle) || containsContactDetails(editDescription)) {
      setContactError(
        'Prohibited content detected: Phone numbers and email addresses are not permitted in task instructions. Please communicate via the platform Sprint Room.'
      );
      return;
    }

    setSavingEdit(true);

    if (editingMilestone.id) {
      const { error } = await supabase
        .from('sprint_milestones')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim(),
        })
        .eq('id', editingMilestone.id);

      if (error) {
        alert(`Failed to update sprint task: ${error.message}`);
        setSavingEdit(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('sprint_milestones')
        .insert({
          placement_id: selectedIntern.placement_id,
          intern_id: selectedIntern.intern_id,
          month_number: editingMilestone.month_number,
          week_number: editingMilestone.week_number,
          title: editTitle.trim(),
          description: editDescription.trim(),
          status: 'PENDING',
        })
        .select()
        .single();

      if (error) {
        alert(`Failed to create sprint task: ${error.message}`);
        setSavingEdit(false);
        return;
      }

      setAllDbMilestones((prev) => [...prev, data]);
    }

    setSavingEdit(false);
    setEditingMilestone(null);
    loadData();
  };

  const handleSubmitApprenticeReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApprenticeToReview) return;
    setSubmittingReview(true);

    const { error } = await supabase.from('platform_reviews').insert({
      placement_id: selectedApprenticeToReview.placement_id,
      reviewer_id: currentUserId,
      recipient_id: selectedApprenticeToReview.intern_id,
      reviewer_role: 'startup',
      target_type: 'INTERN',
      rating,
      title: reviewTitle,
      comment: reviewComment,
    });

    setSubmittingReview(false);

    if (error) {
      alert(`Failed to record review: ${error.message}`);
      return;
    }

    setReviewSuccess(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSuccess(false);
      setSelectedApprenticeToReview(null);
      setReviewTitle('');
      setReviewComment('');
      setRating(5);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          Querying Active Sprint Artifacts & Attendance Feed...
        </span>
      </div>
    );
  }

  const pastReviews = submissions.filter((s) => s.status !== 'SUBMITTED' && s.status !== 'PENDING');
  const totalMonths = selectedIntern ? getTotalMonths(selectedIntern.intern_tier) : 2;

  // Generate 4 weekly sprint cards for the selected month and candidate
  const currentMonthMilestones = [1, 2, 3, 4].map((wk) => {
    const match = allDbMilestones.find(
      (m) =>
        m.placement_id === selectedIntern?.placement_id &&
        m.month_number === selectedMonth &&
        m.week_number === wk
    );

    if (match) return match;

    return {
      month_number: selectedMonth,
      week_number: wk,
      title: `Month 0${selectedMonth} • Sprint 0${wk}: Deliverable Milestone`,
      description: `Deliverable goals and technical requirements for Week ${wk} of Month ${selectedMonth}.`,
      status: 'PENDING' as const,
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans p-2 sm:p-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-[#512d7c]" />
            <h1 className="text-xl font-black text-slate-900">Sprint Review Desk</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect live apprentice deliverables, review punch card attendance logs, and assign weekly sprint requirements.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeInterns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedApprenticeToReview(selectedIntern || activeInterns[0]);
                setShowReviewModal(true);
              }}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Rate Apprentice</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Desk</span>
          </button>
        </div>
      </div>

      {/* Verified Apprentice Attendance Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#512d7c]" />
              <span>Verified Apprentice Attendance Feed</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Live timestamps and commit notes logged directly from candidates' punch cards.
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold bg-purple-50 text-[#512d7c] px-2.5 py-1 rounded-full border border-purple-200">
            {attendanceLogs.length} Total Logs
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          {attendanceLogs.length === 0 ? (
            <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              No apprentice attendance sessions recorded yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {attendanceLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <strong className="text-slate-900">{log.intern_name}</strong>
                      <span className="text-slate-400 text-[11px]">({log.role_title})</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="text-slate-500">{log.date}</span>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {log.duration} ({log.checkIn} – {log.checkOut})
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                    "{log.notes}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Sprint Runway Workspace & Curriculum Editor */}
      {selectedIntern ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 pt-4 border-t-2 border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <FolderGit2 className="w-5 h-5 text-[#512d7c]" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Sprint Workspace: {selectedIntern.intern_name}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Proof-of-Value Runway: <span className="font-bold text-slate-700">{selectedIntern.intern_tier}</span> • Escrow Stipend: <span className="font-bold text-emerald-700">₦{selectedIntern.pre_agreed_stipend.toLocaleString()} / month</span>
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Candidate:</span>
              <select
                value={selectedIntern.placement_id}
                onChange={(e) => {
                  const match = activeInterns.find((i) => i.placement_id === e.target.value);
                  if (match) setSelectedIntern(match);
                }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
              >
                {activeInterns.map((intern) => (
                  <option key={intern.placement_id} value={intern.placement_id}>
                    {intern.intern_name} ({intern.role_title})
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Active Runway
              </span>
            </div>
          </div>

          {/* Multi-Month Tab Strip for Supervisor */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-slate-400 block">
              Incubation Runway Progression ({totalMonths}-Month Proof of Value) — Supervisor Curriculum Control
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: totalMonths }, (_, i) => i + 1).map((month) => {
                const isSelected = selectedMonth === month;
                const monthMilestones = allDbMilestones.filter(
                  (m) => m.placement_id === selectedIntern.placement_id && m.month_number === month
                );
                const completedCount = monthMilestones.filter((m) => m.status === 'APPROVED').length;
                const isCompleted = completedCount === 4;

                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMonth(month)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-50/70 border-[#512d7c] ring-2 ring-[#512d7c]/30 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900">Month 0{month} Runway</span>
                        {isCompleted && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Cleared
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {completedCount} of 4 Sprints Approved
                      </span>
                    </div>

                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Calendar className={`w-4 h-4 ${isSelected ? 'text-[#512d7c]' : 'text-slate-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Weekly Sprints */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {currentMonthMilestones.map((m) => {
              const isApproved = m.status === 'APPROVED';
              const isSubmitted = m.status === 'SUBMITTED';
              const isRejected = m.status === 'REJECTED';

              return (
                <div
                  key={m.week_number}
                  className={`rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                    isApproved
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : isSubmitted
                      ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-200'
                      : isRejected
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                        M{selectedMonth} • Week 0{m.week_number}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSubmitted
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{m.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{m.description}</p>

                    {m.deliverable_url && (
                      <a
                        href={m.deliverable_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-600 hover:underline pt-1"
                      >
                        <span>View Submitted PR</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {m.supervisor_feedback && (
                      <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-[10px] text-[#512d7c] italic">
                        <strong>Feedback:</strong> "{m.supervisor_feedback}"
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* Evaluate Button if Intern Submitted */}
                    {isSubmitted && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubmission(m as any);
                          setFeedback('');
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Evaluate Deliverable</span>
                      </button>
                    )}

                    {/* Supervisor Task Assignment Editor */}
                    <button
                      type="button"
                      onClick={() => {
                        setContactError(null);
                        setEditingMilestone({
                          id: (m as any).id,
                          month_number: selectedMonth,
                          week_number: m.week_number,
                          title: m.title,
                          description: m.description,
                        });
                        setEditTitle(m.title);
                        setEditDescription(m.description);
                      }}
                      className="w-full py-2 bg-slate-100 hover:bg-[#512d7c] hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Task / Assign Scope</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Edit Sprint Task Modal with Anti-Contact Filter */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Supervisor Task Assignment Desk
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Month 0{editingMilestone.month_number} • Week 0{editingMilestone.week_number} Scope
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {contactError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{contactError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSprintTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sprint Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 02: API Integration & Database Migrations"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Scope of Deliverables & Requirements (Shown to Candidate)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe technical goals, repository links, PR requirements, or tasks to complete..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  * Note: Sharing personal phone numbers, WhatsApp, or direct emails is restricted.
                </span>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingEdit ? 'Saving Task...' : 'Save & Publish to Candidate Runway ➔'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deliverable Evaluation Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Supervisor Evaluation Desk
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedSubmission.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <div>Candidate: <strong className="text-slate-900">{selectedSubmission.intern_name}</strong></div>
                <div>Role: <strong className="text-slate-900">{selectedSubmission.placements?.role_title}</strong></div>
                {selectedSubmission.deliverable_url && (
                  <a
                    href={selectedSubmission.deliverable_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-bold hover:underline flex items-center space-x-1 pt-1"
                  >
                    <span>Open Deliverable Link: {selectedSubmission.deliverable_url}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Supervisor Code Review & Sprint Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comments, feedback, or required revisions..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  disabled={processingId === selectedSubmission.id}
                  onClick={() => handleReviewAction(selectedSubmission.id, 'REJECTED')}
                  className="py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Request Changes</span>
                </button>

                <button
                  type="button"
                  disabled={processingId === selectedSubmission.id}
                  onClick={() => handleReviewAction(selectedSubmission.id, 'APPROVED')}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processingId ? 'Processing...' : 'Approve Milestone ➔'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Apprentice Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-amber-600">
                  Verified Apprentice Endorsement
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Rate & Endorse Apprentice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {reviewSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Apprentice Endorsement Sealed!</h4>
                <p className="text-xs text-slate-500">
                  This evaluation has been posted to the candidate's verified profile and portfolio.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitApprenticeReview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Candidate</label>
                  <select
                    value={selectedApprenticeToReview?.placement_id || ''}
                    onChange={(e) => {
                      const match = activeInterns.find((i) => i.placement_id === e.target.value);
                      setSelectedApprenticeToReview(match || null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  >
                    {activeInterns.map((intern) => (
                      <option key={intern.placement_id} value={intern.placement_id}>
                        {intern.intern_name} — {intern.role_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Performance Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Review Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Exceptional problem-solving skills and prompt delivery"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Detailed Endorsement & Feedback</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe their technical velocity, communication, and overall sprint performance..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Verified Endorsement ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Evaluation History */}
      {pastReviews.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Evaluation History</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastReviews.map((item) => {
              const isApproved = item.status === 'APPROVED';
              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl p-4 space-y-2 text-xs ${
                    isApproved ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400">
                      M0{item.month_number} • W0{item.week_number}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-slate-500 text-[11px]">{item.intern_name}</p>
                  {item.supervisor_feedback && (
                    <p className="text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-lg border border-slate-100">
                      Feedback: {item.supervisor_feedback}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}