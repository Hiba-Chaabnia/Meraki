"""
The parts every prompt optimizer shares.

`optimize_challenges.py` and `optimize_discovery.py` were ~50% identical: the
same `save_results`, the same `apply_to_yaml` (including the backup step), and
the same argparse `main`, differing only in a filename prefix, an agent key and
a default trial count. Those live here now.

What stays in each optimizer is what genuinely differs: the prompt it builds
from `agents.yaml`, the dataset it scores against, the metric, and the
opik-optimizer strategy — `FewShotBayesianOptimizer` for challenges,
`MetaPromptOptimizer` for discovery.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import yaml

RESULTS_DIR = Path(__file__).resolve().parent / "results"


def load_agent(agents_yaml: Path, agent_key: str) -> dict:
    """One agent's block from a crew's `agents.yaml`."""
    with open(agents_yaml) as f:
        return yaml.safe_load(f)[agent_key]


def save_results(result_data: dict, prefix: str) -> Path:
    """Write a timestamped run record to `optimization/results/`."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"{prefix}_optimization_{timestamp}.json"

    with open(filepath, "w") as f:
        json.dump(result_data, f, indent=2, default=str)

    print(f"\nResults saved to: {filepath}")
    return filepath


def _system_prompt(result_data: dict) -> str | None:
    for msg in result_data.get("optimized_prompt", []):
        if msg.get("role") == "system":
            return msg["content"]
    return None


def apply_to_yaml(result_data: dict, agents_yaml: Path, agent_key: str) -> bool:
    """
    Write the optimized backstory back into `agents.yaml`, backing up first.

    Returns False when there was nothing to apply, so the caller can skip any
    follow-up of its own.
    """
    system_content = _system_prompt(result_data)
    if not system_content:
        print(
            "No optimized prompt to apply."
            if not result_data.get("optimized_prompt")
            else "No system message found in optimized prompt."
        )
        return False

    with open(agents_yaml) as f:
        config = yaml.safe_load(f)

    backup_path = agents_yaml.with_suffix(".yaml.bak")
    with open(backup_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
    print(f"Backed up original to: {backup_path}")

    config[agent_key]["backstory"] = system_content

    with open(agents_yaml, "w") as f:
        yaml.dump(config, f, default_flow_style=False, width=100)

    print(f"Updated {agents_yaml} with optimized backstory")
    return True


def summarise(result, *, optimizer: str, crew: str, n_trials: int) -> dict:
    """
    Print the run summary and build the record `save_results` writes.

    Both optimizers reported and serialised identically; only the two labels and
    the challenge-only `demonstrations` field differ, and that field is carried
    straight off the result when the optimizer produced one.
    """
    print("\nOptimization complete!")
    print(f"Initial score: {result.initial_score}")
    print(f"Best score:    {result.score}")
    if result.initial_score and result.initial_score != 0:
        improvement = (result.score - result.initial_score) / abs(result.initial_score) * 100
        print(f"Improvement:   {improvement:+.1f}%")

    demonstrations = getattr(result, "demonstrations", None)
    if demonstrations:
        print(f"Best examples: {len(demonstrations)} few-shot demonstrations found")

    record = {
        "optimizer": optimizer,
        "crew": crew,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "initial_score": result.initial_score,
        "best_score": result.score,
        "metric": result.metric_name,
        "optimized_prompt": result.prompt,  # list of {role, content} dicts
        "initial_prompt": result.initial_prompt,
        "n_trials": n_trials,
    }
    if demonstrations:
        record["demonstrations"] = demonstrations
    return record


@dataclass
class OptimizerSpec:
    """Everything `run_cli` needs that differs between optimizers."""

    #: Filename prefix for the run record, e.g. "challenge" → challenge_optimization_*.json
    prefix: str
    description: str
    agents_yaml: Path
    agent_key: str
    default_trials: int
    #: Runs the optimization and returns the result dict.
    optimize: Callable[[int], dict]
    #: Optional follow-up after a successful --apply.
    on_applied: Callable[[dict], None] | None = None


def run_cli(spec: OptimizerSpec) -> None:
    """The `--trials` / `--apply` entry point both optimizers expose."""
    parser = argparse.ArgumentParser(description=spec.description)
    parser.add_argument(
        "--trials", type=int, default=spec.default_trials, help="Number of optimization trials"
    )
    parser.add_argument(
        "--apply", action="store_true", help="Apply optimized prompt to agents.yaml"
    )
    args = parser.parse_args()

    result_data = spec.optimize(args.trials)
    filepath = save_results(result_data, spec.prefix)

    if not args.apply:
        print(f"\nTo apply, run with --apply. Inspect results: {filepath}")
        return

    if apply_to_yaml(result_data, spec.agents_yaml, spec.agent_key) and spec.on_applied:
        spec.on_applied(result_data)
