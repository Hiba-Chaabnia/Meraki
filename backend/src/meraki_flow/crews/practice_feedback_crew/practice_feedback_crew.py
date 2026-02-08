"""
Practice Feedback Crew - Provides warm, specific AI feedback on practice sessions.
"""

from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.models import PracticeFeedbackOutput

from meraki_flow.opik_metrics import FeedbackSpecificityMetric
from meraki_flow.opik_tracing import opik_traced

@CrewBase
@opik_traced(
    name="practice_feedback",
    metric=FeedbackSpecificityMetric,
    metadata=lambda i: {
        "hobby_name": i.get("hobby_name", ""),
        "session_type": i.get("session_type", ""),
        "duration_minutes": i.get("duration", 0),
        "has_image": bool(i.get("image_url")),
        "mood": i.get("mood", ""),
    },
)
class PracticeFeedbackCrew:
    """Practice Feedback Crew - Analyzes practice sessions and provides encouragement."""

    agents: List[BaseAgent]
    tasks: List[Task]

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
