from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task, before_kickoff, after_kickoff
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from opik import opik_context


@CrewBase
class SamplingCrew:
    """Sampling Crew - Creates low-commitment entry points for trying hobbies"""

    agents: List[BaseAgent]
    tasks: List[Task]

    @before_kickoff
    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik before crew execution."""
        opik_context.update_current_trace(
            metadata={
                "crew": "sampling",
                "input_keys": list(inputs.keys()) if inputs else [],
                "hobby_name": inputs.get("hobby_name", "") if inputs else "",
                "location": inputs.get("location", "") if inputs else "",
            },
            tags=["sampling-crew"]
        )
        return inputs

    @after_kickoff
    def log_outputs(self, output):
        """Log output metadata to Opik after crew execution."""
        opik_context.update_current_trace(
            metadata={
                "result_type": type(output).__name__,
                "crew_completed": "sampling",
            }
        )
        return output

    @agent
    def sampling_agent(self) -> Agent:
        return Agent(
            config=self.agents_config['sampling_agent'],
            verbose=True
        )

    @task
    def generate_home_project_task(self) -> Task:
        return Task(
            config=self.tasks_config['generate_home_project_task'],
        )

    @task
    def find_local_experiences_task(self) -> Task:
        return Task(
            config=self.tasks_config['find_local_experiences_task'],
        )

    @task
    def curate_learning_path_task(self) -> Task:
        return Task(
            config=self.tasks_config['curate_learning_path_task'],
        )

    @task
    def compile_sampling_options_task(self) -> Task:
        return Task(
            config=self.tasks_config['compile_sampling_options_task'],
        )

    @crew
    def crew(self) -> Crew:
        """Creates the Sampling Crew"""
        return Crew(
            agents=self.agents,
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )
