"""
Persistent Opik evaluation datasets for all 7 Meraki crews.

Creates curated test cases for batch evaluation. Uses 'meraki-eval-*' namespace
to avoid conflicts with optimization datasets ('meraki-*-optimization').

IMPORTANT: Each dataset item's crew_inputs must contain ALL template variables
expected by the crew's tasks.yaml, otherwise CrewAI will raise a missing variable error.

Usage:
    python -m meraki_flow.evaluation.datasets              # create all
    python -m meraki_flow.evaluation.datasets --only discovery challenges
    python -m meraki_flow.evaluation.datasets --reset      # delete + recreate
"""

import argparse
import json
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent.parent.parent / ".env")

import opik


def _get_client() -> opik.Opik:
    opik.configure(use_local=False)
    return opik.Opik()


# ---------------------------------------------------------------------------
# Dataset definitions
# ---------------------------------------------------------------------------

def create_discovery_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Discovery crew expects q1-q22 template variables."""
    name = "meraki-eval-discovery"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for DiscoveryCrew — hobby recommendation quality",
    )

    dataset.insert([
        {
            "input": "Budget-limited solo creative seeking stress relief in small apartment",
            "expected_output": (
                "Should recommend apartment-friendly tactile hobbies under $30/month. "
                "Knitting (90%+), Drawing/Sketching (85%+), Origami (80%+). "
                "Must address space/budget constraints in reasoning."
            ),
            "metadata": {
                "scenario": "budget_limited",
                "crew_inputs": {
                    "q1_time_available": "2 hours per week",
                    "q2_practice_timing": "evenings",
                    "q3_session_preference": "short bursts (15-30 min)",
                    "q4_creative_type": "making things with my hands",
                    "q5_structure_preference": "guided at first, then freestyle",
                    "q6_mess_tolerance": "don't mind a little mess",
                    "q7_learning_method": "YouTube tutorials",
                    "q8_mistake_attitude": "learn from them",
                    "q9_practice_location": "small apartment",
                    "q10_social_preference": "solo",
                    "q11_initial_budget": "under $30/month",
                    "q12_ongoing_costs": "prefer low ongoing costs",
                    "q13_try_before_commit": "yes, definitely want to try first",
                    "q14_motivations": "stress relief and mindfulness",
                    "q15_resonates": "creating something tangible",
                    "q16_learning_curve": "patient, willing to practice",
                    "q17_sensory_experience": "tactile — love the feel of materials",
                    "q18_senses_to_engage": "touch and sight",
                    "q19_physical_constraints": "none",
                    "q20_seasonal_preference": "indoor year-round",
                    "q21_dream_hobby": "always wanted to try pottery but worried about space",
                    "q22_barriers": "cost and space concerns",
                },
            },
        },
        {
            "input": "Visual artist seeking skill mastery with group classes",
            "expected_output": (
                "Should include visual arts with class availability. "
                "Watercolor (92%+), Pottery (88%+), Photography (85%+). "
                "Should reassure about talent not being a prerequisite."
            ),
            "metadata": {
                "scenario": "visual_artist",
                "crew_inputs": {
                    "q1_time_available": "5 hours per week",
                    "q2_practice_timing": "weekends",
                    "q3_session_preference": "long immersive sessions (1-2 hours)",
                    "q4_creative_type": "visual art — painting, drawing, photography",
                    "q5_structure_preference": "structured classes and curriculum",
                    "q6_mess_tolerance": "bring it on!",
                    "q7_learning_method": "in-person classes",
                    "q8_mistake_attitude": "mistakes are part of the process",
                    "q9_practice_location": "suburban house with garage",
                    "q10_social_preference": "group preferred",
                    "q11_initial_budget": "up to $100/month",
                    "q12_ongoing_costs": "willing to invest in quality",
                    "q13_try_before_commit": "like to research first",
                    "q14_motivations": "skill mastery and personal growth",
                    "q15_resonates": "producing beautiful work",
                    "q16_learning_curve": "loves the challenge",
                    "q17_sensory_experience": "visual — love beautiful imagery",
                    "q18_senses_to_engage": "sight",
                    "q19_physical_constraints": "none",
                    "q20_seasonal_preference": "both indoor and outdoor",
                    "q21_dream_hobby": "painting — always admired painters",
                    "q22_barriers": "worried about lack of talent",
                },
            },
        },
        {
            "input": "Time-limited person with hand mobility issues seeking relaxation",
            "expected_output": (
                "Must respect hand mobility constraint. Low-time, low-cost. "
                "Houseplants (88%+), Journaling (85%+). "
                "Should frame 1hr/week as enough."
            ),
            "metadata": {
                "scenario": "time_limited",
                "crew_inputs": {
                    "q1_time_available": "1 hour per week",
                    "q2_practice_timing": "whenever I have free time",
                    "q3_session_preference": "micro sessions (5-15 min)",
                    "q4_creative_type": "relaxing and calming activities",
                    "q5_structure_preference": "self-guided, go at my own pace",
                    "q6_mess_tolerance": "prefer clean activities",
                    "q7_learning_method": "apps and books",
                    "q8_mistake_attitude": "prefer low-stakes activities",
                    "q9_practice_location": "apartment",
                    "q10_social_preference": "solo",
                    "q11_initial_budget": "under $20/month",
                    "q12_ongoing_costs": "minimal ongoing costs",
                    "q13_try_before_commit": "just want to start something",
                    "q14_motivations": "relaxation and fun",
                    "q15_resonates": "the process itself, not the result",
                    "q16_learning_curve": "want quick wins early",
                    "q17_sensory_experience": "visual — appreciate aesthetics",
                    "q18_senses_to_engage": "sight and touch",
                    "q19_physical_constraints": "limited hand mobility",
                    "q20_seasonal_preference": "indoor",
                    "q21_dream_hobby": "something creative but easy on my hands",
                    "q22_barriers": "not enough time and hand mobility concerns",
                },
            },
        },
        {
            "input": "Nature lover with yard seeking creative self-expression",
            "expected_output": (
                "Should bridge nature and creativity with yard access. "
                "Gardening (92%+), Herb garden (88%+), Nature photography (82%+). "
                "Should provide clear 'where to start' guidance."
            ),
            "metadata": {
                "scenario": "nature_lover",
                "crew_inputs": {
                    "q1_time_available": "3 hours per week",
                    "q2_practice_timing": "mornings",
                    "q3_session_preference": "medium focused sessions (30-60 min)",
                    "q4_creative_type": "both the process and the results matter",
                    "q5_structure_preference": "mix of guided and free exploration",
                    "q6_mess_tolerance": "moderate — some mess is fine",
                    "q7_learning_method": "mix of video and hands-on practice",
                    "q8_mistake_attitude": "okay with some frustration",
                    "q9_practice_location": "house with yard",
                    "q10_social_preference": "sometimes alone, sometimes with friends",
                    "q11_initial_budget": "$50/month",
                    "q12_ongoing_costs": "moderate ongoing costs okay",
                    "q13_try_before_commit": "sample before committing",
                    "q14_motivations": "express myself creatively",
                    "q15_resonates": "making unique, one-of-a-kind things",
                    "q16_learning_curve": "moderate patience",
                    "q17_sensory_experience": "tactile and visual",
                    "q18_senses_to_engage": "touch, sight, and smell",
                    "q19_physical_constraints": "none",
                    "q20_seasonal_preference": "enjoy seasonal changes",
                    "q21_dream_hobby": "something connected to nature",
                    "q22_barriers": "don't know where to start",
                },
            },
        },
        {
            "input": "Maximum freedom — high budget, lots of time, no constraints",
            "expected_output": (
                "With maximum freedom, should recommend diverse high-engagement hobbies. "
                "At least 3 different categories represented. "
                "Reasoning should highlight variety and depth potential."
            ),
            "metadata": {
                "scenario": "max_freedom",
                "crew_inputs": {
                    "q1_time_available": "10+ hours per week",
                    "q2_practice_timing": "flexible — mornings, evenings, weekends",
                    "q3_session_preference": "long immersive sessions",
                    "q4_creative_type": "open to everything",
                    "q5_structure_preference": "mix of both",
                    "q6_mess_tolerance": "no problem with mess",
                    "q7_learning_method": "all methods — classes, videos, books, practice",
                    "q8_mistake_attitude": "love learning from mistakes",
                    "q9_practice_location": "urban loft with dedicated studio space",
                    "q10_social_preference": "both solo and group",
                    "q11_initial_budget": "up to $200/month",
                    "q12_ongoing_costs": "happy to invest",
                    "q13_try_before_commit": "love trying new things",
                    "q14_motivations": "personal growth, creativity, social connection, and fun",
                    "q15_resonates": "mastery and beautiful results",
                    "q16_learning_curve": "loves the challenge — the harder the better",
                    "q17_sensory_experience": "all senses engaged",
                    "q18_senses_to_engage": "sight, touch, sound, smell",
                    "q19_physical_constraints": "none",
                    "q20_seasonal_preference": "both indoor and outdoor year-round",
                    "q21_dream_hobby": "want to explore many things",
                    "q22_barriers": "just need direction",
                },
            },
        },
        {
            "input": "Contradictory signals — wheelchair user, hates mess but loves pottery",
            "expected_output": (
                "Should navigate contradictory signals gracefully. "
                "Must respect wheelchair accessibility. "
                "Pottery is possible seated — should acknowledge the mess concern. "
                "Should not recommend competitive hobbies that conflict with stress relief."
            ),
            "metadata": {
                "scenario": "contradictory_signals",
                "crew_inputs": {
                    "q1_time_available": "30 minutes per week",
                    "q2_practice_timing": "evenings",
                    "q3_session_preference": "short bursts",
                    "q4_creative_type": "hate getting messy but love the idea of pottery",
                    "q5_structure_preference": "highly structured",
                    "q6_mess_tolerance": "strongly prefer clean",
                    "q7_learning_method": "video tutorials",
                    "q8_mistake_attitude": "frustrating but willing to try",
                    "q9_practice_location": "spacious house",
                    "q10_social_preference": "solo",
                    "q11_initial_budget": "up to $500/month",
                    "q12_ongoing_costs": "money is not an issue",
                    "q13_try_before_commit": "want to research thoroughly",
                    "q14_motivations": "stress relief but also want some competition",
                    "q15_resonates": "tangible results I can show off",
                    "q16_learning_curve": "prefer easy wins",
                    "q17_sensory_experience": "tactile",
                    "q18_senses_to_engage": "touch and sight",
                    "q19_physical_constraints": "wheelchair user — need seated activities",
                    "q20_seasonal_preference": "indoor",
                    "q21_dream_hobby": "pottery",
                    "q22_barriers": "wheelchair accessibility and mess concerns",
                },
            },
        },
    ])

    return dataset


def create_sampling_preview_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Sampling preview crew expects: hobby_name, quiz_answers."""
    name = "meraki-eval-sampling-preview"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for SamplingPreviewCrew — preview content quality",
    )

    dataset.insert([
        {
            "input": "Watercolor painting beginner who prefers video learning",
            "expected_output": (
                "Should include: recommendation for Watch path (video learner), "
                "a simple micro activity (e.g. color mixing on paper), "
                "and 3+ curated beginner-friendly YouTube videos."
            ),
            "metadata": {
                "scenario": "creative_hobby",
                "crew_inputs": {
                    "hobby_name": "watercolor painting",
                    "quiz_answers": "Prefers video learning, visual art, solo, wants to start gently",
                },
            },
        },
        {
            "input": "Yoga enthusiast who wants to try immediately",
            "expected_output": (
                "Should include: recommendation for Micro path (wants to try now), "
                "a 5-minute micro activity (simple pose sequence), "
                "and beginner yoga videos."
            ),
            "metadata": {
                "scenario": "physical_hobby",
                "crew_inputs": {
                    "hobby_name": "yoga",
                    "quiz_answers": "Wants physical and calming activity, prefers trying immediately, solo",
                },
            },
        },
        {
            "input": "Technically-minded 3D printing hobbyist",
            "expected_output": (
                "Should include: recommendation mentioning technical resources, "
                "a micro activity (e.g. design a simple shape in TinkerCAD), "
                "and tutorial videos on beginner 3D printing."
            ),
            "metadata": {
                "scenario": "technical_hobby",
                "crew_inputs": {
                    "hobby_name": "3D printing",
                    "quiz_answers": "Technically minded, has some experience, likes structured learning",
                },
            },
        },
        {
            "input": "Curious person exploring fermentation",
            "expected_output": (
                "Should include: recommendation for a gentle start path, "
                "a micro activity (e.g. make a simple sauerkraut jar), "
                "and introductory videos about fermentation."
            ),
            "metadata": {
                "scenario": "niche_hobby",
                "crew_inputs": {
                    "hobby_name": "fermentation",
                    "quiz_answers": "Curious about niche hobbies, enjoys science, patient learner",
                },
            },
        },
        {
            "input": "Creative writer open to all paths",
            "expected_output": (
                "Should include: recommendation with reasoning for chosen path, "
                "a micro activity (e.g. write a 6-word story), "
                "and writing-related videos or workshops."
            ),
            "metadata": {
                "scenario": "broad_hobby",
                "crew_inputs": {
                    "hobby_name": "creative writing",
                    "quiz_answers": "Open to all paths, loves words and stories, solo, wants relaxation and expression",
                },
            },
        },
    ])

    return dataset


def create_local_experiences_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Local experiences crew expects: hobby_name, location."""
    name = "meraki-eval-local-experiences"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for LocalExperiencesCrew — local spot discovery",
    )

    dataset.insert([
        {
            "input": "Pottery in New York, NY",
            "expected_output": (
                "Should find 3+ pottery studios/classes in NYC. "
                "Each with name, address, beginner-friendliness note. "
                "Include general tips for first pottery class."
            ),
            "metadata": {
                "scenario": "urban",
                "crew_inputs": {"hobby_name": "pottery", "location": "New York, NY"},
            },
        },
        {
            "input": "Gardening in suburban Denver, CO",
            "expected_output": (
                "Should find garden centers, community gardens, or workshops. "
                "At least 2 spots with practical details. "
                "Tips should mention Denver's climate/altitude considerations."
            ),
            "metadata": {
                "scenario": "suburban",
                "crew_inputs": {"hobby_name": "gardening", "location": "Denver, CO"},
            },
        },
        {
            "input": "Woodworking in rural Vermont",
            "expected_output": (
                "May find fewer spots — should gracefully handle limited results. "
                "Include online alternatives or nearby city options. "
                "General tips for getting started with woodworking at home."
            ),
            "metadata": {
                "scenario": "small_town",
                "crew_inputs": {"hobby_name": "woodworking", "location": "rural Vermont"},
            },
        },
        {
            "input": "Calligraphy in Paris, France",
            "expected_output": (
                "Should find calligraphy workshops or ateliers in Paris. "
                "Results should be relevant to the international location. "
                "Tips should be universally applicable."
            ),
            "metadata": {
                "scenario": "international",
                "crew_inputs": {"hobby_name": "calligraphy", "location": "Paris, France"},
            },
        },
    ])

    return dataset


def create_practice_feedback_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Practice feedback crew expects: hobby_name, session_type, duration, mood, notes, recent_sessions, completed_challenges, image_url."""
    name = "meraki-eval-practice-feedback"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for PracticeFeedbackCrew — session feedback quality",
    )

    dataset.insert([
        {
            "input": "Beginner watercolor session — first time mixing colors",
            "expected_output": (
                "Feedback should be warm and encouraging for a beginner. "
                "Should mention specific technique (color mixing). "
                "Should celebrate experimentation over perfection."
            ),
            "metadata": {
                "scenario": "beginner",
                "crew_inputs": {
                    "hobby_name": "watercolor",
                    "session_type": "free practice",
                    "duration": "30",
                    "mood": "happy",
                    "notes": "Tried mixing colors for the first time. Made a mess but liked the result.",
                    "recent_sessions": "2 sessions total, both free practice",
                    "completed_challenges": "none yet",
                    "image_url": "",
                },
            },
        },
        {
            "input": "Frustrated guitarist struggling with barre chords",
            "expected_output": (
                "Must acknowledge frustration empathetically. "
                "Should normalize barre chord difficulty as a common plateau. "
                "Suggest specific techniques (finger placement, capo alternative)."
            ),
            "metadata": {
                "scenario": "frustrated_intermediate",
                "crew_inputs": {
                    "hobby_name": "guitar",
                    "session_type": "technique practice",
                    "duration": "45",
                    "mood": "frustrated",
                    "notes": "Can't get barre chords right. Fingers hurt. Thinking about quitting.",
                    "recent_sessions": "8 sessions, mix of chord practice and strumming",
                    "completed_challenges": "Open chords challenge",
                    "image_url": "",
                },
            },
        },
        {
            "input": "Focused potter throwing first cylinder on wheel",
            "expected_output": (
                "Should acknowledge the milestone of first wheel-thrown piece. "
                "Specific feedback on wall thickness and centering. "
                "Suggest next steps for improving wall evenness."
            ),
            "metadata": {
                "scenario": "advanced",
                "crew_inputs": {
                    "hobby_name": "pottery",
                    "session_type": "wheel throwing",
                    "duration": "90",
                    "mood": "focused",
                    "notes": "Threw my first cylinder on the wheel. Walls were uneven but it held shape.",
                    "recent_sessions": "15 sessions including pinch pots and coil building",
                    "completed_challenges": "Pinch pot, Coil pot, Wall thickness drill",
                    "image_url": "",
                },
            },
        },
        {
            "input": "Quick 10-min lunch break sketch",
            "expected_output": (
                "Should validate micro sessions as valuable practice. "
                "Comment on observational drawing skills. "
                "Keep feedback proportional to the short session length."
            ),
            "metadata": {
                "scenario": "micro_session",
                "crew_inputs": {
                    "hobby_name": "sketching",
                    "session_type": "observational drawing",
                    "duration": "10",
                    "mood": "neutral",
                    "notes": "Quick lunch break sketch of my coffee cup.",
                    "recent_sessions": "20 sessions, mostly quick sketches",
                    "completed_challenges": "Contour drawing, Object study",
                    "image_url": "",
                },
            },
        },
        {
            "input": "Proud watercolorist who painted a landscape with photo",
            "expected_output": (
                "Should reference the image if available. "
                "Comment on composition, color choices, technique. "
                "Celebrate the pride and encourage sharing."
            ),
            "metadata": {
                "scenario": "session_with_image",
                "crew_inputs": {
                    "hobby_name": "watercolor",
                    "session_type": "landscape painting",
                    "duration": "60",
                    "mood": "proud",
                    "notes": "Painted a landscape from my balcony view. Really happy with the sky gradient.",
                    "recent_sessions": "12 sessions, progressing from color mixing to full scenes",
                    "completed_challenges": "Color mixing, Wet-on-wet technique",
                    "image_url": "https://example.com/photo.jpg",
                },
            },
        },
    ])

    return dataset


def create_challenges_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Challenge generation crew expects: hobby_name, session_count, avg_duration, mood_distribution, days_active, completed_challenges, skipped_challenges, recent_feedback, last_mood_trend."""
    name = "meraki-eval-challenges"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for ChallengeGenerationCrew — challenge calibration",
    )

    dataset.insert([
        {
            "input": "Early watercolor learner with improving mood",
            "expected_output": json.dumps({
                "difficulty": "easy",
                "skills": ["color mixing", "gradient"],
                "estimated_time": "30 minutes",
            }),
            "metadata": {
                "scenario": "early_happy_learner",
                "crew_inputs": {
                    "hobby_name": "watercolor",
                    "session_count": "5",
                    "avg_duration": "30 minutes",
                    "mood_distribution": "happy 60%, neutral 30%, frustrated 10%",
                    "days_active": "14",
                    "completed_challenges": "Paint a simple fruit",
                    "skipped_challenges": "none",
                    "recent_feedback": "Good color mixing intuition",
                    "last_mood_trend": "improving",
                },
            },
        },
        {
            "input": "Intermediate potter with stable engagement",
            "expected_output": json.dumps({
                "difficulty": "medium",
                "skills": ["handle attachment", "form exploration"],
                "estimated_time": "60 minutes",
            }),
            "metadata": {
                "scenario": "intermediate_steady",
                "crew_inputs": {
                    "hobby_name": "pottery",
                    "session_count": "12",
                    "avg_duration": "60 minutes",
                    "mood_distribution": "happy 40%, neutral 40%, frustrated 20%",
                    "days_active": "30",
                    "completed_challenges": "Pinch pot, Coil pot",
                    "skipped_challenges": "Glaze techniques",
                    "recent_feedback": "Good wall thickness control",
                    "last_mood_trend": "stable",
                },
            },
        },
        {
            "input": "Confident knitter ready for color work",
            "expected_output": json.dumps({
                "difficulty": "medium",
                "skills": ["color changes", "circular knitting"],
                "estimated_time": "2-3 sessions",
            }),
            "metadata": {
                "scenario": "confident_knitter",
                "crew_inputs": {
                    "hobby_name": "knitting",
                    "session_count": "8",
                    "avg_duration": "45 minutes",
                    "mood_distribution": "happy 70%, calm 20%, neutral 10%",
                    "days_active": "21",
                    "completed_challenges": "Basic scarf, Dishcloth",
                    "skipped_challenges": "Cable knit pattern",
                    "recent_feedback": "Even tension, consistent gauge",
                    "last_mood_trend": "confident",
                },
            },
        },
        {
            "input": "Eager photographer with strong composition skills",
            "expected_output": json.dumps({
                "difficulty": "medium",
                "skills": ["perspective", "creative framing"],
                "estimated_time": "45 minutes",
            }),
            "metadata": {
                "scenario": "eager_photographer",
                "crew_inputs": {
                    "hobby_name": "photography",
                    "session_count": "15",
                    "avg_duration": "90 minutes",
                    "mood_distribution": "excited 50%, happy 30%, frustrated 20%",
                    "days_active": "45",
                    "completed_challenges": "Rule of thirds, Golden hour shoot",
                    "skipped_challenges": "Manual exposure challenge",
                    "recent_feedback": "Great composition instincts",
                    "last_mood_trend": "eager for more",
                },
            },
        },
        {
            "input": "Advanced guitarist ready for hard challenges",
            "expected_output": json.dumps({
                "difficulty": "hard",
                "skills": ["improvisation", "music theory application"],
                "estimated_time": "60 minutes",
            }),
            "metadata": {
                "scenario": "advanced_guitarist",
                "crew_inputs": {
                    "hobby_name": "guitar",
                    "session_count": "25",
                    "avg_duration": "60 minutes",
                    "mood_distribution": "happy 50%, focused 40%, frustrated 10%",
                    "days_active": "90",
                    "completed_challenges": "Open chords, Barre chords, Fingerpicking intro",
                    "skipped_challenges": "none",
                    "recent_feedback": "Solid rhythm, clean chord transitions",
                    "last_mood_trend": "confident",
                },
            },
        },
        {
            "input": "Nervous sketching beginner — brand new",
            "expected_output": json.dumps({
                "difficulty": "easy",
                "skills": ["quick observation", "letting go of perfection"],
                "estimated_time": "10 minutes",
            }),
            "metadata": {
                "scenario": "nervous_beginner",
                "crew_inputs": {
                    "hobby_name": "sketching",
                    "session_count": "3",
                    "avg_duration": "20 minutes",
                    "mood_distribution": "neutral 50%, nervous 50%",
                    "days_active": "7",
                    "completed_challenges": "none",
                    "skipped_challenges": "none",
                    "recent_feedback": "none yet",
                    "last_mood_trend": "nervous",
                },
            },
        },
    ])

    return dataset


def create_motivation_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Motivation crew expects: hobby_name, days_since_last_session, recent_moods, challenge_skip_rate, current_streak, longest_streak, session_frequency_trend."""
    name = "meraki-eval-motivation"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for MotivationCrew — nudge urgency calibration",
    )

    dataset.insert([
        {
            "input": "Active guitarist on a 5-day streak",
            "expected_output": json.dumps({
                "urgency": "gentle",
                "nudge_type": "streak_reminder",
            }),
            "metadata": {
                "scenario": "active_streaker",
                "crew_inputs": {
                    "hobby_name": "guitar",
                    "days_since_last_session": "2",
                    "recent_moods": "happy, happy, neutral",
                    "challenge_skip_rate": "0.1",
                    "current_streak": "5",
                    "longest_streak": "7",
                    "session_frequency_trend": "stable",
                },
            },
        },
        {
            "input": "Frustrated painter with declining engagement",
            "expected_output": json.dumps({
                "urgency": "check_in",
                "nudge_type": "empathy",
            }),
            "metadata": {
                "scenario": "frustrated_declining",
                "crew_inputs": {
                    "hobby_name": "painting",
                    "days_since_last_session": "6",
                    "recent_moods": "frustrated, neutral, frustrated",
                    "challenge_skip_rate": "0.4",
                    "current_streak": "0",
                    "longest_streak": "3",
                    "session_frequency_trend": "declining",
                },
            },
        },
        {
            "input": "Knitter inactive for 2 weeks",
            "expected_output": json.dumps({
                "urgency": "re_engage",
                "nudge_type": "fresh_start",
            }),
            "metadata": {
                "scenario": "long_inactive",
                "crew_inputs": {
                    "hobby_name": "knitting",
                    "days_since_last_session": "14",
                    "recent_moods": "none recorded",
                    "challenge_skip_rate": "0.8",
                    "current_streak": "0",
                    "longest_streak": "4",
                    "session_frequency_trend": "inactive",
                },
            },
        },
        {
            "input": "Sketcher with slight engagement dip",
            "expected_output": json.dumps({
                "urgency": "gentle",
                "nudge_type": "micro_challenge",
            }),
            "metadata": {
                "scenario": "slight_dip",
                "crew_inputs": {
                    "hobby_name": "sketching",
                    "days_since_last_session": "4",
                    "recent_moods": "neutral, happy, neutral",
                    "challenge_skip_rate": "0.2",
                    "current_streak": "2",
                    "longest_streak": "10",
                    "session_frequency_trend": "slightly declining",
                },
            },
        },
        {
            "input": "Frustrated potter considering quitting",
            "expected_output": json.dumps({
                "urgency": "re_engage",
                "nudge_type": "reframe",
            }),
            "metadata": {
                "scenario": "frustrated_dropout",
                "crew_inputs": {
                    "hobby_name": "pottery",
                    "days_since_last_session": "10",
                    "recent_moods": "frustrated, frustrated, sad",
                    "challenge_skip_rate": "0.6",
                    "current_streak": "0",
                    "longest_streak": "8",
                    "session_frequency_trend": "sharp decline",
                },
            },
        },
    ])

    return dataset


def create_roadmap_dataset(client: opik.Opik, reset: bool = False) -> opik.Dataset:
    """Roadmap crew expects: hobby_name, session_count, avg_duration, days_active, completed_challenges, user_goals."""
    name = "meraki-eval-roadmap"
    if reset:
        try:
            client.delete_dataset(name=name)
        except Exception:
            pass

    dataset = client.get_or_create_dataset(
        name=name,
        description="Evaluation dataset for RoadmapCrew — learning path structure",
    )

    dataset.insert([
        {
            "input": "Complete watercolor beginner wanting to learn basics",
            "expected_output": (
                "Roadmap should have 3+ phases starting from absolute beginner. "
                "Phase 1 should focus on materials and simple exercises. "
                "Must include title, description, phases with goals and activities."
            ),
            "metadata": {
                "scenario": "beginner",
                "crew_inputs": {
                    "hobby_name": "watercolor",
                    "session_count": "0",
                    "avg_duration": "0",
                    "days_active": "0",
                    "completed_challenges": "none",
                    "user_goals": "Learn the basics and have fun",
                },
            },
        },
        {
            "input": "Early guitar learner wanting to play songs",
            "expected_output": (
                "Roadmap should build on basic knowledge. "
                "Should include chord progression practice and song learning phases. "
                "Time estimates should be realistic for someone with 2 weeks experience."
            ),
            "metadata": {
                "scenario": "early_learner",
                "crew_inputs": {
                    "hobby_name": "guitar",
                    "session_count": "5",
                    "avg_duration": "30 minutes",
                    "days_active": "14",
                    "completed_challenges": "Basic open chords",
                    "user_goals": "Play my favorite songs",
                },
            },
        },
        {
            "input": "Intermediate potter wanting functional kitchen pieces",
            "expected_output": (
                "Roadmap should acknowledge existing skills. "
                "Should focus on functional pottery (mugs, bowls, plates). "
                "Include glazing and firing phases."
            ),
            "metadata": {
                "scenario": "intermediate",
                "crew_inputs": {
                    "hobby_name": "pottery",
                    "session_count": "15",
                    "avg_duration": "60 minutes",
                    "days_active": "45",
                    "completed_challenges": "Pinch pot, Coil pot, First cylinder",
                    "user_goals": "Make functional pieces for my kitchen",
                },
            },
        },
        {
            "input": "Advanced photographer wanting to sell prints",
            "expected_output": (
                "Roadmap should target portfolio-building and commercial skills. "
                "Include editing, curation, portfolio presentation phases. "
                "Should address the business/selling aspect in later phases."
            ),
            "metadata": {
                "scenario": "advanced_with_goals",
                "crew_inputs": {
                    "hobby_name": "photography",
                    "session_count": "30",
                    "avg_duration": "90 minutes",
                    "days_active": "120",
                    "completed_challenges": "Rule of thirds, Golden hour, Manual exposure, Portrait basics",
                    "user_goals": "Start a portfolio and maybe sell prints",
                },
            },
        },
    ])

    return dataset


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

DATASET_CREATORS = {
    "discovery": create_discovery_dataset,
    "sampling_preview": create_sampling_preview_dataset,
    "local_experiences": create_local_experiences_dataset,
    "practice_feedback": create_practice_feedback_dataset,
    "challenges": create_challenges_dataset,
    "motivation": create_motivation_dataset,
    "roadmap": create_roadmap_dataset,
}


def create_all_datasets(only: list[str] | None = None, reset: bool = False):
    client = _get_client()
    targets = only or list(DATASET_CREATORS.keys())

    for name in targets:
        creator = DATASET_CREATORS.get(name)
        if not creator:
            print(f"[WARN] Unknown dataset: {name}, skipping")
            continue
        print(f"Creating dataset: meraki-eval-{name} ...")
        ds = creator(client, reset=reset)
        print(f"  -> {ds.name} ready")

    print("\nAll evaluation datasets created successfully.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Create Meraki evaluation datasets in Opik")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=list(DATASET_CREATORS.keys()),
        help="Only create specific datasets",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete and recreate datasets (destructive)",
    )
    args = parser.parse_args()

    create_all_datasets(only=args.only, reset=args.reset)


if __name__ == "__main__":
    main()
