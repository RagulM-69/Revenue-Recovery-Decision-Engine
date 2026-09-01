"""
Phase 3 Script — Generate Synthetic Dataset & Seed Supabase Database
"""

import sys
import os
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data_generator import SyntheticDataGenerator, DataWriter


def main():
    print("==================================================================")
    print(" Phase 3 — Generating Synthetic Dataset & Seeding Supabase")
    print("==================================================================")

    run_id = str(uuid.uuid4())
    print(f"-> Generated Pipeline Run ID: {run_id}")

    config_snapshot = {
        "seed": 42,
        "num_customers": 500,
        "num_payments": 3000,
        "simulation_days": 30,
        "temporal_split_day": 20
    }

    writer = DataWriter()

    try:
        # Step 1: Create pipeline_runs entry in RUNNING state
        print("[1/4] Creating pipeline_runs record in Supabase...")
        writer.create_pipeline_run(run_id, config_snapshot)
        print("      Pipeline run status set to 'RUNNING'.")

        # Step 2: Generate Synthetic Dataset
        print("[2/4] Generating synthetic records (30-day timeline)...")
        generator = SyntheticDataGenerator(
            seed=config_snapshot["seed"],
            num_customers=config_snapshot["num_customers"],
            num_payments=config_snapshot["num_payments"]
        )
        dataset = generator.generate_all(run_id)

        print(f"      - Customers:        {len(dataset['customers'])}")
        print(f"      - Payments:         {len(dataset['payments'])}")
        print(f"      - Payment Attempts: {len(dataset['payment_attempts'])}")
        print(f"      - Failure Events:   {len(dataset['failure_events'])}")

        # Step 3: Write Dataset to Supabase in 1,000-row batches
        print("[3/4] Batch writing records to Supabase...")
        total_events = writer.write_dataset(run_id, dataset)

        # Step 4: Mark Pipeline Run COMPLETED
        print("[4/4] Finalizing pipeline run status...")
        writer.mark_run_completed(run_id, total_events)
        print("      Pipeline run status updated to 'COMPLETED'.")

        print("==================================================================")
        print(" SUCCESS: Phase 3 dataset successfully generated & seeded!")
        print("==================================================================")
        return run_id

    except Exception as e:
        print(f"\n[ERROR] Data generation/seeding failed: {e}")
        writer.mark_run_failed(run_id, str(e))
        sys.exit(1)


if __name__ == "__main__":
    main()
