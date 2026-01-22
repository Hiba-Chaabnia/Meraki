"""Tests for the Discovery Crew."""
import pytest
from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew


class TestDiscoveryCrew:
    """Test cases for Discovery Crew initialization and configuration."""

    def test_crew_initialization(self):
        """Test that Discovery Crew can be initialized."""
        crew_instance = DiscoveryCrew()
        assert crew_instance is not None

    def test_crew_creation(self):
        """Test that Discovery Crew can create a crew object."""
        crew_instance = DiscoveryCrew()
        crew = crew_instance.crew()
        assert crew is not None

    def test_agent_exists(self):
        """Test that discovery_agent is defined."""
        crew_instance = DiscoveryCrew()
        agent = crew_instance.discovery_agent()
        assert agent is not None
        assert agent.role is not None

    def test_tasks_exist(self):
        """Test that all required tasks are defined."""
        crew_instance = DiscoveryCrew()

        analyze_task = crew_instance.analyze_profile_task()
        assert analyze_task is not None

        rank_task = crew_instance.rank_hobbies_task()
        assert rank_task is not None

        recommend_task = crew_instance.generate_recommendations_task()
        assert recommend_task is not None

    def test_crew_has_sequential_process(self):
        """Test that the crew uses sequential process."""
        from crewai import Process

        crew_instance = DiscoveryCrew()
        crew = crew_instance.crew()
        assert crew.process == Process.sequential
