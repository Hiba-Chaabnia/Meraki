"""
Run all optimization scripts sequentially and generate a summary report.

Usage:
    python -m meraki_flow.optimization.run_all
    python -m meraki_flow.optimization.run_all --apply
    python -m meraki_flow.optimization.run_all --only discovery challenges motivation
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

RESULTS_DIR = Path(__file__).resolve().parent / "results"

OPTIMIZERS = {
    "discovery": {
        "module": "meraki_flow.optimization.optimize_discovery",
        "description": "DiscoveryCrew (MetaPromptOptimizer)",
    },
    "challenges": {
        "module": "meraki_flow.optimization.optimize_challenges",
        "description": "ChallengeGenerationCrew (FewShotBayesianOptimizer)",
    },
    "motivation": {
        "module": "meraki_flow.optimization.optimize_motivation",
        "description": "MotivationCrew (EvolutionaryOptimizer)",
    },
}


def run_optimizer(name: str, apply: bool, trials: int) -> dict | None:
    """Run a single optimizer and return its results."""
    info = OPTIMIZERS[name]
    print(f"\n{'='*60}")
    print(f"Running: {info['description']}")
    print(f"{'='*60}")

    try:
        import importlib
        mod = importlib.import_module(info["module"])
        result_data = mod.run_optimization(n_trials=trials)
        filepath = mod.save_results(result_data)

        if apply:
            mod.apply_to_yaml(result_data)

        return {
            "name": name,
            "status": "success",
            "initial_score": result_data.get("initial_score"),
            "best_score": result_data.get("best_score"),
            "result_file": str(filepath),
        }
    except Exception as e:
        print(f"\nFAILED: {e}")
        import traceback
        traceback.print_exc()
        return {
            "name": name,
            "status": "failed",
            "error": str(e),
        }


def print_summary(results: list[dict]) -> None:
    """Print a summary table of all optimization results."""
    print(f"\n{'='*60}")
    print("OPTIMIZATION SUMMARY")
    print(f"{'='*60}\n")

    for r in results:
        name = r["name"]
        status = r["status"]
        if status == "success":
            initial = r.get("initial_score")
            best = r.get("best_score")
            if initial is not None and best is not None and initial != 0:
                improvement = (best - initial) / abs(initial) * 100
                print(f"  {name:20s}  {initial:.4f} -> {best:.4f}  ({improvement:+.1f}%)")
            else:
                print(f"  {name:20s}  {initial} -> {best}")
        else:
            print(f"  {name:20s}  FAILED: {r.get('error', 'unknown')}")

    print()


def main():
    parser = argparse.ArgumentParser(description="Run all Meraki optimizations")
    parser.add_argument("--apply", action="store_true", help="Apply optimized prompts to YAML files")
    parser.add_argument("--only", nargs="+", choices=list(OPTIMIZERS.keys()),
                        help="Only run specific optimizers")
    parser.add_argument("--trials", type=int, default=10, help="Trials per optimizer")
    args = parser.parse_args()

    to_run = args.only or list(OPTIMIZERS.keys())

    print(f"Meraki Agent Optimization")
    print(f"Running: {', '.join(to_run)}")
    print(f"Trials per optimizer: {args.trials}")
    print(f"Apply results: {args.apply}")

    results = []
    for name in to_run:
        result = run_optimizer(name, apply=args.apply, trials=args.trials)
        if result:
            results.append(result)

    print_summary(results)

    # Save summary
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    summary_path = RESULTS_DIR / f"optimization_summary_{timestamp}.json"
    with open(summary_path, "w") as f:
        json.dump({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "applied": args.apply,
            "trials_per_optimizer": args.trials,
            "results": results,
        }, f, indent=2, default=str)

    print(f"Summary saved to: {summary_path}")


if __name__ == "__main__":
    main()
