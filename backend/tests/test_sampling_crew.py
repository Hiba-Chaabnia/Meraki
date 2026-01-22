"""Tests for the Sampling Crew."""
import pytest
from meraki_flow.crews.sampling_crew.sampling_crew import SamplingCrew


class TestSamplingCrew:
    """Test cases for Sampling Crew initialization and configuration."""

    def test_crew_initialization(self):
        """Test that Sampling Crew can be initialized."""
        crew_instance = SamplingCrew()
        assert crew_instance is not None

    def test_crew_creation(self):
        """Test that Sampling Crew can create a crew object."""
        crew_instance = SamplingCrew()
        crew = crew_instance.crew()
        assert crew is not None

    def test_agent_exists(self):
        """Test that sampling_agent is defined."""
        crew_instance = SamplingCrew()
        agent = crew_instance.sampling_agent()
        assert agent is not None
        assert agent.role is not None

    def test_tasks_exist(self):
        """Test that all required tasks are defined."""
        crew_instance = SamplingCrew()

        home_project_task = crew_instance.generate_home_project_task()
        assert home_project_task is not None

        local_task = crew_instance.find_local_experiences_task()
        assert local_task is not None

        learning_task = crew_instance.curate_learning_path_task()
        assert learning_task is not None

        compile_task = crew_instance.compile_sampling_options_task()
        assert compile_task is not None

    def test_crew_has_sequential_process(self):
        """Test that the crew uses sequential process."""
        from crewai import Process

        crew_instance = SamplingCrew()
        crew = crew_instance.crew()
        assert crew.process == Process.sequential
