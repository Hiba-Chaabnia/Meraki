"""Custom Opik evaluation metrics for Meraki agents."""

from opik.evaluation.metrics import base_metric, score_result


class FeedbackSpecificityMetric(base_metric.BaseMetric):
    """
    Scores PracticeFeedbackOutput on how specific vs generic the feedback is.
    Maps to: observations[], growth[], suggestions[], celebration
    """

    def __init__(self, name: str = "feedback_specificity"):
        super().__init__(name=name)

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        output_lower = output.lower()

        specific_indicators = [
            "technique", "brush", "color", "composition", "texture",
            "proportion", "line", "shape", "blend", "layer",
            "contrast", "depth", "perspective", "balance", "rhythm",
            "pressure", "angle", "stroke", "pattern", "form",
        ]
        generic_phrases = [
            "great job", "well done", "nice work", "keep it up",
            "good effort", "looking good", "nice try", "awesome",
        ]

        specificity_count = sum(1 for t in specific_indicators if t in output_lower)
        generic_count = sum(1 for p in generic_phrases if p in output_lower)

        score_val = min(1.0, max(0.0, (specificity_count - generic_count) / 5))

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=f"{specificity_count} specific terms, {generic_count} generic phrases",
        )


class ChallengeCalibrationMetric(base_metric.BaseMetric):
    """
    Scores GeneratedChallenge difficulty against user progression.
    Maps to: difficulty, session_count, days_active
    """

    def __init__(self, name: str = "challenge_calibration"):
        super().__init__(name=name)

    def score(
        self,
        difficulty: str,
        session_count: int,
        **kwargs,
    ) -> score_result.ScoreResult:
        difficulty_map = {"easy": 1, "medium": 2, "hard": 3, "expert": 4}
        diff_val = difficulty_map.get(difficulty.lower(), 2)

        if session_count <= 3:
            expected = 1
        elif session_count <= 10:
            expected = 2
        elif session_count <= 25:
            expected = 3
        else:
            expected = 4

        gap = diff_val - expected
        if gap == 0 or gap == 1:
            score_val = 1.0
        elif gap == -1:
            score_val = 0.6
        else:
            score_val = max(0.0, 1.0 - abs(gap) * 0.3)

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=f"Difficulty '{difficulty}' for {session_count} sessions (expected ~{expected})",
        )


class NudgeUrgencyCalibrationMetric(base_metric.BaseMetric):
    """
    Scores MotivationNudge urgency against actual engagement signals.
    Maps to: nudge_type/urgency, days_since_last_session
    """

    def __init__(self, name: str = "nudge_urgency_calibration"):
        super().__init__(name=name)

    def score(
        self,
        urgency: str,
        days_since_last_session: int,
        **kwargs,
    ) -> score_result.ScoreResult:
        if days_since_last_session <= 3:
            expected = "gentle"
        elif days_since_last_session <= 7:
            expected = "check_in"
        else:
            expected = "re_engage"

        urgency_order = ["gentle", "check_in", "re_engage"]
        actual_idx = urgency_order.index(urgency) if urgency in urgency_order else 1
        expected_idx = urgency_order.index(expected)

        gap = abs(actual_idx - expected_idx)
        score_val = 1.0 - gap * 0.4

        return score_result.ScoreResult(
            value=max(0.0, score_val),
            name=self.name,
            reason=f"Urgency '{urgency}' for {days_since_last_session} days gap (expected '{expected}')",
        )


class RoadmapCompletenessMetric(base_metric.BaseMetric):
    """
    Scores GeneratedRoadmap structural quality.
    Maps to: title, description, phases[] with goals and activities
    """

    def __init__(self, name: str = "roadmap_completeness"):
        super().__init__(name=name)

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        checks = {
            "has_phases": '"phase_number"' in output or '"phases"' in output,
            "has_goals": '"goals"' in output,
            "has_activities": '"suggested_activities"' in output,
            "has_time": '"time_per_week"' in output,
            "has_title": '"title"' in output,
            "has_description": '"description"' in output,
        }

        passed = sum(1 for v in checks.values() if v)
        score_val = passed / len(checks)

        missing = [k for k, v in checks.items() if not v]
        reason = f"{passed}/{len(checks)} structural checks passed"
        if missing:
            reason += f". Missing: {', '.join(missing)}"

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=reason,
        )


class SamplingCompletenessMetric(base_metric.BaseMetric):
    """
    Scores sampling preview output on whether all 3 sections are present:
    recommendation, micro_activity, and videos.
    """

    def __init__(self, name: str = "sampling_completeness"):
        super().__init__(name=name)

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        output_lower = output.lower()

        sections = {
            "recommendation": any(
                kw in output_lower
                for kw in ["recommendation", "sampling_path", "recommended_path", "best_path"]
            ),
            "micro_activity": any(
                kw in output_lower
                for kw in ["micro_activity", "micro activity", "quick_activity", "try_this"]
            ),
            "videos": any(
                kw in output_lower
                for kw in ["video", "youtube", "watch", "curated_videos"]
            ),
        }

        found = sum(1 for v in sections.values() if v)
        score_val = found / 3

        missing = [k for k, v in sections.items() if not v]
        reason = f"{found}/3 sections found"
        if missing:
            reason += f". Missing: {', '.join(missing)}"

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=reason,
        )


class LocalExperiencesCompletenessMetric(base_metric.BaseMetric):
    """
    Scores local experiences output on spot count (70%) and general tips presence (30%).
    """

    def __init__(self, name: str = "local_experiences_completeness"):
        super().__init__(name=name)

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        output_lower = output.lower()

        # Count local spots (look for patterns like numbered items or "name" fields)
        import re
        spot_patterns = re.findall(
            r'"name"\s*:|"spot_name"\s*:|"place_name"\s*:|"local_spot"',
            output_lower,
        )
        spot_count = len(spot_patterns)

        if spot_count == 0:
            spot_score = 0.0
        elif spot_count <= 2:
            spot_score = 0.5
        else:
            spot_score = 1.0

        has_tips = any(
            kw in output_lower
            for kw in ["general_tips", "tips", "advice", "suggestion"]
        )
        tips_score = 1.0 if has_tips else 0.0

        score_val = 0.7 * spot_score + 0.3 * tips_score

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=f"{spot_count} spots found (score={spot_score:.1f}), tips={'yes' if has_tips else 'no'}",
        )


class HobbyMatchDiversityMetric(base_metric.BaseMetric):
    """
    Scores Discovery output on recommendation diversity.
    Good matches should span different hobby categories, not cluster in one type.
    """

    def __init__(self, name: str = "hobby_match_diversity"):
        super().__init__(name=name)

    def score(self, output: str, **kwargs) -> score_result.ScoreResult:
        categories = {
            "visual_arts": ["painting", "drawing", "sketching", "photography", "calligraphy"],
            "crafts": ["pottery", "knitting", "crochet", "woodworking", "sewing", "embroidery"],
            "music": ["guitar", "piano", "ukulele", "singing", "drums"],
            "nature": ["gardening", "birdwatching", "hiking", "foraging", "beekeeping"],
            "culinary": ["cooking", "baking", "fermentation", "bread"],
            "movement": ["yoga", "dance", "martial arts", "climbing"],
            "writing": ["journaling", "poetry", "fiction", "blogging"],
        }

        output_lower = output.lower()
        matched_categories = set()
        for cat, keywords in categories.items():
            if any(kw in output_lower for kw in keywords):
                matched_categories.add(cat)

        score_val = min(1.0, len(matched_categories) / 3)

        return score_result.ScoreResult(
            value=score_val,
            name=self.name,
            reason=f"Recommendations span {len(matched_categories)} categories: {', '.join(matched_categories)}",
        )
