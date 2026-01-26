from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from opik import opik_context


@CrewBase
class RetentionCrew:
    """Retention Crew - Detects stalls and helps users get unstuck"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        opik_context.update_current_trace(
            metadata={
                "crew": "retention",
                "input_keys": list(inputs.keys()) if inputs else [],
                "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                "days_inactive": inputs.get("days_inactive", 0) if inputs else 0,
                "current_streak": inputs.get("current_streak", 0) if inputs else 0,
            },
            tags=["retention-crew"]
        )
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata to Opik after crew execution."""
        opik_context.update_current_trace(
            metadata={
                "result_type": type(output).__name__,
                "crew_completed": "retention",
            }
        )
        return output

    @agent
    def motivation_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['motivation_agent'],
            verbose=True
        )

    @agent
    def stuck_helper(self) -> Agent:
        return Agent(
            config=self.agents_config['stuck_helper'],
            verbose=True
        )

    @task
    def detect_stall_task(self) -> Task:
        return Task(
            config=self.tasks_config['detect_stall_task'],
        )

    @task
    def select_intervention_task(self) -> Task:
        return Task(
            config=self.tasks_config['select_intervention_task'],
        )

    @task
    def detect_pattern_task(self) -> Task:
        return Task(
            config=self.tasks_config['detect_pattern_task'],
        )

    @task
    def generate_unsticking_suggestion_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_unsticking_suggestion_task'],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Retention Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
