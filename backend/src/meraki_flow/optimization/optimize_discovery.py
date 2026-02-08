"""
Optimize the DiscoveryCrew agent prompt using MetaPromptOptimizer.

Reads the current backstory from agents.yaml, runs optimization against
a curated dataset, and saves the optimized prompt + scores to a JSON file.
Optionally updates agents.yaml with the improved backstory.

Usage:
    python -m meraki_flow.optimization.optimize_discovery
    python -m meraki_flow.optimization.optimize_discovery --apply
"""

from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik
import yaml
from opik.evaluation.metrics import LevenshteinRatio
from opik_optimizer import MetaPromptOptimizer, ChatPrompt

# Paths
CREW_DIR = Path(__file__).resolve().parent.parent / "crews" / "discovery_crew" / "config"
AGENTS_YAML = CREW_DIR / "agents.yaml"
from meraki_flow.optimization.harness import (
    RESULTS_DIR,
    OptimizerSpec,
    load_agent,
    summarise,
    run_cli,
)


def load_current_prompt() -> str:
    """Load the current discovery_agent backstory from agents.yaml."""
    agent = load_agent(AGENTS_YAML, "discovery_agent")
    return f"""Role: {agent['role'].strip()}

Goal: {agent['goal'].strip()}

Backstory: {agent['backstory'].strip()}

Given a user profile with quiz answers across 9 dimensions (time, creative preferences,
learning style, social needs, budget, motivation, sensory preferences, constraints,
personal reflections), recommend 3-5 hobby matches.

For each match provide: hobby_slug, match_percentage (0-100), match_tags (list),
and reasoning (max 2 sentences)."""


def create_dataset() -> "opik.Dataset":
    """Create an Opik dataset with representative quiz profiles."""
    client = opik.Opik()

    dataset_name = "meraki-discovery-optimization"

    # Delete and recreate to ensure fresh data
    try:
        client.delete_dataset(name=dataset_name)
    except Exception:
        pass

    dataset = client.create_dataset(
        name=dataset_name,
        description="Quiz profiles for discovery agent optimization",
    )

    dataset.insert([
        {
            "input": (
                "Time: 2hrs/week, Timing: evenings, Sessions: short bursts, "
                "Creative type: making things with hands, Structure: guided at first, "
                "Mess: don't mind, Learning: YouTube tutorials, Mistakes: learn from them, "
                "Location: small apartment, Social: solo, Budget: under $30/month, "
                "Ongoing costs: prefer low, Try-first: yes definitely, "
                "Motivation: stress relief and mindfulness, Resonates: creating something tangible, "
                "Learning curve: patient, Sensory: tactile, Senses: touch and sight, "
                "Constraints: none, Seasonal: indoor year-round, "
                "Dream hobby: always wanted to try pottery, Barriers: cost and space concerns"
            ),
            "expected_output": (
                "Top matches should include apartment-friendly tactile hobbies under $30/month. "
                "Knitting (90%+), Container gardening (85%+), Drawing/Sketching (80%+). "
                "Should address cost/space barriers directly in reasoning."
            ),
        },
        {
            "input": (
                "Time: 5hrs/week, Timing: weekends, Sessions: long immersive, "
                "Creative type: visual art, Structure: structured classes, "
                "Mess: bring it on, Learning: in-person classes, Mistakes: part of the process, "
                "Location: suburban house with garage, Social: group preferred, "
                "Budget: up to $100/month, Ongoing costs: willing to invest, "
                "Try-first: like to research, Motivation: skill mastery and personal growth, "
                "Resonates: producing beautiful work, Learning curve: loves the challenge, "
                "Sensory: visual, Senses: sight, Constraints: none, "
                "Seasonal: both indoor and outdoor, "
                "Dream hobby: painting, Barriers: worried about lack of talent"
            ),
            "expected_output": (
                "Top matches should include visual arts with class availability. "
                "Watercolor (92%+), Pottery (88%+), Photography (85%+). "
                "Should reassure about talent not being a prerequisite."
            ),
        },
        {
            "input": (
                "Time: 1hr/week, Timing: whenever free, Sessions: micro sessions, "
                "Creative type: relaxing/calming, Structure: self-guided, "
                "Mess: prefer clean, Learning: apps and books, Mistakes: prefer low-stakes, "
                "Location: apartment, Social: solo, Budget: under $20/month, "
                "Ongoing costs: minimal, Try-first: just want to start, "
                "Motivation: relaxation and fun, Resonates: the process itself, "
                "Learning curve: want quick wins, Sensory: visual, Senses: sight and touch, "
                "Constraints: limited hand mobility, Seasonal: indoor, "
                "Dream hobby: something creative but easy, Barriers: not enough time"
            ),
            "expected_output": (
                "Top matches should be low-time, low-cost, mobility-friendly. "
                "Houseplants (88%+), Creative writing/Journaling (85%+). "
                "Must respect hand mobility constraint. Should frame 1hr/week as enough."
            ),
        },
        {
            "input": (
                "Time: 3hrs/week, Timing: mornings, Sessions: medium focused, "
                "Creative type: both process and results, Structure: mix of guided and free, "
                "Mess: moderate, Learning: mix of video and practice, "
                "Mistakes: okay with some frustration, Location: house with yard, "
                "Social: sometimes alone sometimes with friends, Budget: $50/month, "
                "Ongoing costs: moderate okay, Try-first: sample before committing, "
                "Motivation: express myself creatively, Resonates: making unique things, "
                "Learning curve: moderate patience, Sensory: tactile and visual, "
                "Senses: touch sight smell, Constraints: none, Seasonal: enjoy seasons, "
                "Dream hobby: something with nature, Barriers: don't know where to start"
            ),
            "expected_output": (
                "Top matches should bridge nature and creativity with yard access. "
                "Container gardening (92%+), Herb garden (88%+), Watercolor (82%+). "
                "Should provide clear 'where to start' guidance in reasoning."
            ),
        },
    ])

    return dataset


def build_metric():
    """Build the evaluation metric: relevance of output to expected."""
    def metric_fn(dataset_item: dict, llm_output: str) -> "LevenshteinRatio":
        from opik.evaluation.metrics import AnswerRelevance
        return AnswerRelevance().score(
            input=dataset_item["input"],
            output=llm_output,
            context=[dataset_item["expected_output"]],
        )
    return metric_fn


def run_optimization(n_trials: int = 10) -> dict:
    """Run the MetaPromptOptimizer and return serialized results."""
    opik.configure(use_local=False)

    current_prompt_text = load_current_prompt()

    prompt = ChatPrompt(
        system=current_prompt_text,
        user="{input}",
    )

    dataset = create_dataset()

    optimizer = MetaPromptOptimizer(
        model="gpt-4o",
        n_threads=4,
        seed=42,
        verbose=0,
    )

    print("\n=== Starting Discovery Agent Optimization ===")
    print(f"Trials: {n_trials}")
    print(f"Dataset: {dataset.name}")
    print()

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=build_metric(),
        n_samples=None,
        max_trials=n_trials,
        project_name="meraki-optimize-discovery",
    )

    # Print results as plain text (Rich display crashes on Windows cp1252)
    return summarise(result, optimizer="MetaPromptOptimizer", crew="discovery", n_trials=n_trials)


def _print_improvement(result_data: dict) -> None:
    """Discovery only: a MetaPrompt run is judged on the score delta."""
    print(
        f"Score improvement: {result_data['initial_score']:.4f} -> "
        f"{result_data['best_score']:.4f}"
    )


SPEC = OptimizerSpec(
    prefix="discovery",
    description="Optimize Discovery Agent prompt",
    agents_yaml=AGENTS_YAML,
    agent_key="discovery_agent",
    default_trials=10,
    optimize=run_optimization,
    on_applied=_print_improvement,
)


if __name__ == "__main__":
    run_cli(SPEC)
