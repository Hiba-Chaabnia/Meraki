"""Tests for the Retention Crew."""
import pytest
from meraki_flow.crews.retention_crew.retention_crew import RetentionCrew


class TestRetentionCrew:
    """Test cases for Retention Crew initialization and configuration."""

    def test_crew_initialization(self):
        """Test that Retention Crew can be initialized."""
        crew_instance = RetentionCrew()
        assert crew_instance is not None

    def test_crew_creation(self):
        """Test that Retention Crew can create a crew object."""
        crew_instance = RetentionCrew()
        crew = crew_instance.crew()
        assert crew is not None

    def test_motivation_agent_exists(self):
        """Test that motivation_agent is defined."""
        crew_instance = RetentionCrew()
        agent = crew_instance.motivation_agent()
        assert agent is not None
        assert agent.role is not None

    def test_stuck_helper_exists(self):
        """Test that stuck_helper is defined."""
        crew_instance = RetentionCrew()
        agent = crew_instance.stuck_helper()
        assert agent is not None
        assert agent.role is not None

    def test_tasks_exist(self):
        """Test that all required tasks are defined."""
        crew_instance = RetentionCrew()

        stall_task = crew_instance.detect_stall_task()
        assert stall_task is not None

        intervention_task = crew_instance.select_intervention_task()
        assert intervention_task is not None

        pattern_task = crew_instance.detect_pattern_task()
        assert pattern_task is not None

        unstick_task = crew_instance.generate_unsticking_suggestion_task()
        assert unstick_task is not None

    def test_crew_has_sequential_process(self):
        """Test that the crew uses sequential process."""
        from crewai import Process

        crew_instance = RetentionCrew()
        crew = crew_instance.crew()
        assert crew.process == Process.sequential

    def test_crew_has_two_agents(self):
        """Test that the crew has exactly two agents."""
        crew_instance = RetentionCrew()
        crew = crew_instance.crew()
        assert len(crew.agents) == 2
