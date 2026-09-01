"""
Revenue Recovery Decision Engine — Outcome & Decision Writer Module
Batch writes decisions, simulated attempts, and final outcomes to Supabase.
"""

from typing import Dict, List, Any
from supabase import Client
from src.db_client import get_supabase_client


class OutcomeWriter:
    """
    Writes decisions, recovery_attempts, and recovery_outcomes to Supabase.
    """

    BATCH_SIZE = 1000

    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def write_results(
        self,
        decisions: List[Dict[str, Any]],
        recovery_attempts: List[Dict[str, Any]],
        recovery_outcomes: List[Dict[str, Any]]
    ) -> None:
        """Batch write pipeline outputs in relational sequence."""
        if decisions:
            self._chunked_upsert("recovery_decisions", decisions)

        if recovery_attempts:
            self._chunked_upsert("recovery_attempts", recovery_attempts)

        if recovery_outcomes:
            self._chunked_upsert("recovery_outcomes", recovery_outcomes)

    def _chunked_upsert(self, table_name: str, records: List[Dict[str, Any]]) -> None:
        for i in range(0, len(records), self.BATCH_SIZE):
            chunk = records[i:i + self.BATCH_SIZE]
            self.client.table(table_name).upsert(chunk).execute()
