"""Pydantic output models for CrewAI structured output.

These models are used with CrewAI's `output_pydantic` parameter to enforce
structured JSON output from LLM tasks, eliminating fragile regex/brace-counting parsing.
"""

from pydantic import BaseModel


# --- Sampling Preview Models ---

class SamplingRecommendation(BaseModel):
    primary_path: str        # "watch", "micro", or "local"
    reason: str
    what_to_expect: str
    secondary_path: str
    encouragement: str


class MicroActivity(BaseModel):
    title: str
    instruction: str
    duration: str
    why_it_works: str


class VideoItem(BaseModel):
    title: str
    channel: str
    url: str
    thumbnail: str = ""
    duration: str
    why_good: str
    what_to_watch_for: str = ""


class CuratedVideos(BaseModel):
    videos: list[VideoItem]


# --- Local Experiences Models ---

class LocalSpotModel(BaseModel):
    name: str
    type: str
    address: str = ""
    rating: float | None = None
    reviews_count: int | None = None
    price: str = ""
    url: str = ""
    beginner_friendly: bool = True
    single_session: bool = True
    source: str = "web_search"


class GeneralTipsModel(BaseModel):
    what_to_wear: str = ""
    what_to_bring: str = ""
    what_to_expect: str = ""
    how_to_not_feel_awkward: str = ""


class LocalExperiencesOutput(BaseModel):
    local_spots: list[LocalSpotModel]
    general_tips: GeneralTipsModel
    search_location: str = ""
    hobby: str = ""


# --- Practice Feedback Models ---

class PracticeFeedbackOutput(BaseModel):
    observations: list[str]
    growth: list[str]
    suggestions: list[str]
    celebration: str


# --- Challenge Generation Models ---

class GeneratedChallenge(BaseModel):
    title: str
    description: str
    why_this_challenge: str
    skills: list[str]
    difficulty: str
    estimated_time: str
    tips: list[str]
    what_youll_learn: list[str]


# --- Motivation Nudge Models ---

class MotivationNudge(BaseModel):
    nudge_type: str
    message: str
    suggested_action: str
    action_data: str = ""
    urgency: str = "gentle"


# --- Roadmap Models ---

class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    description: str
    goals: list[str]
    suggested_activities: list[str]
    time_per_week: str


class GeneratedRoadmap(BaseModel):
    title: str
    description: str
    phases: list[RoadmapPhase]
