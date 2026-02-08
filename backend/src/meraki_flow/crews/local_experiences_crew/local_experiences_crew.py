"""
Local Experiences Crew - Finds local classes, workshops, and meetups for hobby exploration.

This crew runs when a user clicks "Find Locally" and provides their location.
It uses Google Places and web search to find beginner-friendly local opportunities.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.tools.google_places import GooglePlacesTool
from meraki_flow.tools.web_search import WebSearchTool
from meraki_flow.models import LocalExperiencesOutput

from meraki_flow.opik_metrics import LocalExperiencesCompletenessMetric
from meraki_flow.opik_tracing import opik_traced

@CrewBase
@opik_traced(
    name="local_experiences",
    metric=LocalExperiencesCompletenessMetric,
    metadata=lambda i: {
        "input_keys": list(i.keys()),
        "hobby_name": i.get("hobby_name", ""),
        "location": i.get("location", ""),
    },
)
class LocalExperiencesCrew:
    """Local Experiences Crew - Finds local opportunities for hobby exploration."""

    agents: List[BaseAgent]
    tasks: List[Task]

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
