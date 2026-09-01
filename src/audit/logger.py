"""
Revenue Recovery Decision Engine — Audit Log Writer Module
Append-only structured audit logging to Supabase.
"""

from typing import Dict, List, Any
from supabase import Client
from src.db_client import get_supabase_client


class AuditLogger:
    """
    Writes immutable audit log entries to the Supabase audit_log table.
    """

    BATCH_SIZE = 1000

    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def log_entries(self, entries: List[Dict[str, Any]]) -> None:
        """Batch write structured audit log records."""
        if not entries:
            return
        for i in range(0, len(entries), self.BATCH_SIZE):
            chunk = entries[i:i + self.BATCH_SIZE]
            self.client.table("audit_log").insert(chunk).execute()
