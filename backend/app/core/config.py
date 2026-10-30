import os
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "AgentFlow Multi-Agent AI Automation Platform"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api"
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        
        # Google Gemini Model Configuration
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        
        # Firebase Cloud Configuration
        FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "agentflow-7dc3c")
        FIREBASE_CREDENTIALS_PATH: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_PATH", None)
        FIREBASE_CLIENT_EMAIL: Optional[str] = os.getenv("FIREBASE_CLIENT_EMAIL", None)
        FIREBASE_PRIVATE_KEY: Optional[str] = os.getenv("FIREBASE_PRIVATE_KEY", None)
        
        # Auth configuration
        ALLOW_DEV_TOKENS: bool = os.getenv("ALLOW_DEV_TOKENS", "true").lower() in ("true", "1", "yes")
        
        # Notification Settings
        ALERT_EMAIL_RECIPIENT: str = os.getenv("ALERT_EMAIL_RECIPIENT", "vivek.gaikwad@mitwpu.edu.in")
        SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
        SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)

        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://0.0.0.0:3000"
        ]
        
        model_config = {
    "env_file": ".env",
    "case_sensitive": True,
    "extra": "ignore",
}
except ImportError:
    class Settings:
        PROJECT_NAME: str = "AgentFlow Multi-Agent AI Automation Platform"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api"
        ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        
        # Google Gemini Model Configuration
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        
        # Firebase Cloud Configuration
        FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "agentflow-7dc3c")
        FIREBASE_CREDENTIALS_PATH: Optional[str] = os.getenv("FIREBASE_CREDENTIALS_PATH", None)
        FIREBASE_CLIENT_EMAIL: Optional[str] = os.getenv("FIREBASE_CLIENT_EMAIL", None)
        FIREBASE_PRIVATE_KEY: Optional[str] = os.getenv("FIREBASE_PRIVATE_KEY", None)
        
        # Auth configuration
        ALLOW_DEV_TOKENS: bool = os.getenv("ALLOW_DEV_TOKENS", "true").lower() in ("true", "1", "yes")
        
        # Notification Settings
        ALERT_EMAIL_RECIPIENT: str = os.getenv("ALERT_EMAIL_RECIPIENT", "vivek.gaikwad@mitwpu.edu.in")
        SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", None)
        SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
        SMTP_USER: Optional[str] = os.getenv("SMTP_USER", None)
        SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)

        CORS_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://0.0.0.0:3000"
        ]

settings = Settings()
