"""
Online Evaluation Rules for Meraki Flow Production.

This module configures automatic scoring for production traces
to enable continuous quality monitoring.
"""

from typing import Any, Dict, Optional
from functools import wraps

from opik import track
from opik.evaluation.metrics import Hallucination, AnswerRelevance

from meraki_flow.tools.opik_metrics import (
    FeedbackSpecificityMetric,
    ChallengeCalibrationMetric,
    InterventionEffectivenessMetric,
    HobbyMatchAccuracyMetric,
)
from meraki_flow.tools.opik_tracking import PROJECT_NAME


# Production project name (separate from dev/testing)
PRODUCTION_PROJECT = "meraki-production"

# Metrics for online scoring
HALLUCINATION_METRIC = Hallucination()
RELEVANCE_METRIC = AnswerRelevance()
FEEDBACK_METRIC = FeedbackSpecificityMetric()
CALIBRATION_METRIC = ChallengeCalibrationMetric()
INTERVENTION_METRIC = InterventionEffectivenessMetric()
HOBBY_MATCH_METRIC = HobbyMatchAccuracyMetric()


def production_tracked(func):
    """
    Decorator to wrap a function with production Opik tracking.

    Applies online scoring metrics for continuous quality monitoring.
    """
    @wraps(func)
    @track(
        project_name=PRODUCTION_PROJECT,
        tags=["production"],
    )
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


@track(
    project_name=PRODUCTION_PROJECT,
    tags=["production", "discovery"],
)
def tracked_discovery_flow(
    hobby_interests: str,
    available_time: str,
    budget: str,
    location: str,
) -> str:
    """
    Production-tracked wrapper for discovery flow.

    This function should wrap calls to DiscoveryCrew in production
    to enable automatic quality monitoring.
    """
    from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew

    inputs = {
        "hobby_interests": hobby_interests,
        "available_time": available_time,
        "budget": budget,
        "location": location,
    }

    result = DiscoveryCrew().crew().kickoff(inputs=inputs)
    return result.raw


@track(
    project_name=PRODUCTION_PROJECT,
    tags=["production", "practice"],
)
def tracked_practice_flow(
    hobby_name: str,
    work_description: str,
    session_count: int,
    emotional_state: str,
    emotional_history: str,
) -> str:
    """
    Production-tracked wrapper for practice flow.

    This function should wrap calls to PracticeCrew in production
    to enable automatic quality monitoring.
    """
    from meraki_flow.crews.practice_crew.practice_crew import PracticeCrew

    inputs = {
        "hobby_name": hobby_name,
        "work_description": work_description,
        "session_count": session_count,
        "emotional_state": emotional_state,
        "emotional_history": emotional_history,
    }

    result = PracticeCrew().crew().kickoff(inputs=inputs)
    return result.raw


@track(
    project_name=PRODUCTION_PROJECT,
    tags=["production", "retention"],
)
def tracked_retention_flow(
    hobby_name: str,
    days_inactive: int,
    current_streak: int,
    session_count: int,
    emotional_history: str,
    current_challenge: str,
) -> str:
    """
    Production-tracked wrapper for retention flow.

    This function should wrap calls to RetentionCrew in production
    to enable automatic quality monitoring.
    """
    from meraki_flow.crews.retention_crew.retention_crew import RetentionCrew

    inputs = {
        "hobby_name": hobby_name,
        "days_inactive": days_inactive,
        "current_streak": current_streak,
        "session_count": session_count,
        "emotional_history": emotional_history,
        "current_challenge": current_challenge,
    }

    result = RetentionCrew().crew().kickoff(inputs=inputs)
    return result.raw


@track(
    project_name=PRODUCTION_PROJECT,
    tags=["production", "sampling"],
)
def tracked_sampling_flow(
    hobby_name: str,
    location: str,
) -> str:
    """
    Production-tracked wrapper for sampling flow.

    This function should wrap calls to SamplingCrew in production
    to enable automatic quality monitoring.
    """
    from meraki_flow.crews.sampling_crew.sampling_crew import SamplingCrew

    inputs = {
        "hobby_name": hobby_name,
        "location": location,
    }

    result = SamplingCrew().crew().kickoff(inputs=inputs)
    return result.raw


class OnlineScorer:
    """
    Helper class for scoring production outputs against quality metrics.

    Use this for manual scoring or batch evaluation of production traces.
    """

    @staticmethod
    def score_discovery_output(
        output: str,
        hobby_interests: str = "",
        available_time: str = "",
        budget: str = "",
    ) -> Dict[str, float]:
        """Score a discovery output against relevant metrics."""
        return {
            "hobby_match_accuracy": HOBBY_MATCH_METRIC.score(
                output=output,
                hobby_interests=hobby_interests,
                available_time=available_time,
                budget=budget,
            ).value,
        }

    @staticmethod
    def score_feedback_output(
        output: str,
        reference: Optional[str] = None,
    ) -> Dict[str, float]:
        """Score a feedback output against relevant metrics."""
        return {
            "feedback_specificity": FEEDBACK_METRIC.score(
                output=output,
                reference=reference,
            ).value,
        }

    @staticmethod
    def score_challenge_output(
        output: str,
        session_count: int = 0,
        emotional_state: str = "",
    ) -> Dict[str, float]:
        """Score a challenge output against calibration metrics."""
        return {
            "challenge_calibration": CALIBRATION_METRIC.score(
                output=output,
                session_count=session_count,
                emotional_state=emotional_state,
            ).value,
        }

    @staticmethod
    def score_intervention_output(
        output: str,
        days_inactive: int = 0,
    ) -> Dict[str, float]:
        """Score an intervention output against effectiveness metrics."""
        return {
            "intervention_effectiveness": INTERVENTION_METRIC.score(
                output=output,
                days_inactive=days_inactive,
            ).value,
        }


# Dashboard configuration documentation
DASHBOARD_CONFIG = """
# Meraki Production Dashboard Configuration

## Key Metrics to Monitor

### Traces & Volume
- Total traces per day (by crew type)
- Traces per user session
- Error rate trends

### Latency
- Average response time by crew
- P95 latency by crew
- Latency distribution over time

### Token Usage & Cost
- Total tokens per crew per day
- Average tokens per request
- Estimated cost tracking

### Quality Scores
- Hallucination rate (target: < 5%)
- Answer relevance (target: > 0.8)
- Feedback specificity (target: > 0.7)
- Challenge calibration (target: > 0.75)
- Intervention effectiveness (target: > 0.7)
- Hobby match accuracy (target: > 0.8)

### A/B Test Metrics
- Conversion rate by variant
- Quality scores by variant
- Statistical significance indicators

## Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error rate | > 5% | > 10% |
| Avg latency | > 30s | > 60s |
| Hallucination | > 10% | > 20% |
| Answer relevance | < 0.7 | < 0.5 |

## Recommended Dashboard Panels

1. **Overview Panel**
   - Total requests (24h)
   - Success rate
   - Avg latency
   - Active users

2. **Crew Performance Panel**
   - Request volume by crew
   - Latency by crew
   - Error rate by crew

3. **Quality Metrics Panel**
   - Quality scores over time
   - Score distributions
   - Low-score trace inspection

4. **Experiment Panel**
   - Variant distribution
   - Metrics by variant
   - Statistical significance

5. **Cost Panel**
   - Token usage trends
   - Cost by crew
   - Cost optimization opportunities
"""


if __name__ == "__main__":
    print("Online Evaluation Rules Module")
    print("=" * 40)
    print("\nAvailable tracked flows:")
    print("  - tracked_discovery_flow")
    print("  - tracked_practice_flow")
    print("  - tracked_retention_flow")
    print("  - tracked_sampling_flow")
    print("\nOnlineScorer methods:")
    print("  - score_discovery_output")
    print("  - score_feedback_output")
    print("  - score_challenge_output")
    print("  - score_intervention_output")
    print("\nProduction project:", PRODUCTION_PROJECT)
    print("\n" + DASHBOARD_CONFIG)
