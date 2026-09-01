"""
Safe Read-Only Supabase Connection Test Script
Tests environment configuration and performs a read-only SELECT query against Supabase.
"""

import sys
import os

# Add root project directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_client import validate_config, get_supabase_client


def main():
    print("==================================================================")
    print(" Revenue Recovery Decision Engine — Supabase Connection Test")
    print("==================================================================")
    
    try:
        # Step 1: Validate environment variables
        print("[1/3] Validating environment configuration...")
        url, _ = validate_config()
        print(f"      Target Supabase URL: {url}")
        print("      SUPABASE_SERVICE_ROLE_KEY: [CONFIGURED - HIDDEN]")
        
        # Step 2: Initialize Supabase Client
        print("[2/3] Initializing supabase-py client...")
        client = get_supabase_client()
        print("      Client initialized successfully.")
        
        # Step 3: Perform safe read-only SELECT query
        print("[3/3] Executing safe read-only query against 'pipeline_runs'...")
        response = client.table("pipeline_runs").select("*", count="exact").limit(5).execute()
        
        print("      Database Query Response:")
        print(f"      - Status: Connected")
        print(f"      - Table 'pipeline_runs' row count: {response.count}")
        print("==================================================================")
        print(" SUCCESS: Python client authenticated and connected to Supabase!")
        print("==================================================================")
        return 0
        
    except ValueError as e:
        print(f"\n[ERROR] Configuration Error: {e}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] Database Connection Failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
