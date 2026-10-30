export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_approval' | 'cancelled';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_approval' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  description: string;
  requires_approval: boolean;
  depends_on: string[];
}

export interface Workflow {
  id: string;
  name: string;
  goal: string;
  steps: WorkflowStep[];
  enabled: boolean;
  schedule_cron?: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  last_run_status?: RunStatus;
}

export interface StepRun {
  step_run_id: string;
  run_id: string;
  step_id: string;
  tool_name: string;
  name: string;
  status: StepStatus;
  input_summary?: string;
  output_summary?: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  error_details?: string;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  workflow_name: string;
  status: RunStatus;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  final_result?: string;
  error_summary?: string;
  steps: StepRun[];
  pending_approval_id?: string;
}

export interface TrackedCompany {
  id: string;
  name: string;
  careers_url: string;
  keywords: string[];
  locations: string[];
  experience_level?: string;
  enabled: boolean;
  last_checked_at?: string;
  jobs_count: number;
}

export interface JobPosting {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  location: string;
  employment_type?: string;
  experience_level?: string;
  source_url: string;
  description?: string;
  first_seen_at: string;
  last_seen_at: string;
  application_status: 'discovered' | 'saved' | 'applied' | 'archived';
  source_verification_status: 'verified' | 'unverified' | 'failed';
  is_new?: boolean;
}

export interface ApprovalRequest {
  id: string;
  run_id: string;
  step_id: string;
  workflow_name: string;
  action: string;
  reason: string;
  details: {
    recipient?: string;
    subject?: string;
    body_preview?: string;
    items_count?: number;
    target_service?: string;
    [key: string]: unknown;
  };
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
  rejection_reason?: string;
}

export interface AuditLog {
  id: string;
  run_id?: string;
  action: string;
  actor: string;
  timestamp: string;
  outcome: 'success' | 'failure' | 'rejected' | 'pending';
  details?: string;
}

export interface SystemStats {
  total_workflows: number;
  successful_runs: number;
  failed_runs: number;
  pending_approvals: number;
  tracked_companies: number;
  new_jobs_discovered: number;
  active_runs: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
}
