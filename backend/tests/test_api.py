import unittest
from backend.app.tools.registry import is_valid_tool, validate_target_url, is_sensitive_tool
from backend.app.agents.orchestrator import AgentOrchestrator
from backend.app.database.repository import LocalDiskRepository
from backend.app.core.auth import AuthenticatedUser, enforce_ownership, get_current_user, HTTPException

class TestAgentFlowCore(unittest.TestCase):
    def test_tool_registry_contains_essential_tools(self):
        expected_tools = [
            "web_check",
            "compare_jobs",
            "save_jobs",
            "prepare_notification",
            "send_notification",
            "complete_workflow"
        ]
        for tool in expected_tools:
            self.assertTrue(is_valid_tool(tool), f"Tool {tool} should be in registry")

    def test_tool_registry_rejects_arbitrary_tools(self):
        self.assertFalse(is_valid_tool("execute_arbitrary_shell"))
        self.assertFalse(is_valid_tool("format_hard_drive"))
        self.assertFalse(is_valid_tool("undefined_agent_action"))

    def test_ssrf_validator_blocks_private_and_metadata_addresses(self):
        # Should block loopback and cloud metadata
        self.assertFalse(validate_target_url("http://127.0.0.1:8080/admin"))
        self.assertFalse(validate_target_url("http://localhost:3000/api"))
        self.assertFalse(validate_target_url("http://169.254.169.254/latest/meta-data/"))
        self.assertFalse(validate_target_url("http://10.0.0.1/secrets"))
        self.assertFalse(validate_target_url("http://192.168.1.1/router"))
        self.assertFalse(validate_target_url("ftp://careers.example.com"))

        # Should allow legitimate public HTTP/HTTPS URLs
        self.assertTrue(validate_target_url("https://careers.google.com/jobs"))
        self.assertTrue(validate_target_url("https://careers.datadoghq.com/"))
        self.assertTrue(validate_target_url("https://www.hashicorp.com/jobs"))

    def test_orchestrator_detects_dependency_cycles(self):
        orchestrator = AgentOrchestrator(gemini_api_key="")
        
        # Cyclic dependency: step_1 -> step_2 -> step_1
        cyclic_steps = [
            {"id": "step_1", "name": "Step 1", "tool": "web_check", "description": "", "requires_approval": False, "depends_on": ["step_2"]},
            {"id": "step_2", "name": "Step 2", "tool": "compare_jobs", "description": "", "requires_approval": False, "depends_on": ["step_1"]},
        ]
        with self.assertRaises(ValueError):
            orchestrator.validate_plan(cyclic_steps)

    def test_orchestrator_enforces_approval_on_sensitive_tools(self):
        orchestrator = AgentOrchestrator(gemini_api_key="")
        
        # AI generates notification step with requires_approval: False
        steps = [
            {"id": "s1", "name": "Check", "tool": "web_check", "description": "", "requires_approval": False, "depends_on": []},
            {"id": "s2", "name": "Notify", "tool": "prepare_notification", "description": "", "requires_approval": False, "depends_on": ["s1"]},
        ]
        orchestrator.validate_plan(steps)
        
        # Invariant: backend validator must FORCE requires_approval to True
        self.assertTrue(steps[1]["requires_approval"])

    def test_auth_requires_bearer_token(self):
        # Missing header should raise HTTP 401
        with self.assertRaises(HTTPException) as ctx:
            get_current_user(None)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("Authentication required", ctx.exception.detail)

        # Invalid prefix should raise HTTP 401
        with self.assertRaises(HTTPException) as ctx:
            get_current_user("Basic dXNlcjpwYXNz")
        self.assertEqual(ctx.exception.status_code, 401)

    def test_auth_parses_dev_token_correctly(self):
        user = get_current_user("Bearer dev_token_prof_gaikwad")
        self.assertEqual(user.uid, "prof_gaikwad")
        self.assertTrue(user.is_dev_mock)

    def test_enforce_ownership_allows_owner(self):
        user = AuthenticatedUser(uid="user_123", email="user@example.com")
        resource = {"id": "wf_1", "owner_uid": "user_123", "name": "My Workflow"}
        # Should execute cleanly without raising
        enforce_ownership(resource, user, "Workflow")

    def test_enforce_ownership_blocks_other_user_with_403(self):
        user_a = AuthenticatedUser(uid="user_alice", email="alice@example.com")
        resource_b = {"id": "wf_b", "owner_uid": "user_bob", "name": "Bob's Pipeline"}
        
        with self.assertRaises(HTTPException) as ctx:
            enforce_ownership(resource_b, user_a, "Workflow")
        self.assertEqual(ctx.exception.status_code, 403)
        self.assertIn("Forbidden", ctx.exception.detail)

    def test_repository_crud_and_deduplication(self):
        repo = LocalDiskRepository()
        initial_jobs_count = len(repo.get_jobs())
        
        test_job = {
            "id": "job_unit_test_001",
            "owner_uid": "user_alice",
            "company_id": "comp_test",
            "company_name": "Test Company",
            "title": "Cloud Engineer",
            "location": "Remote",
            "source_url": "https://example.com/careers/1",
            "first_seen_at": "2026-10-29T00:00:00Z",
            "last_seen_at": "2026-10-29T00:00:00Z",
            "application_status": "discovered",
            "source_verification_status": "verified",
            "is_new": True
        }
        repo.save_job(test_job)
        self.assertEqual(len(repo.get_jobs()), initial_jobs_count + 1)
        
        # Scoped retrieval by owner_uid
        scoped_jobs = repo.get_jobs(owner_uid="user_alice")
        self.assertTrue(any(j["id"] == "job_unit_test_001" for j in scoped_jobs))
        
        # Retrieve saved job
        fetched = repo.get_job("job_unit_test_001")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["title"], "Cloud Engineer")

if __name__ == "__main__":
    unittest.main()
