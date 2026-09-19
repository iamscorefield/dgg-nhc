export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'startup' | 'intern' | 'admin' | 'guest';

export type PipelineStage = 
  | 'BOOKMARKED' 
  | 'INVITED' 
  | 'TRIAL_ACTIVE' 
  | 'COMPLETED_TRIAL' 
  | 'HIRED_CONTRACTED' 
  | 'DECLINED';

export type MilestoneReviewStatus = 
  | 'PENDING_REVIEW' 
  | 'APPROVED' 
  | 'REVISION_REQUESTED';

export type DisputeCategory = 
  | 'MILESTONE_DISPUTE' 
  | 'PAYROLL_ESCROW' 
  | 'COMMUNICATION' 
  | 'GENERAL';

export type DisputeStatus = 
  | 'OPEN' 
  | 'IN_REVIEW' 
  | 'RESOLVED' 
  | 'ESCALATED';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Placement {
  id: string;
  startup_id: string;
  intern_id: string;
  role_title: string;
  intern_tier: string;
  trial_duration_months: number;
  contract_term: string;
  pre_agreed_stipend: number;
  terms_agreed_by_startup: boolean;
  terms_agreed_by_intern: boolean;
  status: string;
  pipeline_stage?: PipelineStage;
  pipeline_order?: number;
  created_at: string;
}

export interface CandidateBookmark {
  id: string;
  startup_id: string;
  intern_id: string;
  created_at: string;
}

export interface SprintMilestone {
  id: string;
  placement_id: string;
  intern_id: string;
  week_number: number;
  title: string;
  deliverable_url: string;
  intern_notes?: string;
  review_status: MilestoneReviewStatus;
  supervisor_feedback?: string;
  approved_at?: string;
  created_at: string;
}

export interface StartupPayrollEscrow {
  id: string;
  startup_id: string;
  placement_id: string;
  amount: number;
  surcharge_fee: number;
  status: 'PENDING' | 'HELD_IN_ESCROW' | 'DISBURSED' | 'REFUNDED';
  invoice_reference?: string;
  disbursement_due_date?: string;
  created_at: string;
}

export interface InternPerformanceEvaluation {
  id: string;
  placement_id: string;
  startup_id: string;
  intern_id: string;
  punctuality_score: number;
  technical_score: number;
  communication_score: number;
  autonomy_score: number;
  written_endorsement: string;
  is_public_on_dossier: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  placement_id?: string;
  creator_id: string;
  creator_role: 'startup' | 'intern';
  target_user_id?: string;
  subject: string;
  category: DisputeCategory;
  status: DisputeStatus;
  priority: DisputePriority;
  admin_tagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'startup' | 'intern' | 'admin';
  message_body: string;
  attachment_url?: string;
  created_at: string;
}