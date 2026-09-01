"""
Revenue Recovery Decision Engine — Supabase Database Helper Module
Provides a secure, validated Supabase client interface using the official supabase-py SDK.
"""

import os
import re
from typing import Tuple
from dotenv import load_dotenv
from supabase import create_client, Client


def load_environment() -> None:
    """Load environment variables from local .env file if available."""
    load_dotenv()


def validate_config() -> Tuple[str, str]:
    """
    Validate presence and format of required Supabase environment variables.
    
    Returns:
        Tuple[str, str]: (supabase_url, service_role_key)
        
    Raises:
        ValueError: If environment variables are missing or invalid placeholders.
    """
    load_environment()
    
    url = os.environ.get("SUPABASE_URL", "").strip()
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    
    if not url:
        raise ValueError("Missing required environment variable: SUPABASE_URL")
        
    if not key or "your_supabase_service_role_key_here" in key or "YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE" in key:
        raise ValueError("Missing or unconfigured environment variable: SUPABASE_SERVICE_ROLE_KEY")
        
    # Regex validation for Supabase project URL format
    url_pattern = r"^https://[a-z0-9]+\.supabase\.co$"
    if not re.match(url_pattern, url):
        raise ValueError(f"Invalid SUPABASE_URL format. Expected 'https://<project-ref>.supabase.co', got format: '{url}'")
        
    return url, key


def get_supabase_client() -> Client:
    """
    Initialize and return the official Supabase Python client using service-role key.
    
    Returns:
        Client: Authenticated Supabase client instance.
    """
    url, key = validate_config()
    client: Client = create_client(url, key)
    return client
