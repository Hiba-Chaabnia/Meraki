"""
Opik tracking module for Meraki Flow.

This module initializes Opik observability for all CrewAI activity,
enabling comprehensive tracing, monitoring, and evaluation of agent interactions.
"""

import opik
from opik.integrations.crewai import track_crewai

# Project name for all Meraki traces
PROJECT_NAME = "meraki-hackathon"


def initialize_opik(use_local: bool = False):
    """
    Initialize Opik tracking for all CrewAI activity.

    Args:
        use_local: If True, use local Opik server. If False, use Comet cloud.
    """
    opik.configure(use_local=use_local)
    track_crewai(project_name=PROJECT_NAME)
    print(f"Opik tracking initialized for project: {PROJECT_NAME}")


def get_project_name() -> str:
    """Return the current Opik project name."""
    return PROJECT_NAME
