from typing import Optional, Dict, Any
import os
import logging
from backend.app.core.config import settings

logger = logging.getLogger("agentflow.auth")

try:
    from fastapi import Header, HTTPException, status, Depends
except ImportError:
    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str = "", headers: Optional[Dict[str, str]] = None):
            self.status_code = status_code
            self.detail = detail
            self.headers = headers or {}
            super().__init__(detail)

    class status:
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403

    def Header(default=None):
        return default

    def Depends(dependency=None):
        return dependency

class AuthenticatedUser:
    """Represents a verified caller whose identity is derived from a verified Firebase token."""
    def __init__(self, uid: str, email: str = "", role: str = "Platform Engineer", is_dev_mock: bool = False):
        self.uid = uid
        self.email = email
        self.role = role
        self.is_dev_mock = is_dev_mock

    def to_dict(self) -> Dict[str, Any]:
        return {
            "uid": self.uid,
            "email": self.email,
            "role": self.role,
            "is_dev_mock": self.is_dev_mock
        }

def get_current_user(authorization: Optional[str] = Header(None)) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and validates the Firebase ID token
    from the Authorization: Bearer <token> header.
    Derives the user ID strictly from the verified token.
    Raises HTTP 401 if token is missing, expired, or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required: Missing Authorization header.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization format. Must be 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = parts[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is empty.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Support development/test tokens when ALLOW_DEV_TOKENS is enabled
    if token.startswith("dev_token_") or token.startswith("token_"):
        if settings.ALLOW_DEV_TOKENS:
            dev_uid = token.replace("dev_token_", "").replace("token_", "")
            return AuthenticatedUser(
                uid=dev_uid or "dev_user",
                email=f"{dev_uid}@developer.local",
                role="Platform Engineer",
                is_dev_mock=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Developer bypass tokens are disabled in current environment.",
                headers={"WWW-Authenticate": "Bearer"}
            )

    # Live Firebase ID Token Verification via Firebase Admin SDK
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth

        # Verify ID token cryptographically
        decoded_token = fb_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise ValueError("Token does not contain a valid 'uid' claim.")

        email = decoded_token.get("email", "")
        return AuthenticatedUser(
            uid=uid,
            email=email,
            role="Platform Engineer",
            is_dev_mock=False
        )
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Firebase ID token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )

def enforce_ownership(resource: Optional[Dict[str, Any]], current_user: AuthenticatedUser, resource_type: str = "Resource"):
    """
    Enforces resource isolation by checking that current_user.uid matches the resource owner_uid.
    Returns HTTP 403 Forbidden if the user attempts to access or modify a resource owned by someone else.
    """
    if not resource:
        return

    owner_uid = resource.get("owner_uid")
    if owner_uid and owner_uid != "system" and owner_uid != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Forbidden: You do not have permission to access or modify this {resource_type} (owned by {owner_uid})."
        )
