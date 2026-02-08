"""
Roadmap Crew - Generates personalized multi-phase learning paths.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import GeneratedRoadmap

from meraki_flow.opik_metrics import RoadmapCompletenessMetric
from meraki_flow.opik_tracing import opik_traced

@CrewBase
@opik_traced(
    name="roadmap",
    metric=RoadmapCompletenessMetric,
    metadata=lambda i: {
        "hobby_name": i.get("hobby_name", ""),
        "session_count": i.get("session_count", "0"),
        "days_active": i.get("days_active", "0"),
        "has_goals": bool(i.get("user_goals")),
    },
)
class RoadmapCrew:
    """Roadmap Crew - Designs structured learning roadmaps."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def roadmap_designer(self) -> Agent:
        return Agent(
            config=self.agents_config['roadmap_designer'],
            verbose=True,
        )

    @task
    def generate_roadmap_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_roadmap_task'],
            output_pydantic=GeneratedRoadmap,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Roadmap Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
