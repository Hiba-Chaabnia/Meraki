"""
Practice Feedback Crew - Provides warm, specific AI feedback on practice sessions.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import PracticeFeedbackOutput

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class PracticeFeedbackCrew:
    """Practice Feedback Crew - Analyzes practice sessions and provides encouragement."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "crew": "practice_feedback",
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "session_type": inputs.get("session_type", "") if inputs else "",
                        "duration_minutes": inputs.get("duration", 0) if inputs else 0,
                        "has_image": bool(inputs.get("image_url")) if inputs else False,
                        "mood": inputs.get("mood", "") if inputs else "",
                    },
                    tags=["practice-feedback-crew"]
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
                from meraki_flow.opik_metrics import FeedbackSpecificityMetric
                result = FeedbackSpecificityMetric().score(output=raw)
                opik_context.update_current_trace(
                    metadata={"crew_completed": "practice_feedback", "result_type": type(output).__name__},
                    feedback_scores=[{"name": result.name, "value": result.value, "reason": result.reason}],
                )
            except Exception as e:
                print(f"[Opik] practice_feedback scoring failed (non-fatal): {e}")
        return output

    @agent
    def practice_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['practice_analyst'],
            verbose=True,
        )

    @task
    def analyze_session_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_session_task'],
            output_pydantic=PracticeFeedbackOutput,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Practice Feedback Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
