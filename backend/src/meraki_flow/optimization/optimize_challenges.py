"""
Optimize the ChallengeGenerationCrew agent prompt using FewShotBayesianOptimizer.

Finds optimal few-shot examples to include with the challenge designer prompt.
Saves results (including best examples) to JSON and optionally updates agents.yaml.

Usage:
    python -m meraki_flow.optimization.optimize_challenges
    python -m meraki_flow.optimization.optimize_challenges --apply
"""

import json
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik
import yaml
from opik_optimizer import FewShotBayesianOptimizer, ChatPrompt

CREW_DIR = Path(__file__).resolve().parent.parent / "crews" / "challenge_generation_crew" / "config"
AGENTS_YAML = CREW_DIR / "agents.yaml"
from meraki_flow.optimization.harness import (
    RESULTS_DIR,
    OptimizerSpec,
    load_agent,
    summarise,
    run_cli,
)


def load_current_prompt() -> str:
    agent = load_agent(AGENTS_YAML, "challenge_designer")
    return f"""{agent['backstory'].strip()}

Design a single creative challenge for the user.
Output JSON with: title, description, skills (list),
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

    return summarise(result, optimizer="FewShotBayesianOptimizer", crew="challenge_generation", n_trials=n_trials)


def _save_demonstrations(result_data: dict) -> None:
    """Challenges only: the few-shot examples are the point of a Bayesian run."""
    demos = result_data.get("demonstrations")
    if not demos:
        return
    demos_path = RESULTS_DIR / "challenge_best_examples.json"
    with open(demos_path, "w") as f:
        json.dump(demos, f, indent=2, default=str)
    print(f"Best few-shot examples saved to: {demos_path}")


SPEC = OptimizerSpec(
    prefix="challenge",
    description="Optimize Challenge Designer prompt",
    agents_yaml=AGENTS_YAML,
    agent_key="challenge_designer",
    default_trials=15,
    optimize=run_optimization,
    on_applied=_save_demonstrations,
)


if __name__ == "__main__":
    run_cli(SPEC)
