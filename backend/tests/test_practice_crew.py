"""Tests for the Practice Crew."""
import pytest
from meraki_flow.crews.practice_crew.practice_crew import PracticeCrew


class TestPracticeCrew:
    """Test cases for Practice Crew initialization and configuration."""

    def test_crew_initialization(self):
        """Test that Practice Crew can be initialized."""
        crew_instance = PracticeCrew()
        assert crew_instance is not None

    def test_crew_creation(self):
        """Test that Practice Crew can create a crew object."""
        crew_instance = PracticeCrew()
        crew = crew_instance.crew()
        assert crew is not None

    def test_practice_agent_exists(self):
        """Test that practice_agent is defined."""
        crew_instance = PracticeCrew()
        agent = crew_instance.practice_agent()
        assert agent is not None
        assert agent.role is not None

    def test_challenge_agent_exists(self):
        """Test that challenge_agent is defined."""
        crew_instance = PracticeCrew()
        agent = crew_instance.challenge_agent()
        assert agent is not None
        assert agent.role is not None

    def test_tasks_exist(self):
        """Test that all required tasks are defined."""
        crew_instance = PracticeCrew()

        analyze_task = crew_instance.analyze_work_task()
        assert analyze_task is not None

        feedback_task = crew_instance.generate_feedback_task()
        assert feedback_task is not None

        checkin_task = crew_instance.emotional_checkin_task()
        assert checkin_task is not None

        challenge_task = crew_instance.calibrate_challenge_task()
        assert challenge_task is not None

    def test_crew_has_sequential_process(self):
        """Test that the crew uses sequential process."""
        from crewai import Process

        crew_instance = PracticeCrew()
        crew = crew_instance.crew()
        assert crew.process == Process.sequential

    def test_crew_has_two_agents(self):
        """Test that the crew has exactly two agents."""
        crew_instance = PracticeCrew()
        crew = crew_instance.crew()
        assert len(crew.agents) == 2
