"""
Optimize the MotivationCrew agent prompt using EvolutionaryOptimizer.

Uses genetic algorithms to discover novel nudge phrasings and urgency calibration.
Saves results to JSON and optionally updates agents.yaml.

Usage:
    python -m meraki_flow.optimization.optimize_motivation
    python -m meraki_flow.optimization.optimize_motivation --apply
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik
import yaml
from opik_optimizer import EvolutionaryOptimizer, ChatPrompt

CREW_DIR = Path(__file__).resolve().parent.parent / "crews" / "motivation_crew" / "config"
AGENTS_YAML = CREW_DIR / "agents.yaml"
RESULTS_DIR = Path(__file__).resolve().parent / "results"


def load_current_prompt() -> str:
    with open(AGENTS_YAML) as f:
        config = yaml.safe_load(f)
    agent = config["motivation_specialist"]
    return f"""{agent['backstory'].strip()}

Assess engagement signals and craft a single motivation nudge.
Output JSON with: nudge_type, message, suggested_action, action_data, urgency (gentle/check_in/re_engage)."""


def create_dataset() -> "opik.Dataset":
    client = opik.Opik()

    dataset_name = "meraki-motivation-optimization"

    try:
        client.delete_dataset(name=dataset_name)
    except Exception:
        pass

    dataset = client.create_dataset(
        name=dataset_name,
        description="Motivation scenarios for nudge optimization",
    )

    dataset.insert([
        {
            "input": (
                "Hobby: guitar, Days since last session: 2, "
                "Recent moods: happy, happy, neutral, "
                "Challenge skip rate: 0.1, Current streak: 5, "
                "Longest streak: 7, Session frequency trend: stable"
            ),
            "expected_output": json.dumps({
                "urgency": "gentle",
                "nudge_type": "streak_reminder",
                "message": "5 days strong with guitar! A quick 10-minute session keeps the momentum alive.",
                "suggested_action": "Start a short practice session",
                "action_data": "10-minute warm-up routine",
            }),
        },
        {
            "input": (
                "Hobby: painting, Days since last session: 6, "
                "Recent moods: frustrated, neutral, frustrated, "
                "Challenge skip rate: 0.4, Current streak: 0, "
                "Longest streak: 3, Session frequency trend: declining"
            ),
            "expected_output": json.dumps({
                "urgency": "check_in",
                "nudge_type": "empathy",
                "message": "Painting can feel tough sometimes. What if you just played with colors for 5 minutes today? No masterpiece required.",
                "suggested_action": "Try a no-pressure micro session",
                "action_data": "5-minute color play exercise",
            }),
        },
        {
            "input": (
                "Hobby: knitting, Days since last session: 14, "
                "Recent moods: none, "
                "Challenge skip rate: 0.8, Current streak: 0, "
                "Longest streak: 4, Session frequency trend: inactive"
            ),
            "expected_output": json.dumps({
                "urgency": "re_engage",
                "nudge_type": "fresh_start",
                "message": "Hey! We found a super simple pattern that takes just 15 minutes. Perfect for easing back into knitting with zero pressure.",
                "suggested_action": "Try a beginner-friendly micro project",
                "action_data": "Simple dishcloth pattern",
            }),
        },
        {
            "input": (
                "Hobby: sketching, Days since last session: 4, "
                "Recent moods: neutral, happy, neutral, "
                "Challenge skip rate: 0.2, Current streak: 2, "
                "Longest streak: 10, Session frequency trend: slightly declining"
            ),
            "expected_output": json.dumps({
                "urgency": "gentle",
                "nudge_type": "micro_challenge",
                "message": "Quick sketch idea: draw whatever is on your desk right now. 5 minutes, no erasing allowed!",
                "suggested_action": "Try a 5-minute sketch prompt",
                "action_data": "Draw your desk items in 5 minutes",
            }),
        },
        {
            "input": (
                "Hobby: pottery, Days since last session: 10, "
                "Recent moods: frustrated, frustrated, sad, "
                "Challenge skip rate: 0.6, Current streak: 0, "
                "Longest streak: 8, Session frequency trend: sharp decline"
            ),
            "expected_output": json.dumps({
                "urgency": "re_engage",
                "nudge_type": "reframe",
                "message": "Remember why you started pottery? That first pinch pot was magic. Sometimes starting over is the most creative thing you can do.",
                "suggested_action": "Revisit a favorite simple technique",
                "action_data": "Make a simple pinch pot - back to basics",
            }),
        },
    ])

    return dataset


def build_metric():
    def metric_fn(dataset_item: dict, llm_output: str) -> float:
        from opik.evaluation.metrics import AnswerRelevance
        return AnswerRelevance().score(
            input=dataset_item["input"],
            output=llm_output,
            context=[dataset_item["expected_output"]],
        )
    return metric_fn


def run_optimization(n_trials: int = 20) -> dict:
    opik.configure(use_local=False)

    current_prompt_text = load_current_prompt()

    prompt = ChatPrompt(
        system=current_prompt_text,
        user="{input}",
    )

    dataset = create_dataset()

    optimizer = EvolutionaryOptimizer(
        model="gpt-4o",
        n_threads=4,
        seed=42,
        verbose=0,
    )

    print("\n=== Starting Motivation Specialist Optimization ===")
    print(f"Trials: {n_trials}")
    print()

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=build_metric(),
        n_samples=None,
        max_trials=n_trials,
        project_name="meraki-optimize-motivation",
    )

    print(f"\nOptimization complete!")
    print(f"Initial score: {result.initial_score}")
    print(f"Best score:    {result.score}")
    if result.initial_score and result.initial_score != 0:
        improvement = (result.score - result.initial_score) / abs(result.initial_score) * 100
        print(f"Improvement:   {improvement:+.1f}%")

    result_data = {
        "optimizer": "EvolutionaryOptimizer",
        "crew": "motivation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "initial_score": result.initial_score,
        "best_score": result.score,
        "metric": result.metric_name,
        "optimized_prompt": result.prompt,
        "initial_prompt": result.initial_prompt,
        "n_trials": n_trials,
    }

    return result_data


def save_results(result_data: dict) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"motivation_optimization_{timestamp}.json"

    with open(filepath, "w") as f:
        json.dump(result_data, f, indent=2, default=str)

    print(f"\nResults saved to: {filepath}")
    return filepath


def apply_to_yaml(result_data: dict) -> None:
    optimized_messages = result_data.get("optimized_prompt", [])
    if not optimized_messages:
        print("No optimized prompt to apply.")
        return

    system_content = None
    for msg in optimized_messages:
        if msg.get("role") == "system":
            system_content = msg["content"]
            break

    if not system_content:
        print("No system message found in optimized prompt.")
        return

    with open(AGENTS_YAML) as f:
        config = yaml.safe_load(f)

    backup_path = AGENTS_YAML.with_suffix(".yaml.bak")
    with open(backup_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Backed up original to: {backup_path}")

    config["motivation_specialist"]["backstory"] = system_content

    with open(AGENTS_YAML, "w") as f:
        yaml.dump(config, f, default_flow_style=False, width=100)

    print(f"Updated {AGENTS_YAML} with optimized backstory")


def main():
    parser = argparse.ArgumentParser(description="Optimize Motivation Specialist prompt")
    parser.add_argument("--trials", type=int, default=20, help="Number of optimization trials")
    parser.add_argument("--apply", action="store_true", help="Apply optimized prompt to agents.yaml")
    args = parser.parse_args()

    result_data = run_optimization(n_trials=args.trials)
    filepath = save_results(result_data)

    if args.apply:
        apply_to_yaml(result_data)
    else:
        print(f"\nTo apply, run with --apply. Inspect results: {filepath}")


if __name__ == "__main__":
    main()
