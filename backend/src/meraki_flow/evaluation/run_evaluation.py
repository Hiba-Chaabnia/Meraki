"""
Batch evaluation runner for all 7 Meraki crews.

Uses opik.evaluate() to run crew tasks against persistent datasets,
scoring with both heuristic metrics (fast) and LLM-judge metrics (thorough).

Usage:
    python -m meraki_flow.evaluation.run_evaluation                        # all crews
    python -m meraki_flow.evaluation.run_evaluation --only discovery       # single crew
    python -m meraki_flow.evaluation.run_evaluation --heuristic-only       # skip LLM judges
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik
from opik.evaluation import evaluate
from opik.evaluation.metrics import base_metric, score_result

from meraki_flow.opik_metrics import (
    HobbyMatchDiversityMetric,
    SamplingCompletenessMetric,
    LocalExperiencesCompletenessMetric,
    FeedbackSpecificityMetric,
    ChallengeCalibrationMetric,
    NudgeUrgencyCalibrationMetric,
    RoadmapCompletenessMetric,
)

RESULTS_DIR = Path(__file__).resolve().parent / "results"


# ---------------------------------------------------------------------------
# Adapter metrics for structured-input metrics
# ---------------------------------------------------------------------------

class ChallengeCalibrationAdapter(base_metric.BaseMetric):
    """Wraps ChallengeCalibrationMetric to extract fields from raw output + metadata."""

    def __init__(self):
        super().__init__(name="challenge_calibration")
        self._inner = ChallengeCalibrationMetric()

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        # Extract difficulty from output JSON
        diff_match = re.search(r'"difficulty"\s*:\s*"(\w+)"', output)
        difficulty = diff_match.group(1) if diff_match else "medium"

        # Extract session_count from metadata (passed via reference_dataset_item)
        metadata = kwargs.get("metadata", {})
        crew_inputs = metadata.get("crew_inputs", {})
        session_count = int(crew_inputs.get("session_count", 0))

        return self._inner.score(difficulty=difficulty, session_count=session_count)


class NudgeUrgencyAdapter(base_metric.BaseMetric):
    """Wraps NudgeUrgencyCalibrationMetric to extract fields from raw output + metadata."""

    def __init__(self):
        super().__init__(name="nudge_urgency_calibration")
        self._inner = NudgeUrgencyCalibrationMetric()

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        urgency_match = re.search(r'"urgency"\s*:\s*"(\w+)"', output)
        urgency = urgency_match.group(1) if urgency_match else "check_in"

        metadata = kwargs.get("metadata", {})
        crew_inputs = metadata.get("crew_inputs", {})
        days = int(crew_inputs.get("days_since_last_session", 3))

        return self._inner.score(urgency=urgency, days_since_last_session=days)


# ---------------------------------------------------------------------------
# Task functions — each takes a dataset item, runs the crew, returns output
# All crew_inputs are stored in metadata.crew_inputs and must contain
# every template variable the crew's tasks.yaml expects.
# ---------------------------------------------------------------------------

def _extract_inputs(dataset_item: dict) -> tuple[dict, dict]:
    """Extract crew_inputs and metadata from a dataset item."""
    metadata = dataset_item.get("metadata", {})
    crew_inputs = dict(metadata.get("crew_inputs", {}))
    return crew_inputs, metadata


def _run_discovery_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = DiscoveryCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_sampling_preview_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.sampling_preview_crew.sampling_preview_crew import SamplingPreviewCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = SamplingPreviewCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_local_experiences_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.local_experiences_crew.local_experiences_crew import LocalExperiencesCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = LocalExperiencesCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_practice_feedback_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.practice_feedback_crew.practice_feedback_crew import PracticeFeedbackCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = PracticeFeedbackCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_challenges_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.challenge_generation_crew.challenge_generation_crew import ChallengeGenerationCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = ChallengeGenerationCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_motivation_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.motivation_crew.motivation_crew import MotivationCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = MotivationCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


def _run_roadmap_task(dataset_item: dict) -> dict:
    from meraki_flow.crews.roadmap_crew.roadmap_crew import RoadmapCrew
    crew_inputs, metadata = _extract_inputs(dataset_item)
    crew = RoadmapCrew()
    result = crew.crew().kickoff(inputs=crew_inputs)
    raw = result.raw if hasattr(result, 'raw') else str(result)
    return {"output": raw, "metadata": metadata}


# ---------------------------------------------------------------------------
# Evaluation configs per crew
# ---------------------------------------------------------------------------

def _get_llm_judge_metrics():
    """Return LLM-judge metrics (expensive, uses LLM calls)."""
    try:
        from opik.evaluation.metrics import AnswerRelevance, Usefulness
        return [AnswerRelevance(), Usefulness()]
    except ImportError:
        from opik.evaluation.metrics import AnswerRelevance
        return [AnswerRelevance()]


EVAL_CONFIGS = {
    "discovery": {
        "dataset_name": "meraki-eval-discovery",
        "task_fn": _run_discovery_task,
        "heuristic_metrics": [HobbyMatchDiversityMetric()],
        "experiment_name": "meraki-eval-discovery",
    },
    "sampling_preview": {
        "dataset_name": "meraki-eval-sampling-preview",
        "task_fn": _run_sampling_preview_task,
        "heuristic_metrics": [SamplingCompletenessMetric()],
        "experiment_name": "meraki-eval-sampling-preview",
    },
    "local_experiences": {
        "dataset_name": "meraki-eval-local-experiences",
        "task_fn": _run_local_experiences_task,
        "heuristic_metrics": [LocalExperiencesCompletenessMetric()],
        "experiment_name": "meraki-eval-local-experiences",
    },
    "practice_feedback": {
        "dataset_name": "meraki-eval-practice-feedback",
        "task_fn": _run_practice_feedback_task,
        "heuristic_metrics": [FeedbackSpecificityMetric()],
        "experiment_name": "meraki-eval-practice-feedback",
    },
    "challenges": {
        "dataset_name": "meraki-eval-challenges",
        "task_fn": _run_challenges_task,
        "heuristic_metrics": [ChallengeCalibrationAdapter()],
        "experiment_name": "meraki-eval-challenges",
    },
    "motivation": {
        "dataset_name": "meraki-eval-motivation",
        "task_fn": _run_motivation_task,
        "heuristic_metrics": [NudgeUrgencyAdapter()],
        "experiment_name": "meraki-eval-motivation",
    },
    "roadmap": {
        "dataset_name": "meraki-eval-roadmap",
        "task_fn": _run_roadmap_task,
        "heuristic_metrics": [RoadmapCompletenessMetric()],
        "experiment_name": "meraki-eval-roadmap",
    },
}


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def run_evaluation(
    crew_name: str,
    heuristic_only: bool = False,
) -> dict:
    """Run evaluation for a single crew and return results summary."""
    config = EVAL_CONFIGS[crew_name]
    client = opik.Opik()

    # Load dataset
    dataset = client.get_dataset(name=config["dataset_name"])
    print(f"\n=== Evaluating: {crew_name} ===")
    print(f"Dataset: {config['dataset_name']}")

    # Build metrics list
    metrics = list(config["heuristic_metrics"])
    if not heuristic_only:
        metrics.extend(_get_llm_judge_metrics())
        print(f"Metrics: {len(config['heuristic_metrics'])} heuristic + LLM judges")
    else:
        print(f"Metrics: {len(config['heuristic_metrics'])} heuristic only")

    # Timestamp the experiment
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    experiment_name = f"{config['experiment_name']}_{ts}"

    # Run evaluation
    result = evaluate(
        dataset=dataset,
        task=config["task_fn"],
        scoring_metrics=metrics,
        experiment_name=experiment_name,
    )

    # Build summary
    summary = {
        "crew": crew_name,
        "experiment_name": experiment_name,
        "dataset": config["dataset_name"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "heuristic_only": heuristic_only,
        "test_results": [],
    }

    if hasattr(result, 'test_results'):
        for tr in result.test_results:
            summary["test_results"].append({
                "input": tr.test_case.get("input", "")[:200],
                "scores": {s.name: s.value for s in tr.score_results} if hasattr(tr, 'score_results') else {},
            })

    print(f"Evaluation complete: {experiment_name}")
    return summary


def save_results(all_results: list[dict]) -> Path:
    """Save evaluation results to timestamped JSON."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"evaluation_{ts}.json"

    with open(filepath, "w") as f:
        json.dump(all_results, f, indent=2, default=str)

    print(f"\nResults saved to: {filepath}")
    return filepath


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Run Meraki crew evaluations")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=list(EVAL_CONFIGS.keys()),
        help="Only evaluate specific crews",
    )
    parser.add_argument(
        "--heuristic-only",
        action="store_true",
        help="Skip LLM-judge metrics (faster, cheaper)",
    )
    args = parser.parse_args()

    opik.configure(use_local=False)

    targets = args.only or list(EVAL_CONFIGS.keys())
    all_results = []

    for crew_name in targets:
        try:
            result = run_evaluation(crew_name, heuristic_only=args.heuristic_only)
            all_results.append(result)
        except Exception as e:
            print(f"\n[ERROR] Evaluation failed for {crew_name}: {e}")
            all_results.append({
                "crew": crew_name,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

    save_results(all_results)

    # Print summary
    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)
    for r in all_results:
        if "error" in r:
            print(f"  {r['crew']}: FAILED — {r['error']}")
        else:
            n_tests = len(r.get("test_results", []))
            print(f"  {r['crew']}: {n_tests} test cases evaluated")


if __name__ == "__main__":
    main()
