from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from opik import opik_context


@CrewBase
class DiscoveryCrew:
    """Discovery Crew - Matches users to hobbies based on profile and constraints"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        opik_context.update_current_trace(
            metadata={
                "crew": "discovery",
                "input_keys": list(inputs.keys()) if inputs else [],
                "hobby_interests": inputs.get("hobby_interests", "") if inputs else "",
            },
            tags=["discovery-crew"]
        )
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata to Opik after crew execution."""
        opik_context.update_current_trace(
            metadata={
                "result_type": type(output).__name__,
                "crew_completed": "discovery",
            }
        )
        return output

    @agent
    def discovery_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['discovery_agent'],
            verbose=True
        )

    @task
    def analyze_profile_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_profile_task'],
        )

    @task
    def rank_hobbies_task(self) -> Task:
        return Task(
            config=self.tasks_config['rank_hobbies_task'],
        )

    @task
    def generate_recommendations_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_recommendations_task'],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Discovery Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
