import {
  Workflow,
  WorkflowRun,
  TrackedCompany,
  JobPosting,
  ApprovalRequest,
  AuditLog,
  SystemStats,
} from '../types';

// Configurable API base URL: supports empty (same-origin proxy) or external backend URL
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

let authToken: string | null = localStorage.getItem('agentflow_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('agentflow_token', token);
  } else {
    localStorage.removeItem('agentflow_token');
  }
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchStats(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/api/stats`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load system stats: HTTP ${res.status}`);
  return res.json();
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const res = await fetch(`${API_BASE}/api/workflows`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load workflows: HTTP ${res.status}`);
  return res.json();
}

export async function planWorkflow(goal: string, preferences?: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/api/workflows/plan`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ goal, preferences }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to generate plan');
  }
  return res.json();
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/api/workflows`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to create workflow');
  }
  return res.json();
}

export async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, {
    method: 'PATCH',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to update workflow');
  }
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete workflow');
}

export async function runWorkflow(workflowId: string): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/run`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to trigger run');
  }
  return res.json();
}

export async function fetchRuns(): Promise<WorkflowRun[]> {
  const res = await fetch(`${API_BASE}/api/runs`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load runs: HTTP ${res.status}`);
  return res.json();
}

export async function fetchRun(runId: string): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/api/runs/${runId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load run details');
  return res.json();
}

export async function cancelRun(runId: string): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/api/runs/${runId}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to cancel run');
  return res.json();
}

export async function fetchApprovals(): Promise<ApprovalRequest[]> {
  const res = await fetch(`${API_BASE}/api/approvals`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch approvals');
  return res.json();
}

export async function approveRequest(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/approvals/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to approve request');
  }
}

export async function rejectRequest(id: string, reason?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/approvals/${id}/reject`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to reject request');
  }
}

export async function fetchCompanies(): Promise<TrackedCompany[]> {
  const res = await fetch(`${API_BASE}/api/companies`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch companies');
  return res.json();
}

export async function addCompany(company: Partial<TrackedCompany>): Promise<TrackedCompany> {
  const res = await fetch(`${API_BASE}/api/companies`, {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(company),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to add company');
  }
  return res.json();
}

export async function updateCompany(id: string, data: Partial<TrackedCompany>): Promise<TrackedCompany> {
  const res = await fetch(`${API_BASE}/api/companies/${id}`, {
    method: 'PATCH',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Failed to update company');
  }
  return res.json();
}

export async function deleteCompany(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/companies/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete company');
}

export async function checkCompanyNow(id: string) {
  const res = await fetch(`${API_BASE}/api/companies/${id}/check`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || 'Manual check failed');
  }
  return res.json();
}

export async function fetchJobs(params?: { search?: string; company?: string; status?: string }): Promise<JobPosting[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.company) query.set('company', params.company);
  if (params?.status) query.set('status', params.status);

  const res = await fetch(`${API_BASE}/api/jobs?${query.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function updateJobStatus(id: string, status: string): Promise<JobPosting> {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    method: 'PATCH',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ application_status: status }),
  });
  if (!res.ok) throw new Error('Failed to update job status');
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/api/audit-logs`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
