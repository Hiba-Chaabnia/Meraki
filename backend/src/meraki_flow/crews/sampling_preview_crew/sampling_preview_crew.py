"""
Sampling Preview Crew - Creates immediate preview content for hobby sampling.

This crew runs when a user lands on the sampling page and generates:
1. A personalized recommendation for which sampling path to try
2. A micro activity they can do immediately
3. Curated YouTube videos for passive discovery
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.tools.youtube_search import YouTubeSearchTool
from meraki_flow.models import SamplingRecommendation, MicroActivity, CuratedVideos

from meraki_flow.opik_metrics import SamplingCompletenessMetric
from meraki_flow.opik_tracing import opik_traced

@CrewBase
@opik_traced(
    name="sampling_preview",
    metric=SamplingCompletenessMetric,
    metadata=lambda i: {
        "input_keys": list(i.keys()),
        "hobby_name": i.get("hobby_name", ""),
        "has_quiz_answers": bool(i.get("quiz_answers")),
    },
)
class SamplingPreviewCrew:
    """Sampling Preview Crew - Creates immediate preview content for hobby sampling."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @agent
    def sampling_preview_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['sampling_preview_agent'],
            verbose=True
        )

    @task
    def recommend_sampling_path_task(self) -> Task:
        return Task(
            config=self.tasks_config['recommend_sampling_path_task'],
            output_pydantic=SamplingRecommendation,
        )

    @task
    def generate_micro_activity_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_micro_activity_task'],
            output_pydantic=MicroActivity,
        )

    @task
    def curate_watch_videos_task(self) -> Task:
        return Task(
            config=self.tasks_config['curate_watch_videos_task'],
            output_pydantic=CuratedVideos,
            tools=[YouTubeSearchTool()],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Sampling Preview Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
