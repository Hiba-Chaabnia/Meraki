"""
Agent evaluation runner for Meraki Flow.

This module provides evaluation functions for testing agent quality
using Opik's evaluation framework with both built-in and custom metrics.
"""

import json
from pathlib import Path
from typing import Any, Dict, List

from opik import Opik
from opik.evaluation import evaluate
from opik.evaluation.metrics import Hallucination, AnswerRelevance

from meraki_flow.tools.opik_metrics import (
    FeedbackSpecificityMetric,
    ChallengeCalibrationMetric,
    InterventionEffectivenessMetric,
    HobbyMatchAccuracyMetric,
)
from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew
from meraki_flow.crews.practice_crew.practice_crew import PracticeCrew
from meraki_flow.crews.retention_crew.retention_crew import RetentionCrew


# Dataset paths
DATASETS_DIR = Path(__file__).parent / "datasets"


def load_dataset(filename: str) -> List[Dict[str, Any]]:
    """Load a JSON dataset file."""
    dataset_path = DATASETS_DIR / filename
    with open(dataset_path, "r") as f:
        return json.load(f)


def run_discovery_crew(item: Dict[str, Any]) -> str:
    """Run discovery crew for a single evaluation item."""
    inputs = item["input"]
    crew = DiscoveryCrew().crew()
    result = crew.kickoff(inputs=inputs)
    return result.raw


def run_practice_crew(item: Dict[str, Any]) -> str:
    """Run practice crew for a single evaluation item."""
    inputs = item["input"]
    crew = PracticeCrew().crew()
    result = crew.kickoff(inputs=inputs)
    return result.raw


def run_retention_crew(item: Dict[str, Any]) -> str:
    """Run retention crew for a single evaluation item."""
    inputs = item["input"]
    crew = RetentionCrew().crew()
    result = crew.kickoff(inputs=inputs)
    return result.raw


def evaluate_discovery_agent(dataset: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Evaluate the Discovery agent using hobby match accuracy and relevance metrics.

    Args:
        dataset: Optional custom dataset. If not provided, loads default dataset.

    Returns:
        Evaluation results with aggregate scores.
    """
    if dataset is None:
        dataset = load_dataset("discovery_dataset.json")

    results = evaluate(
        dataset=dataset,
        task=run_discovery_crew,
        scoring_metrics=[
            Hallucination(),
            AnswerRelevance(),
            HobbyMatchAccuracyMetric(),
        ],
        experiment_name="discovery-agent-evaluation",
    )

    return {
        "agent": "discovery",
        "dataset_size": len(dataset),
        "results": results,
    }


def evaluate_practice_agent(
    feedback_dataset: List[Dict[str, Any]] = None,
    challenge_dataset: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Evaluate the Practice agent using feedback and challenge metrics.

    Args:
        feedback_dataset: Optional custom feedback dataset.
        challenge_dataset: Optional custom challenge dataset.

    Returns:
        Evaluation results with aggregate scores.
    """
    if feedback_dataset is None:
        feedback_dataset = load_dataset("feedback_dataset.json")

    if challenge_dataset is None:
        challenge_dataset = load_dataset("challenge_dataset.json")

    # Evaluate feedback quality
    feedback_results = evaluate(
        dataset=feedback_dataset,
        task=run_practice_crew,
        scoring_metrics=[
            Hallucination(),
            AnswerRelevance(),
            FeedbackSpecificityMetric(),
        ],
        experiment_name="practice-agent-feedback-evaluation",
    )

    # Evaluate challenge calibration
    challenge_results = evaluate(
        dataset=challenge_dataset,
        task=run_practice_crew,
        scoring_metrics=[
            ChallengeCalibrationMetric(),
        ],
        experiment_name="practice-agent-challenge-evaluation",
    )

    return {
        "agent": "practice",
        "feedback_results": feedback_results,
        "challenge_results": challenge_results,
    }


def evaluate_retention_agent(dataset: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Evaluate the Retention agent using intervention effectiveness metrics.

    Args:
        dataset: Optional custom dataset. If not provided, creates a simple test set.

    Returns:
        Evaluation results with aggregate scores.
    """
    if dataset is None:
        # Create a simple retention evaluation dataset
        dataset = [
            {
                "input": {
                    "hobby_name": "guitar",
                    "days_inactive": 5,
                    "current_streak": 0,
                    "session_count": 8,
                    "emotional_history": "frustrated, discouraged",
                    "current_challenge": "Learn E minor chord",
                },
                "reference": "Intervention should acknowledge the gap, offer low-commitment re-entry, and address frustration.",
            },
            {
                "input": {
                    "hobby_name": "painting",
                    "days_inactive": 14,
                    "current_streak": 0,
                    "session_count": 3,
                    "emotional_history": "okay, bored",
                    "current_challenge": "Paint a still life",
                },
                "reference": "Intervention should reignite interest with fresh approach and acknowledge extended break.",
            },
            {
                "input": {
                    "hobby_name": "writing",
                    "days_inactive": 3,
                    "current_streak": 5,
                    "session_count": 15,
                    "emotional_history": "excited, okay",
                    "current_challenge": "Write 500 words",
                },
                "reference": "Gentle nudge to maintain streak with minimal friction.",
            },
        ]

    results = evaluate(
        dataset=dataset,
        task=run_retention_crew,
        scoring_metrics=[
            Hallucination(),
            InterventionEffectivenessMetric(),
        ],
        experiment_name="retention-agent-evaluation",
    )

    return {
        "agent": "retention",
        "dataset_size": len(dataset),
        "results": results,
    }


def run_all_evaluations() -> Dict[str, Any]:
    """
    Run all agent evaluations and return combined results.

    Returns:
        Dictionary containing results for all agents.
    """
    print("Starting comprehensive agent evaluation...")

    print("\n1. Evaluating Discovery Agent...")
    discovery_results = evaluate_discovery_agent()

    print("\n2. Evaluating Practice Agent...")
    practice_results = evaluate_practice_agent()

    print("\n3. Evaluating Retention Agent...")
    retention_results = evaluate_retention_agent()

    return {
        "discovery": discovery_results,
        "practice": practice_results,
        "retention": retention_results,
    }


if __name__ == "__main__":
    # Run all evaluations when executed directly
    results = run_all_evaluations()
    print("\n" + "=" * 50)
    print("EVALUATION COMPLETE")
    print("=" * 50)
    print("\nCheck the Opik dashboard for detailed results.")
