from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List

from meraki_flow.opik_metrics import HobbyMatchDiversityMetric
from meraki_flow.opik_tracing import opik_traced

@CrewBase
@opik_traced(name="discovery", metric=HobbyMatchDiversityMetric)
class DiscoveryCrew:
    """Discovery Crew - Matches users to hobbies based on profile and constraints"""

    agents: List[BaseAgent]
    tasks: List[Task]

    # Optional hook fired by CrewAI after each task finishes, receiving that
    # task's TaskOutput. Assign before calling .crew() to report progress:
    #     builder = DiscoveryCrew()
    #     builder.task_callback = make_progress_callback(job_id)
    #     builder.crew().kickoff(inputs=inputs)
    task_callback = None

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
            task_callback=self.task_callback,
        )
