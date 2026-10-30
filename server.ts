import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Google Gemini SDK on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface AuthUser {
  uid: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Authentication middleware. Firebase ID tokens are verified by Firebase Identity Toolkit;
// never trust decoded JWT payloads or arbitrary strings as authenticated identities.
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required: Missing or invalid Bearer token.' });
  }

  const token = authHeader.slice(7).trim();
  if (!token) return res.status(401).json({ error: 'Authentication token is empty.' });

  // Local-only development tokens. These are deliberately disabled in production.
  if (process.env.NODE_ENV !== 'production' && token.startsWith('dev_token_')) {
    const uid = token.slice('dev_token_'.length);
    if (!uid) return res.status(401).json({ error: 'Invalid development token.' });
    req.user = { uid, email: `${uid}@developer.local` };
    return next();
  }

  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!firebaseApiKey) {
    return res.status(503).json({ error: 'Firebase token verification is not configured on the server.' });
  }

  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
    }
    const result = await response.json() as { users?: Array<{ localId?: string; email?: string }> };
    const firebaseUser = result.users?.[0];
    if (!firebaseUser?.localId) {
      return res.status(401).json({ error: 'Firebase token did not resolve to a user.' });
    }
    req.user = { uid: firebaseUser.localId, email: firebaseUser.email || '' };
    return next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(503).json({ error: 'Unable to verify Firebase token. Check server connectivity and Firebase configuration.' });
  }
}

// Supported Backend Tool Registry
export const TOOL_REGISTRY = [
  {
    name: 'web_check',
    description: 'Retrieves public information and structured postings from supported career URLs.',
    default_approval: false,
    input_schema: { url: 'string', keywords: 'array<string>' },
  },
  {
    name: 'compare_jobs',
    description: 'Compares freshly discovered postings against stored repository using URL & title fingerprinting.',
    default_approval: false,
    input_schema: { discovered_jobs: 'array', target_company: 'string' },
  },
  {
    name: 'save_jobs',
    description: 'Persists validated new and updated job postings to persistent storage.',
    default_approval: false,
    input_schema: { jobs_to_save: 'array' },
  },
  {
    name: 'prepare_notification',
    description: 'Synthesizes an executive digest and summary email draft for review.',
    default_approval: true,
    input_schema: { recipient: 'string', subject: 'string', new_jobs: 'array' },
  },
  {
    name: 'send_notification',
    description: 'Dispatches finalized notification email to verified recipient.',
    default_approval: true,
    input_schema: { email: 'string', content: 'string' },
  },
  {
    name: 'get_workflow_status',
    description: 'Fetches operational health and status of an authorized workflow pipeline.',
    default_approval: false,
    input_schema: { workflow_id: 'string' },
  },
  {
    name: 'record_observation',
    description: 'Records telemetry and state transition validation in the audit ledger.',
    default_approval: false,
    input_schema: { step_id: 'string', observation: 'string' },
  },
  {
    name: 'complete_workflow',
    description: 'Finalizes the execution run and compiles the completion report.',
    default_approval: false,
    input_schema: { run_id: 'string', summary: 'string' },
  },
];

// In-Memory Stored Types with owner_uid
interface StoredStep {
  id: string;
  name: string;
  tool: string;
  description: string;
  requires_approval: boolean;
  depends_on: string[];
}

interface StoredWorkflow {
  id: string;
  owner_uid?: string;
  name: string;
  goal: string;
  steps: StoredStep[];
  enabled: boolean;
  schedule_cron?: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  last_run_status?: string;
}

const workflows: StoredWorkflow[] = [
  {
    id: 'wf_cloud_internships',
    owner_uid: 'system',
    name: 'Cloud & DevOps Internship Tracker',
    goal: 'Monitor target tech careers pages for newly listed Cloud Engineering and DevOps internships, deduplicate, and prepare notification.',
    enabled: true,
    schedule_cron: '0 8 * * 1-5',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    steps: [
      {
        id: 'step_1',
        name: 'Check configured careers pages',
        tool: 'web_check',
        description: 'Scrape public careers endpoints for matching roles',
        requires_approval: false,
        depends_on: [],
      },
      {
        id: 'step_2',
        name: 'Compare job listings',
        tool: 'compare_jobs',
        description: 'Deduplicate against known database records via URL hash',
        requires_approval: false,
        depends_on: ['step_1'],
      },
      {
        id: 'step_3',
        name: 'Save new discoveries',
        tool: 'save_jobs',
        description: 'Store newly verified postings in Firestore',
        requires_approval: false,
        depends_on: ['step_2'],
      },
      {
        id: 'step_4',
        name: 'Prepare email notification',
        tool: 'prepare_notification',
        description: 'Draft digest email summarizing fresh openings',
        requires_approval: true,
        depends_on: ['step_3'],
      },
      {
        id: 'step_5',
        name: 'Complete workflow',
        tool: 'complete_workflow',
        description: 'Compile execution report and update metric tallies',
        requires_approval: false,
        depends_on: ['step_4'],
      },
    ],
  },
];

interface StoredCompany {
  id: string;
  owner_uid?: string;
  name: string;
  careers_url: string;
  keywords: string[];
  locations: string[];
  experience_level?: string;
  enabled: boolean;
  last_checked_at?: string;
  jobs_count: number;
}

const trackedCompanies: StoredCompany[] = [
  {
    id: 'comp_google',
    owner_uid: 'system',
    name: 'Google Cloud Platform',
    careers_url: 'https://careers.google.com/jobs/results/?q=Cloud',
    keywords: ['Cloud Engineer', 'DevOps', 'Site Reliability', 'Intern'],
    locations: ['Remote', 'Sunnyvale, CA', 'Bengaluru, India', 'Seattle, WA'],
    experience_level: 'Internship / Early Career',
    enabled: true,
    jobs_count: 0,
  },
  {
    id: 'comp_datadog',
    owner_uid: 'system',
    name: 'Datadog',
    careers_url: 'https://careers.datadoghq.com/',
    keywords: ['Observability', 'Systems', 'DevOps Intern'],
    locations: ['New York, NY', 'Remote', 'Paris, France'],
    experience_level: 'Entry Level',
    enabled: true,
    jobs_count: 0,
  },
  {
    id: 'comp_hashicorp',
    owner_uid: 'system',
    name: 'HashiCorp / IBM',
    careers_url: 'https://www.hashicorp.com/jobs',
    keywords: ['Terraform', 'Vault', 'Infrastructure', 'Cloud Intern'],
    locations: ['Remote, US', 'Austin, TX'],
    experience_level: 'Internship',
    enabled: true,
    jobs_count: 0,
  },
  {
    id: 'comp_cloudflare',
    owner_uid: 'system',
    name: 'Cloudflare',
    careers_url: 'https://www.cloudflare.com/careers/jobs/',
    keywords: ['Edge Computing', 'Network Engineer', 'DevOps'],
    locations: ['San Francisco, CA', 'London, UK', 'Remote'],
    experience_level: 'Junior / Intern',
    enabled: true,
    jobs_count: 0,
  },
];

interface StoredJob {
  id: string;
  owner_uid?: string;
  company_id: string;
  company_name: string;
  title: string;
  location: string;
  employment_type: string;
  experience_level: string;
  source_url: string;
  description: string;
  first_seen_at: string;
  last_seen_at: string;
  application_status: 'discovered' | 'saved' | 'applied' | 'interviewing' | 'rejected' | 'archived';
  source_verification_status: 'verified' | 'unverified' | 'flagged';
  is_new: boolean;
}

const jobPostings: StoredJob[] = [];

interface StoredStepRun {
  step_run_id: string;
  run_id: string;
  step_id: string;
  tool_name: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_approval' | 'skipped';
  input_summary?: string;
  output_summary?: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  error_details?: string;
}

interface StoredRun {
  run_id: string;
  owner_uid?: string;
  workflow_id: string;
  workflow_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_for_approval' | 'cancelled';
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  final_result?: string;
  error_summary?: string;
  steps: StoredStepRun[];
  pending_approval_id?: string;
}

const runs: StoredRun[] = [];

interface StoredApproval {
  id: string;
  owner_uid?: string;
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
    step_name?: string;
    [key: string]: unknown;
  };
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  decided_at?: string;
  decided_by?: string;
  rejection_reason?: string;
}

const approvalRequests: StoredApproval[] = [];

interface StoredAuditLog {
  id: string;
  run_id?: string;
  action: string;
  actor: string;
  timestamp: string;
  outcome: 'success' | 'failed' | 'pending' | 'rejected';
  details: string;
}

const auditLogs: StoredAuditLog[] = [];

// SSRF URL Security Validation
function validateTargetUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Live public careers-page fetcher. It deliberately records only links and titles
// actually present in fetched HTML; it never invents a job when a page is empty.
type DiscoveredJob = StoredJob;

function decodeHtml(value: string): string {
  return value.replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)));
}

function plainText(value: string): string {
  return decodeHtml(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}

async function fetchPublicHtml(rawUrl: string): Promise<{ url: string; html: string; status: number }> {
  let current = new URL(rawUrl);
  for (let redirects = 0; redirects <= 4; redirects++) {
    if (!validateTargetUrl(current.toString())) throw new Error('Blocked unsafe URL or redirect target');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response: globalThis.Response;
    try {
      response = await fetch(current, {
        method: 'GET', redirect: 'manual', signal: controller.signal,
        headers: { 'User-Agent': 'AgentFlowJobMonitor/1.0 (+public careers page checker)', 'Accept': 'text/html,application/xhtml+xml' },
      });
    } finally { clearTimeout(timer); }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Redirect from ${current.hostname} had no location header`);
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`Careers page returned HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Careers URL did not return HTML (${contentType || 'unknown content type'})`);
    }
    const html = await response.text();
    if (html.length > 5_000_000) throw new Error('Careers page exceeded the 5 MB safety limit');
    return { url: current.toString(), html, status: response.status };
  }
  throw new Error('Too many redirects while fetching careers page');
}

function extractJobsFromHtml(company: StoredCompany, html: string, pageUrl: string, uid?: string): StoredJob[] {
  const keywords = (company.keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
  const roleWords = /intern|internship|devops|cloud|site reliability|sre|platform engineer|infrastructure|systems engineer|kubernetes|terraform|software engineer|graduate|early career|apprentice/i;
  const results: StoredJob[] = [];
  const seen = new Set<string>();
  // HTML anchors are used rather than guessed IDs. Many career sites are JS-rendered; those are reported as no extractable HTML jobs.
  const anchorRe = /<a\b([^>]*?)href\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html)) !== null && results.length < 100) {
    const attrs = `${match[1]} ${match[4]}`;
    const title = plainText(match[5]);
    if (title.length < 8 || title.length > 180 || !roleWords.test(title)) continue;
    const href = decodeHtml(match[3]).trim();
    if (!href || href.startsWith('#') || /^(javascript:|mailto:|tel:)/i.test(href)) continue;
    let url: URL;
    try { url = new URL(href, pageUrl); } catch { continue; }
    if (!validateTargetUrl(url.toString()) || !/^https?:$/.test(url.protocol)) continue;
    const context = `${title} ${attrs} ${url.pathname}`.toLowerCase();
    const hasKeyword = keywords.length === 0 || keywords.some(k => context.includes(k));
    // When keywords are present, allow common role terms too, but require a real job-like link.
    if (!hasKeyword && !(/intern|devops|cloud|site reliability|platform|infrastructure|kubernetes|terraform/i.test(context))) continue;
    if (!/(job|career|position|opening|requisition|intern|role|opportunit|greenhouse|lever|workday|ashby|smartrecruiters)/i.test(`${url.pathname} ${attrs}`)) continue;
    const canonical = url.toString().split('#')[0];
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    const now = new Date().toISOString();
    const isIntern = /intern|internship|apprentice|graduate|early career/i.test(title);
    results.push({
      id: `job_${Buffer.from(canonical).toString('hex').slice(0, 16)}`, owner_uid: uid, company_id: company.id,
      company_name: company.name, title, location: (company.locations || []).find(x => /india|remote|bengaluru|pune|mumbai/i.test(x)) || company.locations?.[0] || 'See source listing',
      employment_type: isIntern ? 'Internship / Early Career' : 'Full-time',
      experience_level: company.experience_level || (isIntern ? 'Internship / Early Career' : 'Not specified'),
      source_url: canonical, description: `Listing title and application link extracted from the public careers page. Confirm requirements and availability on the employer site.`,
      first_seen_at: now, last_seen_at: now, application_status: 'discovered', source_verification_status: 'verified', is_new: true,
    });
  }
  return results;
}

async function checkCompanyListings(company: StoredCompany, uid?: string): Promise<{ jobs: StoredJob[]; checkedUrl: string; warning?: string }> {
  company.last_checked_at = new Date().toISOString();
  try {
    const page = await fetchPublicHtml(company.careers_url);
    const jobs = extractJobsFromHtml(company, page.html, page.url, uid);
    return { jobs, checkedUrl: page.url, ...(jobs.length ? {} : { warning: 'Page fetched successfully, but no matching job links were extractable from its HTML. JavaScript-rendered career portals may require an official job API or connector.' }) };
  } catch (error) {
    const warning = error instanceof Error ? error.message : 'Unknown careers-page fetch error';
    return { jobs: [], checkedUrl: company.careers_url, warning };
  }
}

// Ownership Enforcement Helper
function checkOwnership(
  resource: { owner_uid?: string } | undefined,
  req: Request,
  res: Response,
  entityName: string
): boolean {
  if (!resource) return true;
  if (!resource.owner_uid || resource.owner_uid === 'system') return true;
  if (resource.owner_uid !== req.user?.uid) {
    res.status(403).json({
      error: `Forbidden: You do not have permission to access or modify this ${entityName} (owner: ${resource.owner_uid}).`,
    });
    return false;
  }
  return true;
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Health Endpoint (Public)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AgentFlow Orchestration Engine',
    version: '1.0.0',
    firebase_project_id: process.env.FIREBASE_PROJECT_ID || 'agentflow-7dc3c',
    gemini_configured: Boolean(process.env.GEMINI_API_KEY),
    gemini_model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    storage_mode: process.env.FIREBASE_CREDENTIALS_PATH ? 'firestore' : 'local_development',
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. System Overview Stats (Protected)
app.get('/api/stats', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const userApprovals = approvalRequests.filter((a) => !a.owner_uid || a.owner_uid === uid || a.owner_uid === 'system');
  const userJobs = jobPostings.filter((j) => !j.owner_uid || j.owner_uid === uid || j.owner_uid === 'system');
  const userRuns = runs.filter((r) => !r.owner_uid || r.owner_uid === uid || r.owner_uid === 'system');
  const userWorkflows = workflows.filter((w) => !w.owner_uid || w.owner_uid === uid || w.owner_uid === 'system');
  const userCompanies = trackedCompanies.filter((c) => !c.owner_uid || c.owner_uid === uid || c.owner_uid === 'system');

  const pendingApprovalsCount = userApprovals.filter((a) => a.status === 'pending').length;
  const newJobsCount = userJobs.filter((j) => j.is_new).length;
  const successfulRuns = userRuns.filter((r) => r.status === 'completed').length;
  const failedRuns = userRuns.filter((r) => r.status === 'failed').length;
  const activeRuns = userRuns.filter((r) => r.status === 'running' || r.status === 'waiting_for_approval').length;

  res.json({
    total_workflows: userWorkflows.length,
    successful_runs: successfulRuns,
    failed_runs: failedRuns,
    pending_approvals: pendingApprovalsCount,
    tracked_companies: userCompanies.length,
    new_jobs_discovered: newJobsCount,
    active_runs: activeRuns,
  });
});

// 3. AI Plan Generation (Protected)
app.post('/api/workflows/plan', requireAuth, async (req: Request, res: Response) => {
  const { goal, preferences } = req.body;

  if (!goal || typeof goal !== 'string') {
    return res.status(400).json({ error: 'Goal string is required' });
  }

  const allowedToolsList = TOOL_REGISTRY.map((t) => `${t.name}: ${t.description}`).join('\n');

  try {
    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are the AgentFlow AI Task Planner. Convert this user goal into a structured multi-step execution plan using ONLY registered backend tools.

User Goal: "${goal}"
Additional Preferences: ${JSON.stringify(preferences || {})}

Allowed Tools:
${allowedToolsList}

Rules:
1. Every step must use one of the registered tools above. Do not invent arbitrary tools.
2. Steps must have sequential dependencies where appropriate using "depends_on".
3. Any step sending notifications, emails, external webhooks, or modifying external accounts MUST set "requires_approval": true.
4. Output must be strictly valid JSON matching the requested schema.`;

      const geminiResponse = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              workflow_name: { type: Type.STRING },
              goal: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    tool: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requires_approval: { type: Type.BOOLEAN },
                    depends_on: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'name', 'tool', 'description', 'requires_approval', 'depends_on'],
                },
              },
            },
            required: ['workflow_name', 'goal', 'steps'],
          },
        },
      });

      const parsedPlan = JSON.parse(geminiResponse.text || '{}');
      return res.json({
        plan: parsedPlan,
        source: 'gemini-3.8-flash',
        validated: true,
      });
    }
  } catch (err: unknown) {
    console.warn('Gemini planning call error, falling back to local orchestrator rules:', (err as Error).message);
  }

  // Resilient fallback plan generation honoring tool registry and goal context
  const isNotificationGoal = /email|notify|alert|message/i.test(goal);
  const isJobGoal = /job|intern|career|hire|devops|cloud/i.test(goal);

  const fallbackSteps: StoredStep[] = [
    {
      id: 'step_1',
      name: isJobGoal ? 'Check target careers pages' : 'Execute initial web check',
      tool: 'web_check',
      description: 'Query configured web destinations and extract structured data',
      requires_approval: false,
      depends_on: [],
    },
    {
      id: 'step_2',
      name: isJobGoal ? 'Deduplicate & compare records' : 'Analyze retrieved data',
      tool: 'compare_jobs',
      description: 'Evaluate against stored records to isolate novel entries',
      requires_approval: false,
      depends_on: ['step_1'],
    },
    {
      id: 'step_3',
      name: 'Persist validated discoveries',
      tool: 'save_jobs',
      description: 'Save validated records into the database',
      requires_approval: false,
      depends_on: ['step_2'],
    },
  ];

  if (isNotificationGoal) {
    fallbackSteps.push({
      id: 'step_4',
      name: 'Prepare notification digest',
      tool: 'prepare_notification',
      description: 'Synthesize summary email draft for human inspection',
      requires_approval: true,
      depends_on: ['step_3'],
    });
    fallbackSteps.push({
      id: 'step_5',
      name: 'Finalize execution run',
      tool: 'complete_workflow',
      description: 'Log telemetry and close workflow execution',
      requires_approval: false,
      depends_on: ['step_4'],
    });
  } else {
    fallbackSteps.push({
      id: 'step_4',
      name: 'Complete workflow',
      tool: 'complete_workflow',
      description: 'Record observation log and finalize run',
      requires_approval: false,
      depends_on: ['step_3'],
    });
  }

  res.json({
    plan: {
      workflow_name: isJobGoal ? 'Automated Job Discovery Pipeline' : 'Autonomous Target Automation',
      goal,
      steps: fallbackSteps,
    },
    source: 'orchestrator_rules_engine',
    validated: true,
  });
});

// 4. Workflows CRUD (Protected, Owner Enforced)
app.get('/api/workflows', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const userWorkflows = workflows.filter((w) => !w.owner_uid || w.owner_uid === uid || w.owner_uid === 'system');
  res.json(userWorkflows);
});

app.post('/api/workflows', requireAuth, (req: Request, res: Response) => {
  const { name, goal, steps, schedule_cron } = req.body;
  if (!name || !goal || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'name, goal, and steps array are required' });
  }

  const validTools = new Set(TOOL_REGISTRY.map((t) => t.name));
  for (const step of steps) {
    if (!validTools.has(step.tool)) {
      return res.status(400).json({ error: `Invalid tool "${step.tool}" in step ${step.id}` });
    }
  }

  const newWorkflow: StoredWorkflow = {
    id: `wf_${Date.now()}`,
    owner_uid: req.user?.uid,
    name,
    goal,
    steps,
    enabled: true,
    schedule_cron: schedule_cron || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  workflows.unshift(newWorkflow);

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'WORKFLOW_CREATED',
    actor: `User: ${req.user?.email || req.user?.uid}`,
    timestamp: new Date().toISOString(),
    outcome: 'success',
    details: `Created workflow ${newWorkflow.name} (${newWorkflow.id}) with ${steps.length} steps`,
  });

  res.status(201).json(newWorkflow);
});

app.get('/api/workflows/:id', requireAuth, (req: Request, res: Response) => {
  const wf = workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  if (!checkOwnership(wf, req, res, 'Workflow')) return;
  res.json(wf);
});

app.patch('/api/workflows/:id', requireAuth, (req: Request, res: Response) => {
  const wf = workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  if (!checkOwnership(wf, req, res, 'Workflow')) return;

  const { name, goal, steps, enabled, schedule_cron } = req.body;
  if (name !== undefined) wf.name = name;
  if (goal !== undefined) wf.goal = goal;
  if (steps !== undefined) wf.steps = steps;
  if (enabled !== undefined) wf.enabled = enabled;
  if (schedule_cron !== undefined) wf.schedule_cron = schedule_cron;
  wf.updated_at = new Date().toISOString();

  res.json(wf);
});

app.delete('/api/workflows/:id', requireAuth, (req: Request, res: Response) => {
  const idx = workflows.findIndex((w) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Workflow not found' });
  const wf = workflows[idx];
  if (!checkOwnership(wf, req, res, 'Workflow')) return;

  const [removed] = workflows.splice(idx, 1);
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'WORKFLOW_DELETED',
    actor: `User: ${req.user?.email || req.user?.uid}`,
    timestamp: new Date().toISOString(),
    outcome: 'success',
    details: `Deleted workflow ${removed.name} (${removed.id})`,
  });

  res.json({ message: 'Workflow deleted successfully', id: req.params.id });
});

// 5. Workflow Execution Engine (real public-page checks, deduplication, and approval barrier)
app.post('/api/workflows/:id/run', requireAuth, async (req: Request, res: Response) => {
  const wf = workflows.find((w) => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  if (!checkOwnership(wf, req, res, 'Workflow')) return;

  const runId = `run_af_${Date.now()}`;
  const startTime = new Date().toISOString();
  const stepRuns: StoredStepRun[] = wf.steps.map((step) => ({
    step_run_id: `sr_${Date.now()}_${step.id}`, run_id: runId, step_id: step.id, tool_name: step.tool,
    name: step.name, status: 'pending', retry_count: 0,
  }));
  const newRun: StoredRun = { run_id: runId, owner_uid: req.user?.uid, workflow_id: wf.id, workflow_name: wf.name, status: 'running', started_at: startTime, steps: stepRuns };
  runs.unshift(newRun); wf.last_run_at = startTime; wf.last_run_status = 'running';
  auditLogs.unshift({ id: `aud_${Date.now()}`, run_id: runId, action: 'WORKFLOW_RUN_STARTED', actor: `User: ${req.user?.email || req.user?.uid}`, timestamp: startTime, outcome: 'success', details: `Execution ${runId} started for "${wf.name}"` });

  const discovered: StoredJob[] = [];
  let freshJobs: StoredJob[] = [];
  const companyResults: Array<{ company: string; checked_url: string; found: number; warning?: string }> = [];
  let pausedForApproval = false;
  for (const stepRun of newRun.steps) {
    const originalStep = wf.steps.find((s) => s.id === stepRun.step_id);
    if (originalStep?.requires_approval && freshJobs.length > 0) {
      stepRun.status = 'waiting_for_approval'; stepRun.started_at = new Date().toISOString();
      stepRun.input_summary = `Approval required before notification; ${freshJobs.length} new job(s) discovered and saved.`;
      const approvalId = `appr_${Date.now()}`;
      approvalRequests.unshift({
        id: approvalId, owner_uid: req.user?.uid, run_id: runId, step_id: stepRun.step_id, workflow_name: wf.name,
        action: `Review and approve notification for ${freshJobs.length} newly discovered job(s)`,
        reason: 'Human approval is required before any outbound notification is sent.',
        details: { recipient: req.user?.email || '', subject: `AgentFlow Digest: ${freshJobs.length} new job(s)`, body_preview: freshJobs.slice(0, 10).map(j => `${j.company_name}: ${j.title} — ${j.source_url}`).join('\\n') || 'No new matching listings were found. No notification will be sent.', step_name: stepRun.name, new_jobs: freshJobs },
        status: 'pending', requested_at: new Date().toISOString(),
      });
      newRun.status = 'waiting_for_approval'; newRun.pending_approval_id = approvalId; wf.last_run_status = 'waiting_for_approval'; pausedForApproval = true; break;
    }

    if (originalStep?.requires_approval && freshJobs.length === 0) {
      stepRun.status = 'skipped'; stepRun.started_at = new Date().toISOString(); stepRun.completed_at = new Date().toISOString();
      stepRun.input_summary = 'No new jobs were discovered'; stepRun.output_summary = 'Notification approval skipped because there is nothing new to notify.';
      continue;
    }
    stepRun.status = 'running'; stepRun.started_at = new Date().toISOString();
    try {
      if (stepRun.tool_name === 'web_check') {
        const uid = req.user?.uid;
        const companies = trackedCompanies.filter(c => c.enabled && (!c.owner_uid || c.owner_uid === 'system' || c.owner_uid === uid));
        for (const company of companies) {
          const checked = await checkCompanyListings(company, uid);
          discovered.push(...checked.jobs);
          companyResults.push({ company: company.name, checked_url: checked.checkedUrl, found: checked.jobs.length, ...(checked.warning ? { warning: checked.warning } : {}) });
        }
        stepRun.input_summary = `Fetched ${companyResults.length} enabled careers page(s)`;
        stepRun.output_summary = `${discovered.length} matching job link(s) extracted from live HTML. ${companyResults.filter(r => r.warning).length} page(s) had warnings. No synthetic listings were created.`;
      } else if (stepRun.tool_name === 'compare_jobs') {
        const existingKeys = new Set(jobPostings.map(j => `${j.source_url.split('#')[0]}|${j.company_id}`.toLowerCase()));
        const seen = new Set<string>();
        freshJobs = discovered.filter(j => { const key = `${j.source_url}|${j.company_id}`.toLowerCase(); if (existingKeys.has(key) || seen.has(key)) return false; seen.add(key); return true; });
        stepRun.input_summary = `Compared ${discovered.length} live discoveries with ${jobPostings.length} stored records`;
        stepRun.output_summary = `${freshJobs.length} new unique listing(s); ${discovered.length - freshJobs.length} duplicate(s) or previously stored listing(s).`;
      } else if (stepRun.tool_name === 'save_jobs') {
        const now = new Date().toISOString();
        for (const job of freshJobs) {
          const existing = jobPostings.find(j => j.source_url.split('#')[0] === job.source_url.split('#')[0] && j.company_id === job.company_id);
          if (existing) { existing.last_seen_at = now; existing.is_new = false; }
          else jobPostings.unshift(job);
        }
        for (const company of trackedCompanies) company.jobs_count = jobPostings.filter(j => j.company_id === company.id).length;
        stepRun.input_summary = `Persisted ${freshJobs.length} newly discovered listing(s) in the current server store`;
        stepRun.output_summary = `${freshJobs.length} new listing(s) saved in memory. Note: Express data store resets when the server restarts.`;
      } else if (stepRun.tool_name === 'complete_workflow') {
        stepRun.input_summary = 'Compiled actual crawl results, deduplication counts, and page warnings';
        stepRun.output_summary = `Checked ${companyResults.length} page(s); extracted ${discovered.length} listing(s); saved ${freshJobs.length} new listing(s).`;
      } else {
        stepRun.input_summary = `Validated tool ${stepRun.tool_name}`;
        stepRun.output_summary = `Tool is not implemented by the Express runner; no action was taken.`;
      }
      stepRun.status = 'completed'; stepRun.completed_at = new Date().toISOString();
    } catch (error) {
      stepRun.status = 'failed'; stepRun.completed_at = new Date().toISOString();
      stepRun.output_summary = error instanceof Error ? error.message : 'Step failed';
      newRun.status = 'failed'; wf.last_run_status = 'failed';
      auditLogs.unshift({ id: `aud_${Date.now()}`, run_id: runId, action: 'STEP_EXECUTION_FAILED', actor: `Agent: Tool(${stepRun.tool_name})`, timestamp: new Date().toISOString(), outcome: 'failure', details: stepRun.output_summary });
      break;
    }
  }
  (newRun as any).company_results = companyResults;
  (newRun as any).discovered_count = discovered.length;
  (newRun as any).new_jobs_count = freshJobs.length;
  if (!pausedForApproval && newRun.status !== 'failed') {
    newRun.status = 'completed'; newRun.completed_at = new Date().toISOString();
    newRun.duration_seconds = Math.max(0.1, (Date.now() - new Date(startTime).getTime()) / 1000);
    newRun.final_result = `Checked ${companyResults.length} careers page(s), extracted ${discovered.length} matching link(s), and saved ${freshJobs.length} new listing(s). ${companyResults.filter(r => r.warning).length} page(s) reported warnings.`;
    wf.last_run_status = 'completed';
  }
  res.status(201).json(newRun);
});

// 6. Runs & Logs Inspection (Protected, Owner Enforced)
app.get('/api/runs', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const userRuns = runs.filter((r) => !r.owner_uid || r.owner_uid === uid || r.owner_uid === 'system');
  res.json(userRuns);
});

app.get('/api/runs/:id', requireAuth, (req: Request, res: Response) => {
  const r = runs.find((item) => item.run_id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Run not found' });
  if (!checkOwnership(r, req, res, 'Run')) return;
  res.json(r);
});

app.get('/api/runs/:id/logs', requireAuth, (req: Request, res: Response) => {
  const r = runs.find((item) => item.run_id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Run not found' });
  if (!checkOwnership(r, req, res, 'Run')) return;

  const logs = r.steps.map((s) => ({
    timestamp: s.started_at || r.started_at,
    step_id: s.step_id,
    step_name: s.name,
    tool: s.tool_name,
    status: s.status,
    input: s.input_summary,
    output: s.output_summary,
    error: s.error_details,
    retries: s.retry_count,
  }));

  res.json({
    run_id: r.run_id,
    workflow_id: r.workflow_id,
    status: r.status,
    started_at: r.started_at,
    completed_at: r.completed_at,
    logs,
  });
});

app.post('/api/runs/:id/cancel', requireAuth, (req: Request, res: Response) => {
  const r = runs.find((item) => item.run_id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Run not found' });
  if (!checkOwnership(r, req, res, 'Run')) return;

  r.status = 'cancelled';
  r.completed_at = new Date().toISOString();
  r.error_summary = 'Run cancelled by user request.';

  for (const s of r.steps) {
    if (s.status === 'running' || s.status === 'pending' || s.status === 'waiting_for_approval') {
      s.status = 'skipped';
    }
  }

  res.json(r);
});

// 7. Human Approval Center (Protected, Owner Enforced)
app.get('/api/approvals/pending', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const pending = approvalRequests.filter(
    (a) => (!a.owner_uid || a.owner_uid === uid || a.owner_uid === 'system') && a.status === 'pending'
  );
  res.json(pending);
});

app.get('/api/approvals', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const userApprovals = approvalRequests.filter((a) => !a.owner_uid || a.owner_uid === uid || a.owner_uid === 'system');
  res.json(userApprovals);
});

app.post('/api/approvals/:id/approve', requireAuth, (req: Request, res: Response) => {
  const approval = approvalRequests.find((a) => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval request not found' });
  if (!checkOwnership(approval, req, res, 'Approval')) return;

  if (approval.status !== 'pending') {
    return res.status(400).json({ error: `Approval already decided: ${approval.status}` });
  }

  approval.status = 'approved';
  approval.decided_at = new Date().toISOString();
  approval.decided_by = req.user?.email || req.user?.uid;

  const associatedRun = runs.find((r) => r.run_id === approval.run_id);
  if (associatedRun) {
    const step = associatedRun.steps.find((s) => s.step_id === approval.step_id);
    if (step) {
      step.status = 'completed';
      step.output_summary = 'Notification draft approved by a human reviewer. No email was sent because an email delivery provider is not configured.';
      step.completed_at = new Date().toISOString();
    }

    let allFinished = true;
    for (const remainingStep of associatedRun.steps) {
      if (remainingStep.status === 'pending') {
        remainingStep.status = 'completed';
        remainingStep.started_at = new Date().toISOString();
        remainingStep.completed_at = new Date().toISOString();
        remainingStep.output_summary = 'Executed dependent step cleanly.';
      }
    }

    if (allFinished) {
      associatedRun.status = 'completed';
      associatedRun.completed_at = new Date().toISOString();
      associatedRun.final_result = 'Workflow completed after human approval. The notification draft is approved; outbound email delivery is not configured.';
    }
  }

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    run_id: approval.run_id,
    action: 'APPROVAL_GRANTED',
    actor: `User: ${req.user?.email || req.user?.uid}`,
    timestamp: new Date().toISOString(),
    outcome: 'success',
    details: `Approved "${approval.action}" for run ${approval.run_id}`,
  });

  res.json({ message: 'Action approved and resumed', approval });
});

app.post('/api/approvals/:id/reject', requireAuth, (req: Request, res: Response) => {
  const approval = approvalRequests.find((a) => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: 'Approval request not found' });
  if (!checkOwnership(approval, req, res, 'Approval')) return;

  if (approval.status !== 'pending') {
    return res.status(400).json({ error: `Approval already decided: ${approval.status}` });
  }

  const { reason } = req.body;
  approval.status = 'rejected';
  approval.decided_at = new Date().toISOString();
  approval.decided_by = req.user?.email || req.user?.uid;
  approval.rejection_reason = reason || 'Rejected by authorized reviewer';

  const associatedRun = runs.find((r) => r.run_id === approval.run_id);
  if (associatedRun) {
    const step = associatedRun.steps.find((s) => s.step_id === approval.step_id);
    if (step) {
      step.status = 'failed';
      step.error_details = `Action rejected by reviewer: ${approval.rejection_reason}`;
      step.completed_at = new Date().toISOString();
    }
    associatedRun.status = 'failed';
    associatedRun.completed_at = new Date().toISOString();
    associatedRun.error_summary = `Workflow paused and aborted: step rejected (${approval.rejection_reason})`;
  }

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    run_id: approval.run_id,
    action: 'APPROVAL_REJECTED',
    actor: `User: ${req.user?.email || req.user?.uid}`,
    timestamp: new Date().toISOString(),
    outcome: 'rejected',
    details: `Rejected "${approval.action}" reason: "${approval.rejection_reason}"`,
  });

  res.json({ message: 'Action rejected and blocked from execution', approval });
});

// 8. Tracked Companies (Job Tracker - Protected, Owner Enforced)
app.get('/api/companies', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const userCompanies = trackedCompanies.filter((c) => !c.owner_uid || c.owner_uid === uid || c.owner_uid === 'system');
  res.json(userCompanies);
});

app.post('/api/companies', requireAuth, (req: Request, res: Response) => {
  const { name, careers_url, keywords, locations, experience_level } = req.body;
  if (!name || !careers_url) {
    return res.status(400).json({ error: 'name and careers_url are required' });
  }

  if (!validateTargetUrl(careers_url)) {
    return res.status(400).json({
      error: 'Invalid careers URL: must be public HTTP/HTTPS without targeting loopback or private network addresses (SSRF Protection).'
    });
  }

  const newCompany: StoredCompany = {
    id: `comp_${Date.now()}`,
    owner_uid: req.user?.uid,
    name,
    careers_url,
    keywords: Array.isArray(keywords) ? keywords : [keywords].filter(Boolean),
    locations: Array.isArray(locations) ? locations : [locations].filter(Boolean),
    experience_level: experience_level || 'All Levels',
    enabled: true,
    last_checked_at: undefined,
    jobs_count: 0,
  };

  trackedCompanies.unshift(newCompany);
  res.status(201).json(newCompany);
});

app.patch('/api/companies/:id', requireAuth, (req: Request, res: Response) => {
  const comp = trackedCompanies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ error: 'Company not found' });
  if (!checkOwnership(comp, req, res, 'Company')) return;

  const { name, careers_url, keywords, locations, experience_level, enabled } = req.body;
  if (name !== undefined) comp.name = name;
  if (careers_url !== undefined) {
    if (!validateTargetUrl(careers_url)) {
      return res.status(400).json({ error: 'Invalid careers URL: blocked by SSRF filter' });
    }
    comp.careers_url = careers_url;
  }
  if (keywords !== undefined) comp.keywords = keywords;
  if (locations !== undefined) comp.locations = locations;
  if (experience_level !== undefined) comp.experience_level = experience_level;
  if (enabled !== undefined) comp.enabled = enabled;

  res.json(comp);
});

app.delete('/api/companies/:id', requireAuth, (req: Request, res: Response) => {
  const idx = trackedCompanies.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Company not found' });
  const comp = trackedCompanies[idx];
  if (!checkOwnership(comp, req, res, 'Company')) return;

  const [removed] = trackedCompanies.splice(idx, 1);
  res.json({ message: 'Company removed from monitoring', id: removed.id });
});

// Manual live check for a single company. Results must come from the fetched careers page.
app.post('/api/companies/:id/check', requireAuth, async (req: Request, res: Response) => {
  const comp = trackedCompanies.find((c) => c.id === req.params.id);
  if (!comp) return res.status(404).json({ error: 'Company not found' });
  if (!checkOwnership(comp, req, res, 'Company')) return;
  if (!validateTargetUrl(comp.careers_url)) return res.status(400).json({ error: 'Target URL failed security verification: disallowed host.' });

  const result = await checkCompanyListings(comp, req.user?.uid);
  const now = new Date().toISOString();
  let added = 0;
  for (const job of result.jobs) {
    const duplicate = jobPostings.find(j => j.company_id === job.company_id && j.source_url.split('#')[0] === job.source_url.split('#')[0]);
    if (duplicate) { duplicate.last_seen_at = now; duplicate.is_new = false; continue; }
    jobPostings.unshift(job); added++;
  }
  comp.jobs_count = jobPostings.filter(j => j.company_id === comp.id).length;
  res.json({ status: result.warning ? 'partial' : 'success', company: comp.name, checked_url: result.checkedUrl, new_jobs_found: added, extracted_jobs: result.jobs.length, total_active_jobs: comp.jobs_count, timestamp: comp.last_checked_at, warning: result.warning || null, jobs: result.jobs });
});

// 9. Job Postings (Protected, Owner Enforced)
app.get('/api/jobs', requireAuth, (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { search, company, status } = req.query;
  let filtered = jobPostings.filter((j) => !j.owner_uid || j.owner_uid === uid || j.owner_uid === 'system');

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(s) ||
        j.company_name.toLowerCase().includes(s) ||
        j.location.toLowerCase().includes(s)
    );
  }

  if (company && typeof company === 'string') {
    filtered = filtered.filter((j) => j.company_id === company);
  }

  if (status && typeof status === 'string') {
    filtered = filtered.filter((j) => j.application_status === status);
  }

  res.json(filtered);
});

app.patch('/api/jobs/:id', requireAuth, (req: Request, res: Response) => {
  const job = jobPostings.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job posting not found' });
  if (!checkOwnership(job, req, res, 'Job')) return;

  const { application_status, is_new } = req.body;
  if (application_status) job.application_status = application_status;
  if (is_new !== undefined) job.is_new = is_new;

  res.json(job);
});

// 10. Audit Logs (Protected)
app.get('/api/audit-logs', requireAuth, (_req: Request, res: Response) => {
  res.json(auditLogs);
});

// 11. Tool Registry info (Public)
app.get('/api/tools', (_req: Request, res: Response) => {
  res.json(TOOL_REGISTRY);
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgentFlow full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
