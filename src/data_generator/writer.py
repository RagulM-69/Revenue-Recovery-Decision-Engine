"""
Revenue Recovery Decision Engine — Data Writer Module
Batch writes synthetic records to Supabase with chunked upserts and run status management.
"""

from typing import Dict, List, Any
from supabase import Client
from src.db_client import get_supabase_client


class DataWriter:
    """
    Handles writing generated records to Supabase tables in batches of 1,000 rows.
    Manages pipeline_runs execution state.
    """

    BATCH_SIZE = 1000

    def __init__(self, client: Client = None):
        self.client = client or get_supabase_client()

    def create_pipeline_run(self, run_id: str, config_snapshot: Dict[str, Any]) -> str:
        """Create a new pipeline run entry in RUNNING status."""
        data = {
            "run_id": run_id,
            "status": "RUNNING",
            "config_snapshot": config_snapshot,
            "total_events_processed": 0
        }
        self.client.table("pipeline_runs").insert(data).execute()
        return run_id

    def mark_run_completed(self, run_id: str, total_events: int) -> None:
        """Update pipeline run status to COMPLETED."""
        self.client.table("pipeline_runs").update({
            "status": "COMPLETED",
            "completed_at": "now()",
            "total_events_processed": total_events
        }).eq("run_id", run_id).execute()

    def mark_run_failed(self, run_id: str, error_message: str) -> None:
        """Update pipeline run status to FAILED."""
        self.client.table("pipeline_runs").update({
            "status": "FAILED",
            "error_message": error_message
        }).eq("run_id", run_id).execute()

    def write_dataset(self, run_id: str, dataset: Dict[str, List[Dict[str, Any]]]) -> int:
        """
        Batch write dataset to Supabase in strict relational order:
        customers -> payments -> payment_attempts -> failure_events
        """
        try:
            # 1. Customers
            self._chunked_upsert("customers", dataset["customers"])

            # 2. Payments
            self._chunked_upsert("payments", dataset["payments"])

            # 3. Payment Attempts
            self._chunked_upsert("payment_attempts", dataset["payment_attempts"])

            # 4. Failure Events
            self._chunked_upsert("failure_events", dataset["failure_events"])

            total_events = len(dataset["failure_events"])
            return total_events
        except Exception as e:
            self.mark_run_failed(run_id, str(e))
            raise e

    def _chunked_upsert(self, table_name: str, records: List[Dict[str, Any]]) -> None:
        """Upsert records in batches of BATCH_SIZE."""
        for i in range(0, len(records), self.BATCH_SIZE):
            chunk = records[i:i + self.BATCH_SIZE]
            self.client.table(table_name).upsert(chunk).execute()
