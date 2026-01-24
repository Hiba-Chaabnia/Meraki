"""
Opik initialization for Meraki.
Call initialize_opik() once at application startup BEFORE any crew kickoff.
"""

import os

import opik
from opik.integrations.crewai import track_crewai


def initialize_opik() -> None:
    """Configure Opik and enable automatic CrewAI tracing."""
    if not os.environ.get("OPIK_API_KEY"):
        print("[Opik] No OPIK_API_KEY found, skipping initialization")
        return

    opik.configure(use_local=False)
    track_crewai(project_name="meraki")
    print("[Opik] Initialized - all CrewAI activity will be traced")
