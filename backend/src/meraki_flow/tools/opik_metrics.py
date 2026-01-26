"""
Custom Opik evaluation metrics for Meraki agents.

These metrics measure specific quality dimensions relevant to Meraki's
hobby discovery, practice, and retention flows.
"""

from opik.evaluation.metrics import base_metric, score_result
from typing import Any, Optional
import re


class FeedbackSpecificityMetric(base_metric.BaseMetric):
    """
    Measures how specific and actionable feedback is from the Practice agent.

    Evaluates:
    - Presence of concrete suggestions (not just generic encouragement)
    - Specific references to the user's work
    - Actionable improvement steps
    """

    def __init__(self, name: str = "feedback_specificity"):
        super().__init__(name=name)

    def score(
        self,
        output: str,
        reference: Optional[str] = None,
        **kwargs: Any
    ) -> score_result.ScoreResult:
        """Score the specificity of feedback output."""
        if not output:
            return score_result.ScoreResult(
                name=self.name,
                value=0.0,
                reason="No output provided"
            )

        score = 0.0
        reasons = []

        # Check for specific elements (worth 0.2 each)
        specificity_indicators = [
            (r'\b(try|consider|experiment with|focus on)\b', "Contains actionable verbs"),
            (r'\b(next time|for improvement|to enhance)\b', "Contains forward-looking suggestions"),
            (r'\b(specifically|in particular|notably)\b', "Contains specificity markers"),
            (r'\d+', "Contains specific numbers/quantities"),
            (r'\b(because|since|as a result)\b', "Contains causal explanations"),
        ]

        for pattern, reason in specificity_indicators:
            if re.search(pattern, output, re.IGNORECASE):
                score += 0.2
                reasons.append(reason)

        # Cap at 1.0
        score = min(score, 1.0)

        return score_result.ScoreResult(
            name=self.name,
            value=score,
            reason="; ".join(reasons) if reasons else "No specificity indicators found"
        )


class ChallengeCalibrationMetric(base_metric.BaseMetric):
    """
    Measures how well challenges are calibrated to user skill level.

    Evaluates:
    - Appropriate difficulty progression
    - Consideration of session count
    - Balance between challenge and achievability
    """

    def __init__(self, name: str = "challenge_calibration"):
        super().__init__(name=name)

    def score(
        self,
        output: str,
        session_count: int = 0,
        emotional_state: str = "",
        **kwargs: Any
    ) -> score_result.ScoreResult:
        """Score challenge calibration based on context."""
        if not output:
            return score_result.ScoreResult(
                name=self.name,
                value=0.0,
                reason="No output provided"
            )

        score = 0.0
        reasons = []

        # Check for difficulty indicators
        beginner_terms = r'\b(simple|basic|easy|introductory|fundamental)\b'
        advanced_terms = r'\b(advanced|complex|challenging|intricate)\b'

        has_beginner = bool(re.search(beginner_terms, output, re.IGNORECASE))
        has_advanced = bool(re.search(advanced_terms, output, re.IGNORECASE))

        # Early sessions should have beginner content
        if session_count <= 3:
            if has_beginner and not has_advanced:
                score += 0.5
                reasons.append("Appropriate beginner-level content for new user")
            elif has_advanced:
                score += 0.1
                reasons.append("Advanced content may be too difficult for new user")
        # Mid sessions can have mixed
        elif session_count <= 10:
            if has_beginner or has_advanced:
                score += 0.4
                reasons.append("Appropriate progression for intermediate user")
        # Later sessions should allow advanced
        else:
            if has_advanced:
                score += 0.5
                reasons.append("Advanced content appropriate for experienced user")

        # Check for emotional consideration
        if emotional_state in ["frustrated", "discouraged"]:
            if has_beginner:
                score += 0.3
                reasons.append("Adjusted difficulty for emotional state")
        else:
            score += 0.2
            reasons.append("Standard progression applied")

        # Check for progressive language
        if re.search(r'\b(build on|next step|progress|level up)\b', output, re.IGNORECASE):
            score += 0.2
            reasons.append("Contains progression language")

        score = min(score, 1.0)

        return score_result.ScoreResult(
            name=self.name,
            value=score,
            reason="; ".join(reasons) if reasons else "Could not assess calibration"
        )


class InterventionEffectivenessMetric(base_metric.BaseMetric):
    """
    Measures the potential effectiveness of retention interventions.

    Evaluates:
    - Personalization to user situation
    - Motivational framing
    - Concrete re-engagement actions
    """

    def __init__(self, name: str = "intervention_effectiveness"):
        super().__init__(name=name)

    def score(
        self,
        output: str,
        days_inactive: int = 0,
        **kwargs: Any
    ) -> score_result.ScoreResult:
        """Score intervention effectiveness."""
        if not output:
            return score_result.ScoreResult(
                name=self.name,
                value=0.0,
                reason="No output provided"
            )

        score = 0.0
        reasons = []

        # Check for empathy/acknowledgment (0.2)
        empathy_patterns = r'\b(understand|know that|it\'s okay|normal to)\b'
        if re.search(empathy_patterns, output, re.IGNORECASE):
            score += 0.2
            reasons.append("Shows empathy")

        # Check for concrete actions (0.3)
        action_patterns = r'\b(start with|begin by|try|take|spend|set aside)\b'
        if re.search(action_patterns, output, re.IGNORECASE):
            score += 0.3
            reasons.append("Provides concrete actions")

        # Check for small commitment framing (0.2)
        small_commitment = r'\b(just \d+|only \d+|quick|brief|small|simple)\b'
        if re.search(small_commitment, output, re.IGNORECASE):
            score += 0.2
            reasons.append("Uses low-commitment framing")

        # Check for positive framing (0.15)
        positive_patterns = r'\b(opportunity|fresh start|reconnect|rediscover|joy)\b'
        if re.search(positive_patterns, output, re.IGNORECASE):
            score += 0.15
            reasons.append("Uses positive framing")

        # Adjust based on inactivity period
        if days_inactive >= 7:
            # Longer absence needs gentler re-entry
            if re.search(r'\b(no pressure|whenever|at your pace)\b', output, re.IGNORECASE):
                score += 0.15
                reasons.append("Appropriate low-pressure approach for extended absence")

        score = min(score, 1.0)

        return score_result.ScoreResult(
            name=self.name,
            value=score,
            reason="; ".join(reasons) if reasons else "Limited intervention indicators found"
        )


class HobbyMatchAccuracyMetric(base_metric.BaseMetric):
    """
    Measures how well hobby recommendations match user preferences.

    Evaluates:
    - Alignment with stated interests
    - Consideration of constraints (time, budget, location)
    - Diversity of recommendations
    """

    def __init__(self, name: str = "hobby_match_accuracy"):
        super().__init__(name=name)

    def score(
        self,
        output: str,
        hobby_interests: str = "",
        available_time: str = "",
        budget: str = "",
        **kwargs: Any
    ) -> score_result.ScoreResult:
        """Score hobby recommendation accuracy."""
        if not output:
            return score_result.ScoreResult(
                name=self.name,
                value=0.0,
                reason="No output provided"
            )

        score = 0.0
        reasons = []

        # Check interest alignment (0.4)
        if hobby_interests:
            interests = [i.strip().lower() for i in hobby_interests.split(",")]
            output_lower = output.lower()
            matched_interests = sum(1 for i in interests if i in output_lower)
            if interests:
                interest_score = min(matched_interests / len(interests), 1.0) * 0.4
                score += interest_score
                if interest_score > 0:
                    reasons.append(f"Matched {matched_interests}/{len(interests)} interests")

        # Check time consideration (0.2)
        time_keywords = r'\b(time|hour|minute|weekly|daily|quick|extended)\b'
        if re.search(time_keywords, output, re.IGNORECASE):
            score += 0.2
            reasons.append("Considers time constraints")

        # Check budget consideration (0.2)
        budget_keywords = r'\b(budget|cost|free|affordable|expensive|investment)\b'
        if re.search(budget_keywords, output, re.IGNORECASE):
            score += 0.2
            reasons.append("Considers budget constraints")

        # Check for multiple recommendations (0.2)
        recommendation_count = len(re.findall(r'\d+[\.\)]\s+\w+', output))
        if recommendation_count >= 3:
            score += 0.2
            reasons.append(f"Provides {recommendation_count} diverse options")
        elif recommendation_count >= 1:
            score += 0.1
            reasons.append(f"Provides {recommendation_count} option(s)")

        score = min(score, 1.0)

        return score_result.ScoreResult(
            name=self.name,
            value=score,
            reason="; ".join(reasons) if reasons else "Could not assess match accuracy"
        )
