# AgentFlow: REST API Specification
> Connected Firebase Project: `agentflow-7dc3c`

The AgentFlow backend exposes a clean RESTful API with JSON request and response payloads, protected by Firebase ID Token Bearer authentication and resource ownership enforcement.

## Base URL
- Development: `http://localhost:3000` (full-stack proxy) or `http://localhost:8000` (FastAPI direct)

## Authentication & Authorization Architecture
All `/api/*` endpoints (except `/health` and `/api/tools`) require an HTTP `Authorization` header containing a verified Firebase ID token:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```
- **401 Unauthorized**: Returned if the `Authorization` header is missing, malformed, or the token is expired/invalid.
- **403 Forbidden**: Returned if an authenticated user attempts to access, mutate, or delete a resource (workflow, run, company, job) owned by a different user (`owner_uid != current_user.uid`).
- **Resource Scoping**: `GET /api/workflows`, `GET /api/runs`, `GET /api/companies`, `GET /api/jobs`, and `GET /api/approvals` automatically filter results to resources owned by the caller or initialized by the system.

---

## Endpoints

### 1. Health & Telemetry
- **GET `/health`** (Public)
  - Returns service status, configured Firebase project ID, Gemini API configuration status, and storage persistence mode.
  - Response:
    ```json
    {
      "status": "ok",
      "service": "AgentFlow Orchestration Engine",
      "version": "1.0.0",
      "firebase_project_id": "agentflow-7dc3c",
      "gemini_configured": true,
      "gemini_model": "gemini-3.8-flash",
      "storage_mode": "firestore",
      "timestamp": "2026-10-29T02:00:00Z"
    }
    ```

- **GET `/api/stats`** (Protected)
  - Returns user-scoped counters for total workflows, successful/failed runs, pending approvals, and discovered jobs.

### 2. Workflow Planning & Management
- **POST `/api/workflows/plan`** (Protected)
  - Submits a user goal to Google Gemini for structured planning.
  - Body: `{"goal": "...", "preferences": {...}}`
  - Response: `{"plan": {"workflow_name": "...", "steps": [...]}, "validated": true}`

- **GET `/api/workflows`** (Protected)
  - Retrieves all configured pipelines owned by the authenticated caller.

- **POST `/api/workflows`** (Protected)
  - Creates and stores a verified workflow pipeline stamped with `owner_uid: current_user.uid`.

- **GET `/api/workflows/{id}`** (Protected, Owner Enforced)
  - Retrieves a specific workflow (returns 403 if owned by another user).

- **PATCH `/api/workflows/{id}`** (Protected, Owner Enforced)
  - Updates workflow name, goal, steps, or schedule (returns 403 if owned by another user).

- **DELETE `/api/workflows/{id}`** (Protected, Owner Enforced)
  - Deletes a workflow (returns 403 if owned by another user).

### 3. Execution Engine
- **POST `/api/workflows/{id}/run`** (Protected, Owner Enforced)
  - Triggers an execution run following the plan-act-observe cycle.
  - Automatically creates an approval checkpoint if protected steps are reached.

- **GET `/api/runs`** (Protected)
  - Lists historical execution runs owned by the caller.

- **GET `/api/runs/{run_id}`** (Protected, Owner Enforced)
  - Retrieves a specific run's current state and step execution timeline.

- **GET `/api/runs/{run_id}/logs`** (Protected, Owner Enforced)
  - Retrieves detailed execution telemetry and step logs.

- **POST `/api/runs/{run_id}/cancel`** (Protected, Owner Enforced)
  - Gracefully terminates a running pipeline.

### 4. Human Approval Center
- **GET `/api/approvals`** (Protected)
  - Lists all approval requests for the caller's workflows.

- **GET `/api/approvals/pending`** (Protected)
  - Lists pending approval checkpoints.

- **POST `/api/approvals/{id}/approve`** (Protected, Owner Enforced)
  - Grants approval and resumes paused workflow execution.

- **POST `/api/approvals/{id}/reject`** (Protected, Owner Enforced)
  - Rejects approval with an optional reason, aborting protected outbound side effects.

### 5. Job Tracker & Company Monitoring
- **GET `/api/companies`** (Protected)
  - Retrieves monitored companies scoped to caller.

- **POST `/api/companies`** (Protected)
  - Registers a new company careers portal (enforces SSRF protection).

- **PATCH `/api/companies/{id}`** (Protected, Owner Enforced)
  - Updates company monitoring parameters.

- **DELETE `/api/companies/{id}`** (Protected, Owner Enforced)
  - Removes company from monitoring.

- **POST `/api/companies/{id}/check`** (Protected, Owner Enforced)
  - Triggers an immediate scan with duplicate detection.

- **GET `/api/jobs`** (Protected)
  - Retrieves discovered job listings with optional query filters (`search`, `company`, `status`).

- **PATCH `/api/jobs/{id}`** (Protected, Owner Enforced)
  - Updates application status (`discovered`, `saved`, `applied`, `archived`).

### 6. Tools & Audit
- **GET `/api/tools`** (Public)
  - Returns the list of registered backend tools.

- **GET `/api/audit-logs`** (Protected)
  - Retrieves immutable audit trail entries.
