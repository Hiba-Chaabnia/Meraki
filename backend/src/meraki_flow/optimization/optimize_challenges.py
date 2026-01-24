"""
Optimize the ChallengeGenerationCrew agent prompt using FewShotBayesianOptimizer.

Finds optimal few-shot examples to include with the challenge designer prompt.
Saves results (including best examples) to JSON and optionally updates agents.yaml.

Usage:
    python -m meraki_flow.optimization.optimize_challenges
    python -m meraki_flow.optimization.optimize_challenges --apply
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik
import yaml
from opik.evaluation.metrics import LevenshteinRatio
from opik_optimizer import FewShotBayesianOptimizer, ChatPrompt

CREW_DIR = Path(__file__).resolve().parent.parent / "crews" / "challenge_generation_crew" / "config"
AGENTS_YAML = CREW_DIR / "agents.yaml"
RESULTS_DIR = Path(__file__).resolve().parent / "results"


def load_current_prompt() -> str:
    with open(AGENTS_YAML) as f:
        config = yaml.safe_load(f)
    agent = config["challenge_designer"]
    return f"""{agent['backstory'].strip()}

Design a single creative challenge for the user.
Output JSON with: title, description, why_this_challenge, skills (list),
difficulty (easy/medium/hard), estimated_time, tips (list), what_youll_learn (list)."""


def create_dataset() -> "opik.Dataset":
    client = opik.Opik()

    dataset_name = "meraki-challenge-optimization"

    try:
        client.delete_dataset(name=dataset_name)
    except Exception:
        pass

    dataset = client.create_dataset(
        name=dataset_name,
        description="Challenge generation scenarios for optimization",
    )

    dataset.insert([
        {
            "input": (
                "Hobby: watercolor, Sessions: 5, Avg duration: 30min, "
                "Mood distribution: happy 60%, neutral 30%, frustrated 10%, "
                "Days active: 14, Completed challenges: Paint a simple fruit, "
                "Skipped: none, Recent feedback: Good color mixing intuition, "
                "Mood trend: improving"
            ),
            "expected_output": json.dumps({
                "title": "Sunset in 3 Colors",
                "description": "Paint a sunset using only 3 watercolors of your choice. Limiting your palette forces creative mixing.",
                "difficulty": "easy",
                "estimated_time": "30 minutes",
                "why_this_challenge": "You've shown good color instincts - this challenge channels that into a beautiful constraint.",
                "skills": ["color mixing", "wet-on-wet", "gradient"],
                "tips": ["Start with the lightest color", "Work while the paper is still damp"],
                "what_youll_learn": ["Limited palette techniques", "Color temperature"],
            }),
        },
        {
            "input": (
                "Hobby: pottery, Sessions: 12, Avg duration: 60min, "
                "Mood distribution: happy 40%, neutral 40%, frustrated 20%, "
                "Days active: 30, Completed challenges: Pinch pot, Coil pot, "
                "Skipped: Glaze techniques, Recent feedback: Good wall thickness control, "
                "Mood trend: stable"
            ),
            "expected_output": json.dumps({
                "title": "The Wonky Mug Challenge",
                "description": "Make a mug that's intentionally imperfect - embrace the wobble and make asymmetry the feature.",
                "difficulty": "medium",
                "estimated_time": "60 minutes",
                "why_this_challenge": "You've mastered wall control - now let's play with that skill by breaking the rules on purpose.",
                "skills": ["handle attachment", "form exploration", "intentional imperfection"],
                "tips": ["Don't try to fix wobbles", "Think about what feels good to hold"],
                "what_youll_learn": ["Handle attachment", "Wabi-sabi aesthetics"],
            }),
        },
        {
            "input": (
                "Hobby: sketching, Sessions: 3, Avg duration: 20min, "
                "Mood distribution: neutral 50%, nervous 50%, "
                "Days active: 7, Completed challenges: none, "
                "Skipped: none, Recent feedback: none, "
                "Mood trend: nervous"
            ),
            "expected_output": json.dumps({
                "title": "60-Second Sketch Sprint",
                "description": "Set a timer for 60 seconds and sketch 5 objects around you. Speed kills perfectionism!",
                "difficulty": "easy",
                "estimated_time": "10 minutes",
                "why_this_challenge": "The time pressure makes it impossible to overthink. You'll surprise yourself with what appears on paper.",
                "skills": ["quick observation", "loose line work", "letting go of perfection"],
                "tips": ["Don't lift your pen", "Look at the object more than your paper"],
                "what_youll_learn": ["Contour drawing basics", "The freedom of imperfection"],
            }),
        },
        {
            "input": (
                "Hobby: knitting, Sessions: 8, Avg duration: 45min, "
                "Mood distribution: happy 70%, calm 20%, neutral 10%, "
                "Days active: 21, Completed challenges: Basic scarf, Dishcloth, "
                "Skipped: Cable knit pattern, Recent feedback: Even tension great, "
                "Mood trend: confident"
            ),
            "expected_output": json.dumps({
                "title": "The Color Block Cowl",
                "description": "Knit a simple cowl using 2-3 colors in wide stripes. Same stitches you know, new visual impact.",
                "difficulty": "medium",
                "estimated_time": "2-3 sessions",
                "why_this_challenge": "Your tension is solid - adding color changes will make your work pop without new techniques.",
                "skills": ["color changes", "joining yarn", "circular knitting"],
                "tips": ["Carry the unused color loosely up the side", "Pick colors that excite you"],
                "what_youll_learn": ["Color change technique", "Working in the round"],
            }),
        },
        {
            "input": (
                "Hobby: photography, Sessions: 15, Avg duration: 90min, "
                "Mood distribution: excited 50%, happy 30%, frustrated 20%, "
                "Days active: 45, Completed challenges: Rule of thirds, Golden hour shoot, "
                "Skipped: Manual exposure, Recent feedback: Great composition instincts, "
                "Mood trend: eager for more"
            ),
            "expected_output": json.dumps({
                "title": "One Subject, Five Perspectives",
                "description": "Choose one ordinary object and photograph it from 5 dramatically different angles and distances.",
                "difficulty": "medium",
                "estimated_time": "45 minutes",
                "why_this_challenge": "Your composition skills are strong - this pushes you to see familiar things in unfamiliar ways.",
                "skills": ["perspective", "close-up/macro", "creative framing"],
                "tips": ["Get low, get high, get close", "Try shooting through or around obstacles"],
                "what_youll_learn": ["Perspective as storytelling", "Finding beauty in the mundane"],
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


def run_optimization(n_trials: int = 15) -> dict:
    opik.configure(use_local=False)

    current_prompt_text = load_current_prompt()

    prompt = ChatPrompt(
        system=current_prompt_text,
        user="{input}",
    )

    dataset = create_dataset()

    optimizer = FewShotBayesianOptimizer(
        model="gpt-4o",
        min_examples=2,
        max_examples=5,
        n_threads=4,
        seed=42,
        verbose=0,
    )

    print("\n=== Starting Challenge Designer Optimization ===")
    print(f"Trials: {n_trials}")
    print()

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=build_metric(),
        n_samples=None,
        project_name="meraki-optimize-challenges",
    )

    print(f"\nOptimization complete!")
    print(f"Initial score: {result.initial_score}")
    print(f"Best score:    {result.score}")
    if result.initial_score and result.initial_score != 0:
        improvement = (result.score - result.initial_score) / abs(result.initial_score) * 100
        print(f"Improvement:   {improvement:+.1f}%")
    if result.demonstrations:
        print(f"Best examples: {len(result.demonstrations)} few-shot demonstrations found")

    result_data = {
        "optimizer": "FewShotBayesianOptimizer",
        "crew": "challenge_generation",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "initial_score": result.initial_score,
        "best_score": result.score,
        "metric": result.metric_name,
        "optimized_prompt": result.prompt,
        "initial_prompt": result.initial_prompt,
        "demonstrations": result.demonstrations,
        "n_trials": n_trials,
    }

    return result_data


def save_results(result_data: dict) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"challenge_optimization_{timestamp}.json"

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

    config["challenge_designer"]["backstory"] = system_content

    with open(AGENTS_YAML, "w") as f:
        yaml.dump(config, f, default_flow_style=False, width=100)

    print(f"Updated {AGENTS_YAML} with optimized backstory")

    # Also save demonstrations separately for easy reference
    demos = result_data.get("demonstrations")
    if demos:
        demos_path = RESULTS_DIR / "challenge_best_examples.json"
        with open(demos_path, "w") as f:
            json.dump(demos, f, indent=2, default=str)
        print(f"Best few-shot examples saved to: {demos_path}")


def main():
    parser = argparse.ArgumentParser(description="Optimize Challenge Designer prompt")
    parser.add_argument("--trials", type=int, default=15, help="Number of optimization trials")
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
