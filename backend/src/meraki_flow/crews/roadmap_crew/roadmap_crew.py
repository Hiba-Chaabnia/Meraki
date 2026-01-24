"""
Roadmap Crew - Generates personalized multi-phase learning paths.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import GeneratedRoadmap

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class RoadmapCrew:
    """Roadmap Crew - Designs structured learning roadmaps."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "crew": "roadmap",
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "session_count": inputs.get("session_count", "0") if inputs else "0",
                        "days_active": inputs.get("days_active", "0") if inputs else "0",
                        "has_goals": bool(inputs.get("user_goals")) if inputs else False,
                    },
                    tags=["roadmap-crew"]
                )
            except Exception:
                pass
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata and scoring to Opik after crew execution."""
        if OPIK_AVAILABLE:
            try:
                raw = output.raw if hasattr(output, 'raw') else str(output)
                from meraki_flow.opik_metrics import RoadmapCompletenessMetric
                result = RoadmapCompletenessMetric().score(output=raw)
                opik_context.update_current_trace(
                    metadata={"crew_completed": "roadmap", "result_type": type(output).__name__},
                    feedback_scores=[{"name": result.name, "value": result.value, "reason": result.reason}],
                )
            except Exception as e:
                print(f"[Opik] roadmap scoring failed (non-fatal): {e}")
        return output

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
