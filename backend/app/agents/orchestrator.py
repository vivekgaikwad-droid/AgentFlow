import os
import json
import logging
from typing import Dict, Any, List, Optional, Set
from backend.app.tools.registry import (
    TOOL_REGISTRY, is_valid_tool, is_sensitive_tool, validate_target_url
)

logger = logging.getLogger("agentflow.orchestrator")

class AgentOrchestrator:
    """
    AgentFlow Core Execution Orchestrator.
    Enforces the explicit UNDERSTAND -> PLAN -> ACT -> OBSERVE -> APPROVE -> COMPLETE lifecycle.
    """
    
    def __init__(self, gemini_api_key: Optional[str] = None):
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        
    def generate_plan(self, goal: str, preferences: Optional[dict] = None) -> Dict[str, Any]:
        """
        Translates natural language user goal into a validated DAG plan.
        Discloses whether plan was generated via Gemini or fallback engine.
        """
        if self.api_key:
            try:
                from google import genai
                from google.genai import types
                
                client = genai.Client(api_key=self.api_key)
                allowed_tools = "\n".join([f"- {k}: {v['description']}" for k, v in TOOL_REGISTRY.items()])
                
                prompt = f"""
                You are the AgentFlow AI Task Planner. Convert this user goal into a structured multi-step execution plan using ONLY registered backend tools.
                Goal: "{goal}"
                Preferences: {json.dumps(preferences or {})}
                
                Allowed Tools:
                {allowed_tools}
                
                Rules:
                - Use only registered tools.
                - Steps requiring external side effects or notifications MUST set requires_approval: true.
                - Define valid step dependencies via "depends_on" referencing earlier step IDs without cycles.
                - Return JSON with workflow_name, goal, and steps.
                """
                
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                plan_data = json.loads(response.text)
                self.validate_plan(plan_data.get("steps", []))
                
                return {
                    "plan": plan_data,
                    "source": f"gemini ({self.model_name})",
                    "validated": True
                }
            except Exception as e:
                logger.warning(f"Gemini planning error, using deterministic fallback: {e}")
                
        # Deterministic fallback engine with clear disclosure
        fallback_plan = self._generate_fallback_plan(goal)
        self.validate_plan(fallback_plan.get("steps", []))
        return {
            "plan": fallback_plan,
            "source": "deterministic_fallback_engine",
            "fallback_reason": "Gemini API key not configured or call timed out",
            "validated": True
        }

    def validate_plan(self, steps: List[dict]) -> bool:
        """
        Strictly validates that AI generated steps conform to tool registry constraints,
        contain no dependency cycles, and do not remove required approval gates.
        """
        step_ids = set()
        adj_list: Dict[str, List[str]] = {}
        
        for step in steps:
            step_id = step.get("id")
            if not step_id:
                raise ValueError("Every step must have an 'id'")
            if step_id in step_ids:
                raise ValueError(f"Duplicate step id detected: {step_id}")
            step_ids.add(step_id)
            
            tool_name = step.get("tool")
            if not is_valid_tool(tool_name):
                raise ValueError(f"AI attempted to invoke unregistered tool: {tool_name}")
                
            # Backend Invariant: Sensitive tools MUST require approval regardless of AI output
            if is_sensitive_tool(tool_name):
                step["requires_approval"] = True
                
            adj_list[step_id] = step.get("depends_on", [])

        # Validate dependency references exist
        for step_id, deps in adj_list.items():
            for dep in deps:
                if dep not in step_ids:
                    raise ValueError(f"Step {step_id} depends on nonexistent step '{dep}'")

        # Detect cycles in the step DAG using DFS
        visited: Dict[str, int] = {}  # 0 = unvisited, 1 = visiting (in stack), 2 = visited
        for sid in step_ids:
            visited[sid] = 0

        def has_cycle(node: str) -> bool:
            visited[node] = 1
            for neighbor in adj_list.get(node, []):
                if visited.get(neighbor) == 1:
                    return True
                if visited.get(neighbor) == 0 and has_cycle(neighbor):
                    return True
            visited[node] = 2
            return False

        for sid in step_ids:
            if visited[sid] == 0:
                if has_cycle(sid):
                    raise ValueError(f"Dependency cycle detected in plan involving step {sid}")

        return True

    def _generate_fallback_plan(self, goal: str) -> Dict[str, Any]:
        is_job_goal = any(w in goal.lower() for w in ["job", "intern", "career", "devops", "cloud"])
        return {
            "workflow_name": "Automated Cloud Job Monitor" if is_job_goal else "Autonomous Target Automation",
            "goal": goal,
            "steps": [
                {
                    "id": "step_1",
                    "name": "Check target careers pages",
                    "tool": "web_check",
                    "description": "Inspect configured career portals for matching listings",
                    "requires_approval": False,
                    "depends_on": []
                },
                {
                    "id": "step_2",
                    "name": "Deduplicate & compare records",
                    "tool": "compare_jobs",
                    "description": "Compare against stored jobs database via URL fingerprinting",
                    "requires_approval": False,
                    "depends_on": ["step_1"]
                },
                {
                    "id": "step_3",
                    "name": "Save validated discoveries",
                    "tool": "save_jobs",
                    "description": "Insert new verified records to persistent store",
                    "requires_approval": False,
                    "depends_on": ["step_2"]
                },
                {
                    "id": "step_4",
                    "name": "Prepare notification digest",
                    "tool": "prepare_notification",
                    "description": "Draft digest email for human review before sending",
                    "requires_approval": True,
                    "depends_on": ["step_3"]
                },
                {
                    "id": "step_5",
                    "name": "Complete workflow run",
                    "tool": "complete_workflow",
                    "description": "Finalize execution state and record observation metrics",
                    "requires_approval": False,
                    "depends_on": ["step_4"]
                }
            ]
        }
