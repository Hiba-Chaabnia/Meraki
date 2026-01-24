"""
Challenge Generation Crew - Creates personalized creative challenges.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import GeneratedChallenge

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


@CrewBase
class ChallengeGenerationCrew:
    """Challenge Generation Crew - Designs calibrated creative challenges."""

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
                        "crew": "challenge_generation",
                        "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                        "session_count": inputs.get("session_count", "0") if inputs else "0",
                        "days_active": inputs.get("days_active", "0") if inputs else "0",
                        "mood_trend": inputs.get("last_mood_trend", "") if inputs else "",
                    },
                    tags=["challenge-generation-crew"]
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
                # Extract difficulty from output JSON
                diff_match = re.search(r'"difficulty"\s*:\s*"(\w+)"', raw)
                difficulty = diff_match.group(1) if diff_match else "medium"
                session_count = int(getattr(self, '_scoring_inputs', {}).get("session_count", 0))
                from meraki_flow.opik_metrics import ChallengeCalibrationMetric
                result = ChallengeCalibrationMetric().score(difficulty=difficulty, session_count=session_count)
                opik_context.update_current_trace(
                    metadata={"crew_completed": "challenge_generation", "result_type": type(output).__name__},
                    feedback_scores=[{"name": result.name, "value": result.value, "reason": result.reason}],
                )
            except Exception as e:
                print(f"[Opik] challenge_generation scoring failed (non-fatal): {e}")
        return output

    @agent
    def challenge_designer(self) -> Agent:
        return Agent(
            config=self.agents_config['challenge_designer'],
            verbose=True,
        )

    @task
    def generate_challenge_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_challenge_task'],
            output_pydantic=GeneratedChallenge,
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Challenge Generation Crew."""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
