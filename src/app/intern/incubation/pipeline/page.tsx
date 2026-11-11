'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Bookmark,
  Send,
  PlayCircle,
  Award,
  RefreshCw,
  FolderGit2,
  CheckCircle2,
  Clock,
  UploadCloud,
  ChevronRight,
  Building,
  Lock,
  ArrowLeft,
  Check,
  Calendar,
  Play,
  Square,
  Star,
  MessageSquare,
  X,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

interface PlacementRecord {
  id: string;
  startup_id: string;
  role_title: string;
  intern_tier: string;
  contract_term: string;
  pre_agreed_stipend: number;
  status: string;
  pipeline_stage: string;
  terms_agreed_by_intern?: boolean;
  created_at: string;
  startup_profiles?: {
    company_name: string;
    rc_number: string;
    business_category: string;
  };
}

interface MilestoneRecord {
  id?: string;
  month_number: number;
  week_number: number;
  title: string;
  description: string;
  deliverable_url?: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  supervisor_feedback?: string;
}

interface AttendanceLog {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string;
  notes: string;
}

interface ChatMessage {
  id: string;
  sender_role: 'intern' | 'startup' | 'admin' | 'system';
  sender_name: string;
  message_text: string;
  created_at: string;
}

const COLUMNS = [
  { key: 'SHORTLISTED', title: 'Shortlisted Talent', badgeColor: 'bg-blue-100 text-blue-800', icon: Bookmark },
  { key: 'OFFER_EXTENDED', title: 'Offers Extended', badgeColor: 'bg-amber-100 text-amber-800', icon: Send },
  { key: 'IN_TRIAL', title: 'Active Sprint Trial', badgeColor: 'bg-purple-100 text-purple-800', icon: PlayCircle },
  { key: 'RETAINED', title: 'Retained & Contracted', badgeColor: 'bg-emerald-100 text-emerald-800', icon: Award },
];

// Helper: 3-Tier Sprint Runway Resolution
function getTrialSprintWeeks(tierString: string = ''): number {
  const lower = tierString.toLowerCase();
  if (lower.includes('tier 3') || lower.includes('pro') || lower.includes('instant') || lower.includes('retained')) {
    return 4; // Full monthly retainer sprint cycle
  }
  if (lower.includes('tier 2') || lower.includes('acceleration') || lower.includes('1-week') || lower.includes('1 week')) {
    return 1; // 1-Week Fast-Track Trial
  }
  return 2; // Tier 1: 2-Week Foundation Trial (Default)
}

function getTierDisplayBadge(tierString: string = '') {
  const lower = tierString.toLowerCase();
  if (lower.includes('tier 3') || lower.includes('pro')) {
    return {
      title: 'Tier 3: Nexus Pro',
      subtitle: 'Zero Trial • Instant Retainer Placement',
      color: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }
  if (lower.includes('tier 2') || lower.includes('acceleration') || lower.includes('1-week')) {
    return {
      title: 'Tier 2: Acceleration Track',
      subtitle: '1-Week Fast-Track Trial Sprint',
      color: 'bg-purple-100 text-purple-900 border-purple-300',
    };
  }
  return {
    title: 'Tier 1: Foundation Track',
    subtitle: '2-Week Evaluation Trial Sprint',
    color: 'bg-blue-100 text-blue-900 border-blue-300',
  };
}

export default function InternPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('Apprentice Intern');
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [activePlacement, setActivePlacement] = useState<PlacementRecord | null>(null);

  // Runway state
  const [allDbMilestones, setAllDbMilestones] = useState<MilestoneRecord[]>([]);

  // Contract Acceptance
  const [selectedOfferToAccept, setSelectedOfferToAccept] = useState<PlacementRecord | null>(null);
  const [acceptingOffer, setAcceptingOffer] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  // Deliverable Submission
  const [activeMilestoneModal, setActiveMilestoneModal] = useState<MilestoneRecord | null>(null);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Punch Clock & Attendance
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [clockInDate, setClockInDate] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dailyNotes, setDailyNotes] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceLog[]>([]);

  // Rate & Review Supervisor Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [supervisorRating, setSupervisorRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Floating Chat Drawer
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Punch Timer Interval
  useEffect(() => {
    let timer: any = null;
    if (isClockedIn) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isClockedIn]);

  // Scroll chat
  useEffect(() => {
    if (isChatOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const loadPipeline = async () => {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setLoading(false);
      return;
    }
    const uid = authData.user.id;
    setCurrentUserId(uid);

    // Profile name
    const { data: prof } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', uid)
      .maybeSingle();
    if (prof) {
      setCurrentUserName(`${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Apprentice Intern');
    }

    const { data: placementData, error } = await supabase
      .from('placements')
      .select(`
        id,
        startup_id,
        role_title,
        intern_tier,
        contract_term,
        pre_agreed_stipend,
        status,
        pipeline_stage,
        terms_agreed_by_intern,
        created_at,
        startup_profiles:startup_id (
          company_name,
          rc_number,
          business_category
        )
      `)
      .eq('intern_id', uid)
      .order('created_at', { ascending: false });

    if (!error && placementData) {
      const normalized: PlacementRecord[] = placementData.map((pl: any) => {
        let stage = pl.pipeline_stage;
        const isTierPro = (pl.intern_tier || '').toLowerCase().includes('tier 3') || (pl.intern_tier || '').toLowerCase().includes('pro');

        if (pl.terms_agreed_by_intern === true || pl.status === 'ACTIVE') {
          stage = isTierPro ? 'RETAINED' : 'IN_TRIAL';
        } else if (stage === 'INVITED' || stage === 'OFFER_EXTENDED') {
          stage = 'OFFER_EXTENDED';
        } else if (stage === 'HIRED_CONTRACTED' || pl.status === 'COMPLETED' || stage === 'RETAINED') {
          stage = 'RETAINED';
        } else {
          stage = 'SHORTLISTED';
        }
        return { ...pl, pipeline_stage: stage };
      });

      setPlacements(normalized);

      const currentActive = normalized.find(
        (p) => p.pipeline_stage === 'IN_TRIAL' || p.pipeline_stage === 'RETAINED'
      );

      if (currentActive) {
        setActivePlacement(currentActive);
        await Promise.all([
          loadMilestones(currentActive.id),
          loadAttendanceLogs(currentActive.id, uid),
          loadChatMessages(currentActive.id),
        ]);
      } else {
        setActivePlacement(null);
      }
    }
    setLoading(false);
  };

  const loadMilestones = async (placementId: string) => {
    const { data: milestoneData } = await supabase
      .from('sprint_milestones')
      .select('*')
      .eq('placement_id', placementId)
      .order('week_number', { ascending: true });

    if (milestoneData) {
      setAllDbMilestones(
        milestoneData.map((m: any) => ({
          id: m.id,
          month_number: m.month_number || 1,
          week_number: m.week_number,
          title: m.title,
          description: m.description,
          deliverable_url: m.deliverable_url,
          status: m.status,
          supervisor_feedback: m.supervisor_feedback,
        }))
      );
    }
  };

  const loadAttendanceLogs = async (placementId: string, internId: string) => {
    const { data } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('placement_id', placementId)
      .eq('intern_id', internId)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const openSession = data.find((log: any) => !log.check_out);
      if (openSession) {
        setIsClockedIn(true);
        setActiveLogId(openSession.id);
        const started = new Date(openSession.check_in);
        setClockInDate(started);
        const diffSecs = Math.max(0, Math.floor((new Date().getTime() - started.getTime()) / 1000));
        setElapsedSeconds(diffSecs);
      }

      setAttendanceHistory(
        data.map((d: any) => {
          const inDate = new Date(d.check_in);
          const outDate = d.check_out ? new Date(d.check_out) : null;
          return {
            id: d.id,
            date: inDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            checkIn: inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOut: outDate ? outDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress',
            duration: d.duration_text || 'Active',
            notes: d.notes || 'Sprint standup delivery.',
          };
        })
      );
    }
  };

  const loadChatMessages = async (placementId: string) => {
    const { data } = await supabase
      .from('sprint_room_messages')
      .select('*')
      .eq('placement_id', placementId)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setChatMessages(data);
    } else {
      setChatMessages([
        {
          id: 'welcome-daemon',
          sender_role: 'system',
          sender_name: 'NexusHub Operations Daemon',
          message_text: 'Contract handshake active. Escrow stipend locked with performance tier parameters.',
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const totalSprintWeeks = getTrialSprintWeeks(activePlacement?.intern_tier);
  const tierBadge = getTierDisplayBadge(activePlacement?.intern_tier);

  const runwayMilestones: MilestoneRecord[] = Array.from({ length: totalSprintWeeks }, (_, i) => i + 1).map((wk) => {
    const match = allDbMilestones.find((m) => m.week_number === wk);
    if (match) return match;
    return {
      month_number: 1,
      week_number: wk,
      title: `Sprint 0${wk}: Agile Deliverable Milestone`,
      description: `Specific output requirements and verification tickets for Sprint Week 0${wk}.`,
      status: 'PENDING',
    };
  });

  const formatTimer = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Clock In Action
  const handleClockIn = async () => {
    if (!activePlacement) return;
    const now = new Date();
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        placement_id: activePlacement.id,
        intern_id: currentUserId,
        check_in: now.toISOString(),
        notes: dailyNotes || 'Active sprint progress.',
      })
      .select()
      .single();

    if (!error && data) {
      setIsClockedIn(true);
      setActiveLogId(data.id);
      setClockInDate(now);
      setElapsedSeconds(0);
    }
  };

  // Clock Out Action
  const handleClockOut = async () => {
    if (!activeLogId || !clockInDate) return;
    const now = new Date();
    const durationMins = Math.floor(elapsedSeconds / 60);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const durationStr = `${hours}h ${mins}m`;

    const { error } = await supabase
      .from('attendance_logs')
      .update({
        check_out: now.toISOString(),
        duration_text: durationStr,
        notes: dailyNotes || 'Executed scheduled sprint deliverables.',
      })
      .eq('id', activeLogId);

    if (!error && activePlacement) {
      await loadAttendanceLogs(activePlacement.id, currentUserId);
      setIsClockedIn(false);
      setActiveLogId(null);
      setClockInDate(null);
      setElapsedSeconds(0);
      setDailyNotes('');
    }
  };

  // Send Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim() || !activePlacement) return;

    const payload = {
      placement_id: activePlacement.id,
      sender_id: currentUserId,
      sender_role: 'intern',
      sender_name: `${currentUserName} (You)`,
      message_text: newChatText.trim(),
    };

    const { data, error } = await supabase
      .from('sprint_room_messages')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      setChatMessages((prev) => [...prev, data]);
      setNewChatText('');
    }
  };

  // Submit Supervisor Rating & Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlacement) return;
    setSubmittingReview(true);

    const { error } = await supabase.from('supervisor_reviews').insert({
      placement_id: activePlacement.id,
      intern_id: currentUserId,
      rating: supervisorRating,
      title: reviewTitle,
      comment: reviewComment,
    });

    setSubmittingReview(false);

    if (!error) {
      setReviewSubmitted(true);
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSubmitted(false);
        setReviewTitle('');
        setReviewComment('');
      }, 1800);
    }
  };

  // Accept Contract
  const handleSignContractDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferToAccept) return;
    setAcceptingOffer(true);

    const placementId = selectedOfferToAccept.id;
    const isPro = (selectedOfferToAccept.intern_tier || '').toLowerCase().includes('tier 3') || (selectedOfferToAccept.intern_tier || '').toLowerCase().includes('pro');
    const targetStage = isPro ? 'RETAINED' : 'IN_TRIAL';

    const { error } = await supabase
      .from('placements')
      .update({
        status: 'ACTIVE',
        pipeline_stage: targetStage,
        terms_agreed_by_intern: true,
      })
      .eq('id', placementId);

    setAcceptingOffer(false);

    if (error) {
      alert(`Contract Authorization Failed: ${error.message}`);
      return;
    }

    const updatedOffer: PlacementRecord = {
      ...selectedOfferToAccept,
      status: 'ACTIVE',
      pipeline_stage: targetStage,
      terms_agreed_by_intern: true,
    };

    setPlacements((prev) => prev.map((p) => (p.id === placementId ? updatedOffer : p)));
    setActivePlacement(updatedOffer);
    await Promise.all([loadMilestones(placementId), loadAttendanceLogs(placementId, currentUserId)]);

    setAcceptedSuccess(true);
    setTimeout(() => {
      setAcceptedSuccess(false);
      setSelectedOfferToAccept(null);
    }, 1200);
  };

  // Submit Sprint Deliverable
  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlacement || !activeMilestoneModal) return;
    setSubmittingDeliverable(true);

    const targetWeekNumber = Number(activeMilestoneModal.week_number);

    const payload = {
      placement_id: activePlacement.id,
      intern_id: currentUserId,
      month_number: 1,
      week_number: targetWeekNumber,
      title: deliverableTitle,
      description: deliverableNotes,
      deliverable_url: deliverableUrl,
      status: 'SUBMITTED',
    };

    const { data, error } = await supabase
      .from('sprint_milestones')
      .insert(payload)
      .select()
      .single();

    setSubmittingDeliverable(false);

    if (error) {
      alert(`Milestone Submission Failed: ${error.message}`);
      return;
    }

    setSubmissionSuccess(true);
    const newRecord: MilestoneRecord = {
      id: data.id,
      month_number: 1,
      week_number: targetWeekNumber,
      title: deliverableTitle,
      description: deliverableNotes,
      deliverable_url: deliverableUrl,
      status: 'SUBMITTED',
    };

    setAllDbMilestones((prev) => [
      ...prev.filter((m) => m.week_number !== targetWeekNumber),
      newRecord,
    ]);

    setTimeout(() => {
      setSubmissionSuccess(false);
      setActiveMilestoneModal(null);
      setDeliverableTitle('');
      setDeliverableUrl('');
      setDeliverableNotes('');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center font-mono text-xs text-[#512d7c]">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span className="font-bold tracking-widest uppercase">
          SYNCHRONIZING APPRENTICESHIP PIPELINE & WORKSPACE...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/intern/incubation/startup" className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-black text-slate-900">Agile Sprint Runway Pipeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor sprint delivery milestones, daily attendance timekeeping, and client verification reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPipeline}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Pipeline</span>
        </button>
      </div>

      {/* 4-Stage Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const colPlacements = placements.filter((p) => p.pipeline_stage === col.key);

          return (
            <div
              key={col.key}
              className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4 min-h-[240px] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ColIcon className="w-4 h-4 text-slate-600" />
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                </div>
                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colPlacements.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colPlacements.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                    No records
                  </div>
                ) : (
                  colPlacements.map((p) => {
                    const company = p.startup_profiles?.company_name || 'Enterprise Partner';
                    const isSelected = activePlacement?.id === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (p.pipeline_stage === 'IN_TRIAL' || p.pipeline_stage === 'RETAINED') {
                            setActivePlacement(p);
                            loadMilestones(p.id);
                            loadAttendanceLogs(p.id, currentUserId);
                            loadChatMessages(p.id);
                          }
                        }}
                        className={`bg-white border rounded-2xl p-4 space-y-2 transition-all cursor-pointer ${
                          isSelected && (p.pipeline_stage === 'IN_TRIAL' || p.pipeline_stage === 'RETAINED')
                            ? 'border-purple-600 shadow-md ring-1 ring-purple-600'
                            : 'border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                            {p.startup_profiles?.rc_number || 'RC-VERIFIED'}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            ₦{Number(p.pre_agreed_stipend).toLocaleString()}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{company}</h4>
                        <p className="text-[11px] font-bold text-[#512d7c] truncate">{p.role_title}</p>

                        {(p.pipeline_stage === 'IN_TRIAL' || p.pipeline_stage === 'RETAINED') && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-purple-700 font-bold">
                            <span>Open Sprint Runway</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {p.pipeline_stage === 'OFFER_EXTENDED' && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOfferToAccept(p);
                              }}
                              className="w-full text-[10px] text-purple-700 hover:text-purple-900 font-bold flex items-center justify-between cursor-pointer"
                            >
                              <span>Review & Accept Contract</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Trial Sprint Workspace */}
      {activePlacement ? (
        <div className="space-y-8">
          {/* Section 1: Tier Sprint Runway Board */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <FolderGit2 className="w-5 h-5 text-[#512d7c]" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    Sprint Workspace: {activePlacement.startup_profiles?.company_name}
                  </h2>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${tierBadge.color}`}>
                    {tierBadge.title} ({totalSprintWeeks} Sprint {totalSprintWeeks === 1 ? 'Week' : 'Weeks'})
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Escrow Stipend: <strong className="text-emerald-700">₦{Number(activePlacement.pre_agreed_stipend).toLocaleString()} / month</strong>
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full self-start sm:self-auto">
                {activePlacement.pipeline_stage === 'RETAINED' ? 'RETAINER CONTRACT' : 'ACTIVE TRIAL RUNWAY'}
              </span>
            </div>

            {/* Performance Tier Progression Banner */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#512d7c] text-white flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#f2b42c]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{tierBadge.subtitle}</h4>
                  <p className="text-[11px] text-slate-600">
                    Tier 1 (2-Week) ➔ Complete 2 projects with verified ratings ➔ Unlock Tier 2 (1-Week Fast-Track) ➔ 4+ projects unlocks Nexus Pro (Zero Trial).
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#512d7c] bg-white px-2.5 py-1 rounded-xl border border-purple-200 shrink-0">
                {totalSprintWeeks} Weekly Sprints In Runway
              </span>
            </div>

            {/* Sprint Deliverables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {runwayMilestones.map((m, idx) => {
                const isApproved = m.status === 'APPROVED';
                const isSubmitted = m.status === 'SUBMITTED';
                const isRejected = m.status === 'REJECTED';
                const isUnlocked = idx === 0 || runwayMilestones[idx - 1].status === 'APPROVED';

                return (
                  <div
                    key={m.week_number}
                    className={`rounded-3xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                      !isUnlocked
                        ? 'bg-slate-100/60 border-slate-200 opacity-60'
                        : isApproved
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : isSubmitted
                        ? 'bg-blue-50/40 border-blue-300'
                        : isRejected
                        ? 'bg-rose-50/40 border-rose-300'
                        : 'bg-white border-slate-200 hover:border-purple-300 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                          Sprint Week 0{m.week_number}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            !isUnlocked
                              ? 'bg-slate-200 text-slate-600'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isSubmitted
                              ? 'bg-blue-100 text-blue-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {!isUnlocked ? 'LOCKED' : m.status}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug">{m.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{m.description}</p>

                      {m.supervisor_feedback && (
                        <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-[10px] text-[#512d7c] italic">
                          <strong>Supervisor:</strong> "{m.supervisor_feedback}"
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      {!isUnlocked ? (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold py-2 justify-center">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlocks After Sprint 0{m.week_number - 1}</span>
                        </div>
                      ) : isApproved ? (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold py-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sprint Cleared</span>
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-bold py-2">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Supervisor Reviewing</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMilestoneModal(m);
                            setDeliverableTitle(`Sprint Week 0${m.week_number}: Deliverable`);
                            setDeliverableUrl(m.deliverable_url || '');
                            setDeliverableNotes(m.description || '');
                          }}
                          className="w-full py-2.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Resubmit Deliverable' : 'Submit Sprint PR'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Daily Punch Card & Verified Attendance Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Daily Punch Card (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-[#512d7c]" />
                    <span>Daily Punch Card</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Record trial hours to prove active participation.</p>
                </div>

                <span
                  className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isClockedIn
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isClockedIn ? '● IN SESSION' : 'OFFLINE'}
                </span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                  Current Session Timer
                </span>
                <div className="text-3xl font-black font-mono text-[#512d7c]">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>

              {isClockedIn && (
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-xs">
                    Today's Sprint Notes / Tickets Completed
                  </label>
                  <textarea
                    rows={2}
                    value={dailyNotes}
                    onChange={(e) => setDailyNotes(e.target.value)}
                    placeholder="Document PR commits, tickets resolved, or unit tests executed today..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>
              )}

              <div>
                {!isClockedIn ? (
                  <button
                    type="button"
                    onClick={handleClockIn}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Work / Clock In</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Clock Out & Log Attendance</span>
                  </button>
                )}
              </div>
            </div>

            {/* Verified Attendance Logs & Rating (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Verified Attendance Logs</h3>
                  <p className="text-[11px] text-slate-500">Immutable trial participation records.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="text-xs font-bold text-[#512d7c] hover:text-[#3e215f] flex items-center space-x-1 cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-all"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Rate & Review Supervisor</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {attendanceHistory.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    No attendance records logged yet. Clock in to record your first sprint hours.
                  </div>
                ) : (
                  attendanceHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{item.date}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {item.duration} ({item.checkIn} – {item.checkOut})
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5 italic">
                        "{item.notes}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <Building className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-sm text-slate-900">No Active Placement Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once an enterprise offer is accepted, your sprint runway, punch clock, and attendance logs will load here.
          </p>
        </div>
      )}

      {/* Floating Sprint Room Chat */}
      {activePlacement && (
        <div className="fixed bottom-6 right-6 z-40">
          {!isChatOpen ? (
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="p-4 bg-[#512d7c] hover:bg-[#3e215f] text-white rounded-full shadow-2xl flex items-center space-x-2 transition-transform transform hover:scale-105 cursor-pointer ring-4 ring-purple-100"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-black pr-1">Sprint Chat</span>
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            </button>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-80 sm:w-96 flex flex-col h-[480px] overflow-hidden animate-in slide-in-from-bottom duration-200">
              <div className="p-3.5 bg-[#512d7c] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-amber-300" />
                  <div>
                    <h4 className="font-black text-xs leading-none">Sprint Room Chat</h4>
                    <span className="text-[9px] text-white/70 block mt-0.5">
                      {activePlacement.startup_profiles?.company_name} • Tripartite Desk
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs bg-slate-50/50">
                {chatMessages.map((msg) => {
                  if (msg.sender_role === 'system') {
                    return (
                      <div key={msg.id} className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-center space-y-0.5">
                        <span className="text-[9px] font-mono uppercase font-bold text-[#512d7c] block">
                          {msg.sender_name}
                        </span>
                        <p className="text-[10px] text-slate-700 leading-tight">{msg.message_text}</p>
                      </div>
                    );
                  }
                  const isSelf = msg.sender_role === 'intern';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] font-mono text-slate-400 px-1 mb-0.5">{msg.sender_name}</span>
                      <div
                        className={`max-w-[85%] rounded-2xl p-2.5 text-[11px] leading-relaxed shadow-xs ${
                          isSelf ? 'bg-[#512d7c] text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.message_text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendChat} className="p-2.5 bg-white border-t border-slate-100 flex items-center space-x-1.5">
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Message supervisor & admin..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                />
                <button
                  type="submit"
                  className="p-2 bg-[#512d7c] hover:bg-[#3e215f] text-white rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Contract Acceptance Modal */}
      {selectedOfferToAccept && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Tri-Party Placement Agreement
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {selectedOfferToAccept.startup_profiles?.company_name || 'Enterprise Partner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferToAccept(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {acceptedSuccess ? (
              <div className="text-center py-6 space-y-2">
                <Check className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Trial Placement Authorized!</h4>
                <p className="text-xs text-slate-500">
                  Sprint runway initialised. Redirecting...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignContractDirectly} className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Enterprise:</span>
                    <span className="font-bold text-slate-900">
                      {selectedOfferToAccept.startup_profiles?.company_name} ({selectedOfferToAccept.startup_profiles?.rc_number || 'RC-VERIFIED'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Position:</span>
                    <span className="font-bold text-[#512d7c]">{selectedOfferToAccept.role_title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Escrow Stipend:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₦{Number(selectedOfferToAccept.pre_agreed_stipend).toLocaleString()} / month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Performance Track:</span>
                    <span className="font-bold text-[#f2b42c] bg-purple-900 px-2 py-0.5 rounded">
                      {selectedOfferToAccept.intern_tier || 'Tier 1: Foundation (2-Week Trial)'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={acceptingOffer}
                  className="w-full py-3.5 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {acceptingOffer ? 'Authorizing Contract...' : 'Accept Trial Placement ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Deliverable Submission Modal */}
      {activeMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">
                  Sprint Review Submission Desk
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Sprint Week 0{activeMilestoneModal.week_number} Deliverable
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMilestoneModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submissionSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Deliverable Dispatched!</h4>
                <p className="text-xs text-slate-500">
                  Your milestone has been transmitted to your supervisor's Sprint Review Desk.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitDeliverable} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Milestone Title</label>
                  <input
                    type="text"
                    required
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Deliverable URL (GitHub PR / Staging Link)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/repo/pull/1"
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sprint Notes & Changeset</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe completed tickets, schema changes, and edge case test results..."
                    value={deliverableNotes}
                    onChange={(e) => setDeliverableNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDeliverable}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{submittingDeliverable ? 'Pushing to Supervisor...' : 'Submit to Sprint Review Desk ➔'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Rate & Review Supervisor Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#512d7c]">
                  Bilateral Enterprise Review
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Rate {activePlacement?.startup_profiles?.company_name}
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

            {reviewSubmitted ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-slate-900">Review Published!</h4>
                <p className="text-xs text-slate-500">
                  Your supervisor evaluation is logged in the DGG ecosystem ledger.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supervisor Rating</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSupervisorRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= supervisorRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
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
                    placeholder="e.g. Excellent mentorship and clear sprint guidance"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Feedback Comment</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your incubation experience, sprint structure, and communication..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#512d7c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 bg-[#512d7c] hover:bg-[#3e215f] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Verified Evaluation ➔'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}