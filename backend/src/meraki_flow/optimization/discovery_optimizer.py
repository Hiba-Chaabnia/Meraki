"""
Discovery Agent Prompt Optimizer.

Uses MetaPromptOptimizer from opik-optimizer to improve the discovery agent's
backstory and goal for better hobby recommendations.
"""

import json
from pathlib import Path

from opik_optimizer import MetaPromptOptimizer
from opik_optimizer.demo_dataset import ChatPrompt
from opik.evaluation.metrics import AnswerRelevance

from meraki_flow.tools.opik_metrics import HobbyMatchAccuracyMetric


# Dataset path
DATASETS_DIR = Path(__file__).parent / "datasets"
EXAMPLES_FILE = DATASETS_DIR / "discovery_examples.json"

# Default discovery prompt template
DEFAULT_DISCOVERY_PROMPT = ChatPrompt(
    messages=[
        {
            "role": "system",
            "content": """You are a hobby discovery expert who helps people find fulfilling creative hobbies.

Your role is to analyze a user's interests, constraints, and preferences to recommend hobbies
that will bring them joy and fit their lifestyle.

Consider the following when making recommendations:
- The user's stated interests and what they might enjoy
- Time availability (some hobbies require more commitment than others)
- Budget constraints (recommend affordable options when budget is limited)
- Location factors (some hobbies work better in certain settings)

Always provide 3-5 specific hobby recommendations with brief explanations of why each
would be a good fit for this particular user."""
        },
        {
            "role": "user",
            "content": """Please recommend hobbies for someone with these characteristics:

Interests: {hobby_interests}
Available Time: {available_time}
Budget: {budget}
Location: {location}

Provide personalized hobby recommendations that fit these constraints."""
        }
    ]
)


def load_optimization_dataset():
    """Load the discovery optimization dataset."""
    if EXAMPLES_FILE.exists():
        with open(EXAMPLES_FILE, "r") as f:
            return json.load(f)

    # Default dataset if file doesn't exist
    return [
        {
            "input": {
                "hobby_interests": "art, creativity, visual expression",
                "available_time": "2-3 hours weekly",
                "budget": "low",
                "location": "apartment"
            },
            "expected_output": "Recommend affordable art hobbies suitable for small spaces"
        },
        {
            "input": {
                "hobby_interests": "music, rhythm, relaxation",
                "available_time": "5+ hours weekly",
                "budget": "medium",
                "location": "house with yard"
            },
            "expected_output": "Recommend musical hobbies with space for practice"
        },
        {
            "input": {
                "hobby_interests": "nature, outdoors, physical activity",
                "available_time": "weekends",
                "budget": "low",
                "location": "rural area"
            },
            "expected_output": "Recommend outdoor activities accessible in rural settings"
        },
        {
            "input": {
                "hobby_interests": "crafts, making things, hands-on",
                "available_time": "1-2 hours daily",
                "budget": "high",
                "location": "urban"
            },
            "expected_output": "Recommend craft hobbies with potential for equipment investment"
        },
        {
            "input": {
                "hobby_interests": "technology, gaming, digital",
                "available_time": "evenings",
                "budget": "medium",
                "location": "any"
            },
            "expected_output": "Recommend tech-oriented creative hobbies"
        },
    ]


def optimize_discovery_prompt(
    n_trials: int = 20,
    model: str = "gpt-4o",
    save_results: bool = True
):
    """
    Optimize the discovery agent prompt using MetaPromptOptimizer.

    Args:
        n_trials: Number of optimization trials to run.
        model: Model to use for optimization.
        save_results: Whether to save results to file.

    Returns:
        Optimization result with best prompt and scores.
    """
    print("Initializing Discovery Prompt Optimizer...")

    # Load dataset
    dataset = load_optimization_dataset()
    print(f"Loaded {len(dataset)} examples for optimization")

    # Initialize optimizer
    optimizer = MetaPromptOptimizer(
        model=model,
        project_name="meraki-discovery-optimization",
        reasoning_model=model,
        n_reasoning_steps=3,
    )

    # Create combined metric
    relevance_metric = AnswerRelevance()
    match_metric = HobbyMatchAccuracyMetric()

    print(f"Starting optimization with {n_trials} trials...")

    # Run optimization
    result = optimizer.optimize_prompt(
        prompt=DEFAULT_DISCOVERY_PROMPT,
        dataset=dataset,
        metric=relevance_metric,
        n_trials=n_trials,
    )

    print("\n" + "=" * 50)
    print("OPTIMIZATION COMPLETE")
    print("=" * 50)
    print(f"Baseline Score: {result.baseline_score:.4f}")
    print(f"Best Score: {result.best_score:.4f}")
    print(f"Improvement: {(result.best_score - result.baseline_score) * 100:.2f}%")

    if save_results:
        results_file = Path(__file__).parent / "discovery_optimization_results.json"
        with open(results_file, "w") as f:
            json.dump({
                "baseline_score": result.baseline_score,
                "best_score": result.best_score,
                "best_prompt": str(result.best_prompt),
                "n_trials": n_trials,
                "model": model,
            }, f, indent=2)
        print(f"\nResults saved to: {results_file}")

    return result


if __name__ == "__main__":
    result = optimize_discovery_prompt(n_trials=10)
    print("\nOptimized prompt:")
    print(result.best_prompt)
