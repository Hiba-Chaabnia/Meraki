"""
Challenge Agent Prompt Optimizer.

Uses FewShotBayesianOptimizer from opik-optimizer to find optimal example
demonstrations for the challenge agent to improve skill-appropriate challenge generation.
"""

import json
from pathlib import Path

from opik_optimizer import FewShotBayesianOptimizer
from opik_optimizer.demo_dataset import ChatPrompt
from opik.evaluation.metrics import AnswerRelevance

from meraki_flow.tools.opik_metrics import ChallengeCalibrationMetric


# Dataset path
DATASETS_DIR = Path(__file__).parent / "datasets"
EXAMPLES_FILE = DATASETS_DIR / "challenge_examples.json"

# Default challenge prompt template
DEFAULT_CHALLENGE_PROMPT = ChatPrompt(
    messages=[
        {
            "role": "system",
            "content": """You are a challenge calibration expert who designs skill-appropriate challenges for hobby learners.

Your role is to create challenges that:
1. Match the user's current skill level based on their session count
2. Account for their emotional state (easier challenges when frustrated, progressive when confident)
3. Build on previous progress while introducing appropriate new elements
4. Are specific and achievable within a reasonable time frame

Challenge difficulty guidelines:
- Sessions 1-3: Focus on fundamentals, small wins, building confidence
- Sessions 4-10: Introduce new techniques gradually, slightly stretch comfort zone
- Sessions 11+: Allow more ambitious projects, combine multiple skills

Always explain why the challenge is appropriate for this user's current level."""
        },
        {
            "role": "user",
            "content": """Create a calibrated challenge for this learner:

Hobby: {hobby_name}
Session Count: {session_count}
Current Emotional State: {emotional_state}
Skill Level: {skill_level}

Provide a specific, achievable challenge that will help them grow while maintaining motivation."""
        }
    ]
)

# Few-shot examples for the optimizer to choose from
FEW_SHOT_EXAMPLE_POOL = [
    {
        "input": {
            "hobby_name": "watercolor painting",
            "session_count": 2,
            "emotional_state": "excited",
            "skill_level": "beginner"
        },
        "output": """**Challenge: Color Mixing Practice Sheet**

Create a simple color wheel using only the three primary colors (red, yellow, blue).

**Why this challenge:**
- At session 2, fundamentals are key
- Your excitement suggests readiness to experiment
- Color mixing is foundational and produces immediate satisfying results

**Steps:**
1. Draw 12 circles on your paper
2. Fill 3 circles with pure primaries
3. Mix pairs to create secondaries (orange, green, purple)
4. Mix adjacents for tertiary colors

**Success criteria:** You've learned something new about how colors interact"""
    },
    {
        "input": {
            "hobby_name": "guitar",
            "session_count": 8,
            "emotional_state": "okay",
            "skill_level": "beginner-intermediate"
        },
        "output": """**Challenge: First Song Performance**

Learn to play "Wonderwall" by Oasis (Em, G, D, A7sus4) and perform it start to finish.

**Why this challenge:**
- At session 8, you have solid chord foundation
- Playing a recognizable song is a major motivation milestone
- The chord progression is achievable with your current skills

**Steps:**
1. Practice the chord progression slowly with a metronome at 60 BPM
2. Gradually increase to song tempo (87 BPM)
3. Add strumming pattern once chords are solid
4. Record yourself playing the whole song

**Success criteria:** Play through the song with minimal stops"""
    },
    {
        "input": {
            "hobby_name": "pottery",
            "session_count": 4,
            "emotional_state": "frustrated",
            "skill_level": "beginner"
        },
        "output": """**Challenge: Pinch Pot Meditation**

Create a simple pinch pot without using the wheel, focusing purely on the tactile experience.

**Why this challenge:**
- Frustration suggests the wheel may be overwhelming right now
- Hand-building removes technical pressure
- Pinch pots are achievable and calming

**Steps:**
1. Take a ball of clay the size of your fist
2. Push your thumb into the center
3. Slowly rotate and pinch the walls thinner
4. Focus on the sensation, not perfection

**Success criteria:** Complete a pot that brings you satisfaction, regardless of shape"""
    },
    {
        "input": {
            "hobby_name": "creative writing",
            "session_count": 15,
            "emotional_state": "confident",
            "skill_level": "intermediate"
        },
        "output": """**Challenge: Flash Fiction with Constraints**

Write a 500-word story that includes: a ticking clock, an unlikely friendship, and no dialogue.

**Why this challenge:**
- At session 15, you're ready for creative constraints
- Constraints spark creativity and prevent overthinking
- Flash fiction length is achievable in one session

**Steps:**
1. Brainstorm for 5 minutes on how these elements could connect
2. Write a rough draft in one sitting (30 minutes)
3. Edit for word count and flow
4. Read aloud to check pacing

**Success criteria:** A complete story that satisfies the constraints and surprises you"""
    },
    {
        "input": {
            "hobby_name": "knitting",
            "session_count": 12,
            "emotional_state": "excited",
            "skill_level": "intermediate"
        },
        "output": """**Challenge: Colorwork Introduction**

Knit a simple two-color dishcloth using stranded colorwork technique.

**Why this challenge:**
- At session 12, you have consistent tension
- Excitement indicates readiness for new technique
- Dishcloth is low-stakes for learning

**Steps:**
1. Choose two contrasting colors
2. Cast on 40 stitches with main color
3. Follow a simple geometric pattern (checkerboard or stripes)
4. Practice carrying the yarn behind

**Success criteria:** Complete the dishcloth with recognizable pattern, tension can be uneven"""
    },
]


def load_optimization_dataset():
    """Load the challenge optimization dataset."""
    if EXAMPLES_FILE.exists():
        with open(EXAMPLES_FILE, "r") as f:
            return json.load(f)

    # Default dataset if file doesn't exist
    return [
        {
            "input": {
                "hobby_name": "drawing",
                "session_count": 1,
                "emotional_state": "nervous",
                "skill_level": "beginner"
            },
            "expected_difficulty": "very easy",
            "reference": "First session challenge should be simple and confidence-building"
        },
        {
            "input": {
                "hobby_name": "piano",
                "session_count": 6,
                "emotional_state": "okay",
                "skill_level": "beginner"
            },
            "expected_difficulty": "beginner",
            "reference": "Appropriate challenge for early progression"
        },
        {
            "input": {
                "hobby_name": "woodworking",
                "session_count": 20,
                "emotional_state": "confident",
                "skill_level": "intermediate"
            },
            "expected_difficulty": "intermediate-advanced",
            "reference": "Challenge should stretch skills for experienced practitioner"
        },
        {
            "input": {
                "hobby_name": "photography",
                "session_count": 5,
                "emotional_state": "discouraged",
                "skill_level": "beginner"
            },
            "expected_difficulty": "easy",
            "reference": "Easier challenge to rebuild confidence"
        },
    ]


def optimize_challenge_prompt(
    n_trials: int = 15,
    model: str = "gpt-4o",
    min_examples: int = 1,
    max_examples: int = 3,
    save_results: bool = True
):
    """
    Optimize the challenge agent prompt using FewShotBayesianOptimizer.

    Args:
        n_trials: Number of optimization trials to run.
        model: Model to use for optimization.
        min_examples: Minimum few-shot examples to include.
        max_examples: Maximum few-shot examples to include.
        save_results: Whether to save results to file.

    Returns:
        Optimization result with best prompt and scores.
    """
    print("Initializing Challenge Prompt Optimizer...")

    # Load dataset
    dataset = load_optimization_dataset()
    print(f"Loaded {len(dataset)} test cases for optimization")
    print(f"Example pool size: {len(FEW_SHOT_EXAMPLE_POOL)} examples")

    # Initialize optimizer
    optimizer = FewShotBayesianOptimizer(
        model=model,
        project_name="meraki-challenge-optimization",
        min_examples=min_examples,
        max_examples=max_examples,
    )

    # Create metric
    calibration_metric = ChallengeCalibrationMetric()

    print(f"Starting optimization with {n_trials} trials...")
    print(f"Testing {min_examples}-{max_examples} examples per prompt...")

    # Run optimization
    result = optimizer.optimize_prompt(
        prompt=DEFAULT_CHALLENGE_PROMPT,
        dataset=dataset,
        metric=calibration_metric,
        n_trials=n_trials,
        few_shot_examples=FEW_SHOT_EXAMPLE_POOL,
    )

    print("\n" + "=" * 50)
    print("OPTIMIZATION COMPLETE")
    print("=" * 50)
    print(f"Baseline Score: {result.baseline_score:.4f}")
    print(f"Best Score: {result.best_score:.4f}")
    print(f"Improvement: {(result.best_score - result.baseline_score) * 100:.2f}%")
    print(f"Optimal example count: {len(result.best_few_shot_examples)}")

    if save_results:
        results_file = Path(__file__).parent / "challenge_optimization_results.json"
        with open(results_file, "w") as f:
            json.dump({
                "baseline_score": result.baseline_score,
                "best_score": result.best_score,
                "best_prompt": str(result.best_prompt),
                "best_few_shot_examples": result.best_few_shot_examples,
                "n_trials": n_trials,
                "model": model,
            }, f, indent=2)
        print(f"\nResults saved to: {results_file}")

    return result


if __name__ == "__main__":
    result = optimize_challenge_prompt(n_trials=10)
    print("\nOptimized prompt with best few-shot examples selected.")
