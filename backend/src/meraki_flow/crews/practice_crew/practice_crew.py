from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from opik import opik_context


@CrewBase
class PracticeCrew:
    """Practice Crew - Provides feedback, emotional support, and calibrated challenges"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        opik_context.update_current_trace(
            metadata={
                "crew": "practice",
                "input_keys": list(inputs.keys()) if inputs else [],
                "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                "session_count": inputs.get("session_count", 0) if inputs else 0,
                "emotional_state": inputs.get("emotional_state", "") if inputs else "",
            },
            tags=["practice-crew"]
        )
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata to Opik after crew execution."""
        opik_context.update_current_trace(
            metadata={
                "result_type": type(output).__name__,
                "crew_completed": "practice",
            }
        )
        return output

    @agent
    def practice_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['practice_agent'],
            verbose=True
        )

    @agent
    def challenge_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['challenge_agent'],
            verbose=True
        )

    @task
    def analyze_work_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_work_task'],
        )

    @task
    def generate_feedback_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_feedback_task'],
        )

    @task
    def emotional_checkin_task(self) -> Task:
        return Task(
            config=self.tasks_config['emotional_checkin_task'],
        )

    @task
    def calibrate_challenge_task(self) -> Task:
        return Task(
            config=self.tasks_config['calibrate_challenge_task'],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Practice Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
