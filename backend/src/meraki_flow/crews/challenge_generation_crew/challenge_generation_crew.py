"""
Challenge Generation Crew - Creates personalized creative challenges.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import GeneratedChallenge

import re

from meraki_flow.opik_metrics import ChallengeCalibrationMetric
from meraki_flow.opik_tracing import opik_traced


def _score_calibration(raw: str, inputs: dict):
    """
    The one crew whose metric does not read the raw output alone: it grades the
    difficulty the crew chose against how many sessions the user has actually
    logged, so it needs one field parsed out of the output and one carried over
    from the kickoff inputs.
    """
    match = re.search(r'"difficulty"\s*:\s*"(\w+)"', raw)
    return ChallengeCalibrationMetric().score(
        difficulty=match.group(1) if match else "medium",
        session_count=int(inputs.get("session_count", 0)),
    )


@CrewBase
@opik_traced(
    name="challenge_generation",
    metric=ChallengeCalibrationMetric,
    metadata=lambda i: {
        "hobby_name": i.get("hobby_name", ""),
        "session_count": i.get("session_count", "0"),
        "days_active": i.get("days_active", "0"),
        "mood_trend": i.get("last_mood_trend", ""),
    },
    score=_score_calibration,
)
class ChallengeGenerationCrew:
    """Challenge Generation Crew - Designs calibrated creative challenges."""

    agents: List[BaseAgent]
    tasks: List[Task]

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
