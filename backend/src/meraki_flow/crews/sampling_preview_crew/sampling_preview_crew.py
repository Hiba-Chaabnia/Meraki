"""
Sampling Preview Crew - Creates immediate preview content for hobby sampling.

This crew runs when a user lands on the sampling page and generates:
1. A personalized recommendation for which sampling path to try
2. A micro activity they can do immediately
3. Curated YouTube videos for passive discovery
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.tools.youtube_search import YouTubeSearchTool
from meraki_flow.models import SamplingRecommendation, MicroActivity, CuratedVideos

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class SamplingPreviewCrew:
    """Sampling Preview Crew - Creates immediate preview content for hobby sampling."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "crew": "sampling_preview",
                        "input_keys": list(inputs.keys()) if inputs else [],
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "has_quiz_answers": bool(inputs.get("quiz_answers")) if inputs else False,
                    },
                    tags=["sampling-preview-crew"]
                )
            except Exception:
                pass  # Opik tracing not active, skip
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata and scoring to Opik after crew execution."""
        if OPIK_AVAILABLE:
            try:
                raw = output.raw if hasattr(output, 'raw') else str(output)
                from meraki_flow.opik_metrics import SamplingCompletenessMetric
                result = SamplingCompletenessMetric().score(output=raw)
                opik_context.update_current_trace(
                    metadata={"crew_completed": "sampling_preview", "result_type": type(output).__name__},
                    feedback_scores=[{"name": result.name, "value": result.value, "reason": result.reason}],
                )
            except Exception as e:
                print(f"[Opik] sampling_preview scoring failed (non-fatal): {e}")
        return output

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
