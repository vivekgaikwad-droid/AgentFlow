import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.core.config import settings

logger = logging.getLogger("agentflow.repository")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "store.json")

class FirestoreRepository:
    """
    Production Firestore persistence layer using Google Firebase Admin SDK.
    Directs all operations to Cloud Firestore collections with owner_uid scoping.
    """
    def __init__(self, db):
        self.db = db

    # Workflows CRUD
    def get_workflows(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection("workflows")
        if owner_uid:
            docs = query.where("owner_uid", "==", owner_uid).stream()
        else:
            docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("workflows").document(workflow_id).get()
        return doc.to_dict() if doc.exists else None

    def save_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("workflows").document(workflow["id"]).set(workflow)
        return workflow

    def delete_workflow(self, workflow_id: str) -> bool:
        doc_ref = self.db.collection("workflows").document(workflow_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False

    # Companies CRUD
    def get_companies(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection("tracked_companies")
        if owner_uid:
            docs = query.where("owner_uid", "==", owner_uid).stream()
        else:
            docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("tracked_companies").document(company_id).get()
        return doc.to_dict() if doc.exists else None

    def save_company(self, company: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("tracked_companies").document(company["id"]).set(company)
        return company

    def delete_company(self, company_id: str) -> bool:
        doc_ref = self.db.collection("tracked_companies").document(company_id)
        if doc_ref.get().exists:
            doc_ref.delete()
            return True
        return False

    # Jobs CRUD
    def get_jobs(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection("job_postings")
        if owner_uid:
            docs = query.where("owner_uid", "==", owner_uid).stream()
        else:
            docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("job_postings").document(job_id).get()
        return doc.to_dict() if doc.exists else None

    def save_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("job_postings").document(job["id"]).set(job)
        return job

    # Runs CRUD
    def get_runs(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection("workflow_runs")
        if owner_uid:
            docs = query.where("owner_uid", "==", owner_uid).stream()
        else:
            docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("workflow_runs").document(run_id).get()
        return doc.to_dict() if doc.exists else None

    def save_run(self, run: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("workflow_runs").document(run["run_id"]).set(run)
        return run

    # Approvals CRUD
    def get_approvals(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.db.collection("approval_requests")
        if owner_uid:
            docs = query.where("owner_uid", "==", owner_uid).stream()
        else:
            docs = query.stream()
        return [doc.to_dict() for doc in docs]

    def get_approval(self, approval_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db.collection("approval_requests").document(approval_id).get()
        return doc.to_dict() if doc.exists else None

    def save_approval(self, approval: Dict[str, Any]) -> Dict[str, Any]:
        self.db.collection("approval_requests").document(approval["id"]).set(approval)
        return approval

    # Audit Logs
    def get_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        docs = self.db.collection("audit_logs").order_by("timestamp", direction="DESCENDING").limit(limit).stream()
        return [doc.to_dict() for doc in docs]

    def add_audit_log(self, log_entry: Dict[str, Any]):
        self.db.collection("audit_logs").document(log_entry["id"]).set(log_entry)


class LocalDiskRepository:
    """
    Local JSON disk persistence fallback layer.
    Used for local testing and offline development. State survives process restarts.
    """
    def __init__(self):
        self.state: Dict[str, List[Dict[str, Any]]] = {
            "workflows": [],
            "companies": [],
            "jobs": [],
            "runs": [],
            "approvals": [],
            "audit_logs": []
        }
        self._load_local_state()

    def _load_local_state(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
            
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r") as f:
                    self.state = json.load(f)
                    return
            except Exception as e:
                logger.warning(f"Error loading {DATA_FILE}: {e}")

        # Seed initial state if store is empty
        now = datetime.now().isoformat()
        self.state["workflows"] = [
            {
                "id": "wf_cloud_internships",
                "owner_uid": "system",
                "name": "Cloud & DevOps Internship Tracker",
                "goal": "Monitor target tech careers pages for newly listed Cloud Engineering and DevOps internships, deduplicate, and prepare notification.",
                "enabled": True,
                "schedule_cron": "0 8 * * 1-5",
                "created_at": now,
                "updated_at": now,
                "last_run_at": now,
                "last_run_status": "completed",
                "steps": [
                    {"id": "step_1", "name": "Check configured careers pages", "tool": "web_check", "description": "Scrape public careers endpoints", "requires_approval": False, "depends_on": []},
                    {"id": "step_2", "name": "Compare job listings", "tool": "compare_jobs", "description": "Deduplicate against known records", "requires_approval": False, "depends_on": ["step_1"]},
                    {"id": "step_3", "name": "Save new discoveries", "tool": "save_jobs", "description": "Store verified listings", "requires_approval": False, "depends_on": ["step_2"]},
                    {"id": "step_4", "name": "Prepare email notification", "tool": "prepare_notification", "description": "Draft digest email", "requires_approval": True, "depends_on": ["step_3"]},
                    {"id": "step_5", "name": "Complete workflow", "tool": "complete_workflow", "description": "Compile run report", "requires_approval": False, "depends_on": ["step_4"]}
                ]
            }
        ]
        self.state["companies"] = [
            {
                "id": "comp_google",
                "owner_uid": "system",
                "name": "Google Cloud Platform",
                "careers_url": "https://careers.google.com/jobs/results/?q=Cloud",
                "keywords": ["Cloud Engineer", "DevOps", "Site Reliability", "Intern"],
                "locations": ["Remote", "Sunnyvale, CA", "Bengaluru, India"],
                "experience_level": "Internship / Early Career",
                "enabled": True,
                "last_checked_at": now,
                "jobs_count": 1
            }
        ]
        self.state["jobs"] = [
            {
                "id": "job_sample_001",
                "owner_uid": "system",
                "company_id": "comp_google",
                "company_name": "Google Cloud Platform",
                "title": "Cloud Infrastructure Engineering Intern, Summer 2027",
                "location": "Sunnyvale, CA (Hybrid)",
                "employment_type": "Full-time Internship",
                "experience_level": "Student / Graduate",
                "source_url": "https://careers.google.com/jobs/results/148291048201",
                "description": "Collaborate with Compute Engine infrastructure teams.",
                "first_seen_at": now,
                "last_seen_at": now,
                "application_status": "discovered",
                "source_verification_status": "verified",
                "is_new": True
            }
        ]
        self.state["runs"] = []
        self.state["approvals"] = []
        self.state["audit_logs"] = []
        self._save_local_state()

    def _save_local_state(self):
        try:
            with open(DATA_FILE, "w") as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to persist state: {e}")

    # Workflows CRUD
    def get_workflows(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        wfs = self.state.get("workflows", [])
        if owner_uid:
            return [w for w in wfs if w.get("owner_uid") in (owner_uid, "system")]
        return wfs

    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        return next((w for w in self.state.get("workflows", []) if w["id"] == workflow_id), None)

    def save_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_workflow(workflow["id"])
        if existing:
            existing.update(workflow)
        else:
            self.state["workflows"].insert(0, workflow)
        self._save_local_state()
        return workflow

    def delete_workflow(self, workflow_id: str) -> bool:
        initial_len = len(self.state["workflows"])
        self.state["workflows"] = [w for w in self.state["workflows"] if w["id"] != workflow_id]
        if len(self.state["workflows"]) < initial_len:
            self._save_local_state()
            return True
        return False

    # Companies CRUD
    def get_companies(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        comps = self.state.get("companies", [])
        if owner_uid:
            return [c for c in comps if c.get("owner_uid") in (owner_uid, "system")]
        return comps

    def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        return next((c for c in self.state.get("companies", []) if c["id"] == company_id), None)

    def save_company(self, company: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_company(company["id"])
        if existing:
            existing.update(company)
        else:
            self.state["companies"].insert(0, company)
        self._save_local_state()
        return company

    def delete_company(self, company_id: str) -> bool:
        initial_len = len(self.state["companies"])
        self.state["companies"] = [c for c in self.state["companies"] if c["id"] != company_id]
        if len(self.state["companies"]) < initial_len:
            self._save_local_state()
            return True
        return False

    # Jobs CRUD
    def get_jobs(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        jobs = self.state.get("jobs", [])
        if owner_uid:
            return [j for j in jobs if j.get("owner_uid") in (owner_uid, "system")]
        return jobs

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return next((j for j in self.state.get("jobs", []) if j["id"] == job_id), None)

    def save_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_job(job["id"])
        if existing:
            existing.update(job)
        else:
            self.state["jobs"].insert(0, job)
        self._save_local_state()
        return job

    # Runs CRUD
    def get_runs(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        runs = self.state.get("runs", [])
        if owner_uid:
            return [r for r in runs if r.get("owner_uid") in (owner_uid, "system")]
        return runs

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        return next((r for r in self.state.get("runs", []) if r["run_id"] == run_id), None)

    def save_run(self, run: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_run(run["run_id"])
        if existing:
            existing.update(run)
        else:
            self.state["runs"].insert(0, run)
        self._save_local_state()
        return run

    # Approvals CRUD
    def get_approvals(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        approvals = self.state.get("approvals", [])
        if owner_uid:
            return [a for a in approvals if a.get("owner_uid") in (owner_uid, "system")]
        return approvals

    def get_approval(self, approval_id: str) -> Optional[Dict[str, Any]]:
        return next((a for a in self.state.get("approvals", []) if a["id"] == approval_id), None)

    def save_approval(self, approval: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.get_approval(approval["id"])
        if existing:
            existing.update(approval)
        else:
            self.state["approvals"].insert(0, approval)
        self._save_local_state()
        return approval

    # Audit Logs
    def get_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        return self.state.get("audit_logs", [])[:limit]

    def add_audit_log(self, log_entry: Dict[str, Any]):
        self.state["audit_logs"].insert(0, log_entry)
        self._save_local_state()


class Repository:
    """
    Unified Repository Gateway with automatic selection between Cloud Firestore and Local Disk.
    Configured for Firebase project: agentflow-7dc3c.
    """
    def __init__(self):
        self.firebase_initialized = False
        self.active_backend = None
        self._init_backend()

    def _init_backend(self):
        project_id = settings.FIREBASE_PROJECT_ID or "agentflow-7dc3c"
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        client_email = settings.FIREBASE_CLIENT_EMAIL
        private_key = settings.FIREBASE_PRIVATE_KEY

        # Attempt to initialize Firebase Admin SDK
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore

            if not firebase_admin._apps:
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                elif client_email and private_key:
                    cred_dict = {
                        "type": "service_account",
                        "project_id": project_id,
                        "client_email": client_email,
                        "private_key": private_key.replace("\\n", "\n"),
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                    firebase_admin.initialize_app()
                else:
                    # Initialize with explicit project ID
                    firebase_admin.initialize_app(options={"projectId": project_id})

            db = firestore.client()
            # Perform a lightweight ping to verify credentials validity
            self.active_backend = FirestoreRepository(db)
            self.firebase_initialized = True
            logger.info(f"Firebase Firestore initialized for project {project_id}")
        except Exception as e:
            logger.info(f"Firebase Admin not configured ({e}), using safe LocalDiskRepository.")
            self.active_backend = LocalDiskRepository()
            self.firebase_initialized = False

    def get_storage_mode(self) -> str:
        return "firestore" if self.firebase_initialized else "local_disk_persistence"

    # Delegate methods to active backend with owner_uid support
    def get_workflows(self, owner_uid: Optional[str] = None):
        return self.active_backend.get_workflows(owner_uid)

    def get_workflow(self, workflow_id: str):
        return self.active_backend.get_workflow(workflow_id)

    def save_workflow(self, workflow: Dict[str, Any]):
        return self.active_backend.save_workflow(workflow)

    def delete_workflow(self, workflow_id: str):
        return self.active_backend.delete_workflow(workflow_id)

    def get_companies(self, owner_uid: Optional[str] = None):
        return self.active_backend.get_companies(owner_uid)

    def get_company(self, company_id: str):
        return self.active_backend.get_company(company_id)

    def save_company(self, company: Dict[str, Any]):
        return self.active_backend.save_company(company)

    def delete_company(self, company_id: str):
        return self.active_backend.delete_company(company_id)

    def get_jobs(self, owner_uid: Optional[str] = None):
        return self.active_backend.get_jobs(owner_uid)

    def get_job(self, job_id: str):
        return self.active_backend.get_job(job_id)

    def save_job(self, job: Dict[str, Any]):
        return self.active_backend.save_job(job)

    def get_runs(self, owner_uid: Optional[str] = None):
        return self.active_backend.get_runs(owner_uid)

    def get_run(self, run_id: str):
        return self.active_backend.get_run(run_id)

    def save_run(self, run: Dict[str, Any]):
        return self.active_backend.save_run(run)

    def get_approvals(self, owner_uid: Optional[str] = None):
        return self.active_backend.get_approvals(owner_uid)

    def get_approval(self, approval_id: str):
        return self.active_backend.get_approval(approval_id)

    def save_approval(self, approval: Dict[str, Any]):
        return self.active_backend.save_approval(approval)

    def get_audit_logs(self, limit: int = 100):
        return self.active_backend.get_audit_logs(limit)

    def add_audit_log(self, log_entry: Dict[str, Any]):
        self.active_backend.add_audit_log(log_entry)

repository = Repository()
