"""
Optimize the DiscoveryCrew agent prompt using MetaPromptOptimizer.

Reads the current backstory from agents.yaml, runs optimization against
a curated dataset, and saves the optimized prompt + scores to a JSON file.
Optionally updates agents.yaml with the improved backstory.

Usage:
    python -m meraki_flow.optimization.optimize_discovery
    python -m meraki_flow.optimization.optimize_discovery --apply
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
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
RESULTS_DIR = Path(__file__).resolve().parent / "results"


def load_current_prompt() -> str:
    """Load the current discovery_agent backstory from agents.yaml."""
    with open(AGENTS_YAML) as f:
        config = yaml.safe_load(f)
    agent = config["discovery_agent"]
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
    print(f"\nOptimization complete!")
    print(f"Initial score: {result.initial_score}")
    print(f"Best score:    {result.score}")
    if result.initial_score and result.initial_score != 0:
        improvement = (result.score - result.initial_score) / abs(result.initial_score) * 100
        print(f"Improvement:   {improvement:+.1f}%")

    # Serialize result
    result_data = {
        "optimizer": "MetaPromptOptimizer",
        "crew": "discovery",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "initial_score": result.initial_score,
        "best_score": result.score,
        "metric": result.metric_name,
        "optimized_prompt": result.prompt,  # list of {role, content} dicts
        "initial_prompt": result.initial_prompt,
        "n_trials": n_trials,
    }

    return result_data


def save_results(result_data: dict) -> Path:
    """Save optimization results to a JSON file."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"discovery_optimization_{timestamp}.json"

    with open(filepath, "w") as f:
        json.dump(result_data, f, indent=2, default=str)

    print(f"\nResults saved to: {filepath}")
    return filepath


def apply_to_yaml(result_data: dict) -> None:
    """Update agents.yaml with the optimized backstory from the result."""
    optimized_messages = result_data.get("optimized_prompt", [])
    if not optimized_messages:
        print("No optimized prompt to apply.")
        return

    # Extract the system message content (the optimized backstory)
    system_content = None
    for msg in optimized_messages:
        if msg.get("role") == "system":
            system_content = msg["content"]
            break

    if not system_content:
        print("No system message found in optimized prompt.")
        return

    # Load current YAML
    with open(AGENTS_YAML) as f:
        config = yaml.safe_load(f)

    # Backup original
    backup_path = AGENTS_YAML.with_suffix(".yaml.bak")
    with open(backup_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Backed up original to: {backup_path}")

    # Update backstory with the optimized content
    config["discovery_agent"]["backstory"] = system_content

    with open(AGENTS_YAML, "w") as f:
        yaml.dump(config, f, default_flow_style=False, width=100)

    print(f"Updated {AGENTS_YAML} with optimized backstory")
    print(f"Score improvement: {result_data['initial_score']:.4f} -> {result_data['best_score']:.4f}")


def main():
    parser = argparse.ArgumentParser(description="Optimize Discovery Agent prompt")
    parser.add_argument("--trials", type=int, default=10, help="Number of optimization trials")
    parser.add_argument("--apply", action="store_true", help="Apply optimized prompt to agents.yaml")
    args = parser.parse_args()

    result_data = run_optimization(n_trials=args.trials)
    filepath = save_results(result_data)

    if args.apply:
        apply_to_yaml(result_data)
    else:
        print("\nTo apply the optimized prompt to agents.yaml, run with --apply")
        print(f"Or manually inspect: {filepath}")


if __name__ == "__main__":
    main()
