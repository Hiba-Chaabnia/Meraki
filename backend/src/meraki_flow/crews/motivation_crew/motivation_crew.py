"""
Motivation Crew - Assesses engagement and generates motivation nudges.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import MotivationNudge

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class MotivationCrew:
    """Motivation Crew - Creates personalized motivation nudges."""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik and stash inputs for scoring."""
        self._scoring_inputs = inputs or {}
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={
                        "crew": "motivation",
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "days_since_last_session": inputs.get("days_since_last_session", "0") if inputs else "0",
                        "challenge_skip_rate": inputs.get("challenge_skip_rate", "0") if inputs else "0",
                        "current_streak": inputs.get("current_streak", "0") if inputs else "0",
                    },
                    tags=["motivation-crew"]
                )
            except Exception:
                pass
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata and scoring to Opik after crew execution."""
        if OPIK_AVAILABLE:
            try:
                import re
                raw = output.raw if hasattr(output, 'raw') else str(output)
                # Extract urgency from output JSON
                urgency_match = re.search(r'"urgency"\s*:\s*"(\w+)"', raw)
                urgency = urgency_match.group(1) if urgency_match else "check_in"
                days = int(getattr(self, '_scoring_inputs', {}).get("days_since_last_session", 3))
                from meraki_flow.opik_metrics import NudgeUrgencyCalibrationMetric
                result = NudgeUrgencyCalibrationMetric().score(urgency=urgency, days_since_last_session=days)
                opik_context.update_current_trace(
                    metadata={"crew_completed": "motivation", "result_type": type(output).__name__},
                    feedback_scores=[{"name": result.name, "value": result.value, "reason": result.reason}],
                )
            except Exception as e:
                print(f"[Opik] motivation scoring failed (non-fatal): {e}")
        return output

    @agent
    def motivation_specialist(self) -> Agent:
        return Agent(
            config=self.agents_config['motivation_specialist'],
            verbose=True,
        )

    @task
    def assess_and_intervene_task(self) -> Task:
        return Task(
            config=self.tasks_config['assess_and_intervene_task'],
            output_pydantic=MotivationNudge,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Motivation Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
