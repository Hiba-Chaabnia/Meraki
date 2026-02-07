"""
Local Experiences Crew - Finds local classes, workshops, and meetups for hobby exploration.

This crew runs when a user clicks "Find Locally" and provides their location.
It uses Google Places and web search to find beginner-friendly local opportunities.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.tools.google_places import GooglePlacesTool
from meraki_flow.tools.web_search import WebSearchTool
from meraki_flow.models import LocalExperiencesOutput

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class LocalExperiencesCrew:
    """Local Experiences Crew - Finds local opportunities for hobby exploration."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "crew": "local_experiences",
                        "input_keys": list(inputs.keys()) if inputs else [],
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "location": inputs.get("location", "") if inputs else "",
                    },
                    tags=["local-experiences-crew"]
                )
            except Exception:
                pass  # Opik tracing not active, skip
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata to Opik after crew execution."""
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "result_type": type(output).__name__,
                        "crew_completed": "local_experiences",
                    }
                )
            except Exception:
                pass  # Opik tracing not active, skip
        return output

    @agent
    def local_experiences_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['local_experiences_agent'],
            tools=[GooglePlacesTool(), WebSearchTool()],
            verbose=True
        )

    @task
    def find_local_experiences_task(self) -> Task:
        return Task(
            config=self.tasks_config['find_local_experiences_task'],
            output_pydantic=LocalExperiencesOutput,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Local Experiences Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
