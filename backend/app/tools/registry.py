import re
import ipaddress
import urllib.parse
from typing import Dict, Any, List

TOOL_REGISTRY: Dict[str, Dict[str, Any]] = {
    "web_check": {
        "name": "web_check",
        "description": "Retrieves public information and structured postings from supported career URLs.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"url": "str", "keywords": "List[str]"},
        "output_schema": {"status": "str", "items_found": "int", "postings": "List[dict]"}
    },
    "compare_jobs": {
        "name": "compare_jobs",
        "description": "Compares freshly discovered postings against stored repository using URL & title fingerprinting.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"discovered_jobs": "List[dict]", "target_company": "str"},
        "output_schema": {"new_entries": "List[dict]", "existing_matches": "int"}
    },
    "save_jobs": {
        "name": "save_jobs",
        "description": "Persists validated new and updated job postings to persistent storage.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"jobs_to_save": "List[dict]"},
        "output_schema": {"inserted_count": "int", "updated_count": "int"}
    },
    "prepare_notification": {
        "name": "prepare_notification",
        "description": "Synthesizes an executive digest and summary email draft for review.",
        "default_approval": True,
        "is_sensitive": True,
        "input_schema": {"recipient": "str", "subject": "str", "new_jobs": "List[dict]"},
        "output_schema": {"draft_id": "str", "body_preview": "str", "requires_approval": "bool"}
    },
    "send_notification": {
        "name": "send_notification",
        "description": "Dispatches finalized notification email to verified recipient.",
        "default_approval": True,
        "is_sensitive": True,
        "input_schema": {"email": "str", "content": "str"},
        "output_schema": {"message_id": "str", "status": "str"}
    },
    "get_workflow_status": {
        "name": "get_workflow_status",
        "description": "Fetches operational health and status of an authorized workflow pipeline.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"workflow_id": "str"},
        "output_schema": {"workflow_id": "str", "status": "str"}
    },
    "record_observation": {
        "name": "record_observation",
        "description": "Records telemetry and state transition validation in the audit ledger.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"step_id": "str", "observation": "str"},
        "output_schema": {"audit_id": "str", "recorded": "bool"}
    },
    "complete_workflow": {
        "name": "complete_workflow",
        "description": "Finalizes the execution run and compiles the completion report.",
        "default_approval": False,
        "is_sensitive": False,
        "input_schema": {"run_id": "str", "summary": "str"},
        "output_schema": {"run_id": "str", "completed": "bool"}
    }
}

BLOCKED_HOSTNAMES = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "metadata.google.internal", "169.254.169.254"
}

def is_valid_tool(tool_name: str) -> bool:
    return tool_name in TOOL_REGISTRY

def is_sensitive_tool(tool_name: str) -> bool:
    return TOOL_REGISTRY.get(tool_name, {}).get("is_sensitive", False)

def get_tool_metadata(tool_name: str) -> Dict[str, Any]:
    return TOOL_REGISTRY.get(tool_name, {})

def validate_target_url(url: str) -> bool:
    """
    SSRF Protection: Validates that a target URL is safe to check:
    - Must be http or https
    - Cannot target loopback, link-local, private IP ranges or cloud metadata endpoints
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
            
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False
            
        if hostname in BLOCKED_HOSTNAMES or hostname.endswith(".internal") or hostname.endswith(".local"):
            return False
            
        # Check for private or loopback IP literals
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            # Not an IP literal, it's a hostname
            pass
            
        return True
    except Exception:
        return False
