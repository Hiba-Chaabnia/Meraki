"""
FastAPI server for Meraki Crews.

Endpoints:
- POST /discovery: Start a discovery job with quiz answers
- GET /discovery/{job_id}: Poll job status and results
- POST /sampling/preview: Start a sampling preview job
- GET /sampling/preview/{job_id}: Poll sampling preview status
- POST /sampling/local: Start a local experiences job
- GET /sampling/local/{job_id}: Poll local experiences status
- GET /health: Health check
"""

import json
import os
import re
import warnings
from threading import Thread
from typing import Any

warnings.filterwarnings("ignore", category=ResourceWarning)

# Initialize Opik tracing BEFORE importing crews
from meraki_flow.opik_setup import initialize_opik
initialize_opik()

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew
from meraki_flow.crews.sampling_preview_crew.sampling_preview_crew import SamplingPreviewCrew
from meraki_flow.crews.local_experiences_crew.local_experiences_crew import LocalExperiencesCrew
from meraki_flow.crews.practice_feedback_crew.practice_feedback_crew import PracticeFeedbackCrew
from meraki_flow.crews.challenge_generation_crew.challenge_generation_crew import ChallengeGenerationCrew
from meraki_flow.crews.motivation_crew.motivation_crew import MotivationCrew
from meraki_flow.crews.roadmap_crew.roadmap_crew import RoadmapCrew
from meraki_flow.models import SamplingRecommendation, MicroActivity, CuratedVideos
from meraki_flow.db import (
    create_job,
    get_job,
    update_job_status,
    update_job_result,
    update_job_error,
    save_sampling_result,
    save_local_experience_result,
    save_hobby_matches,
    save_ai_feedback,
    save_generated_challenge,
    save_nudge,
    save_generated_roadmap,
)


class DiscoveryRequest(BaseModel):
    user_id: str
    q1: str = ""
    q2: str = ""
    q3: str = ""
    q4: str = ""
    q5: str = ""
    q6: str = ""
    q7: str = ""
    q8: str = ""
    q9: str = ""
    q10: str = ""
    q11: str = ""
    q12: str = ""
    q13: str = ""
    q14: str = ""
    q15: str = ""
    q16: str = ""
    q17: str = ""
    q18: str = ""
    q19: str = ""
    q20: str = ""
    q21: str = ""
    q22: str = ""


class SamplingPreviewRequest(BaseModel):
    hobby_name: str
    quiz_answers: str = ""  # Formatted string of relevant quiz answers
    hobby_slug: str = ""
    user_id: str = ""


class LocalExperiencesRequest(BaseModel):
    hobby_name: str
    location: str
    hobby_slug: str = ""
    user_id: str = ""


class PracticeFeedbackRequest(BaseModel):
    session_id: str
    user_id: str = ""
    hobby_name: str
    session_type: str = "practice"
    duration: int = 0
    mood: str = ""
    notes: str = ""
    image_url: str = ""
    recent_sessions: str = ""
    completed_challenges: str = ""


class ChallengeGenerationRequest(BaseModel):
    user_id: str
    hobby_name: str
    hobby_slug: str = ""
    session_count: int = 0
    avg_duration: int = 0
    mood_distribution: str = ""
    days_active: int = 0
    completed_challenges: str = ""
    skipped_challenges: str = ""
    recent_feedback: str = ""
    last_mood_trend: str = ""


class MotivationCheckRequest(BaseModel):
    user_id: str
    hobby_name: str
    hobby_slug: str = ""
    days_since_last_session: int = 0
    recent_moods: str = ""
    challenge_skip_rate: float = 0.0
    current_streak: int = 0
    longest_streak: int = 0
    session_frequency_trend: str = ""


class RoadmapGenerationRequest(BaseModel):
    user_id: str
    hobby_name: str
    hobby_slug: str = ""
    session_count: int = 0
    avg_duration: int = 0
    days_active: int = 0
    completed_challenges: str = ""
    user_goals: str = ""


class JobResponse(BaseModel):
    job_id: str


app = FastAPI(
    title="Meraki API",
    description="API for hobby discovery and sampling using CrewAI",
    version="1.0.0",
)

# Configure CORS — configurable via CORS_ORIGINS env var
cors_origins = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_crew_output(raw_output: str) -> dict[str, Any]:
    """Parse the crew's raw output to extract JSON result."""
    # Try to find JSON in the output
    # Look for the final JSON structure with matches
    json_patterns = [
        r'\{[\s\S]*"matches"[\s\S]*\}',  # Main result format
        r'\[[\s\S]*"hobby_slug"[\s\S]*\]',  # Array format
    ]

    for pattern in json_patterns:
        matches = re.findall(pattern, raw_output)
        if matches:
            # Try the last match (most likely the final output)
            for match in reversed(matches):
                try:
                    parsed = json.loads(match)
                    # Normalize to expected format
                    if isinstance(parsed, list):
                        return {"matches": parsed, "encouragement": ""}
                    return parsed
                except json.JSONDecodeError:
                    continue

    # Fallback: return raw output wrapped
    return {
        "matches": [],
        "encouragement": "",
        "raw_output": raw_output,
    }


def parse_task_output_json(raw_output: str) -> dict[str, Any] | None:
    """Try to extract a JSON object from a single task's raw output."""
    if not raw_output:
        return None

    # Try parsing the whole string as JSON first
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError:
        pass

    # Try to find a JSON object in the string
    # Match the outermost { ... }
    brace_start = raw_output.find("{")
    if brace_start == -1:
        return None

    # Find matching closing brace by counting depth
    depth = 0
    for i in range(brace_start, len(raw_output)):
        if raw_output[i] == "{":
            depth += 1
        elif raw_output[i] == "}":
            depth -= 1
            if depth == 0:
                candidate = raw_output[brace_start:i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    # Try next opening brace
                    next_start = raw_output.find("{", brace_start + 1)
                    if next_start != -1:
                        brace_start = next_start
                        depth = 0
                        continue
                    return None

    return None


def run_discovery_job(job_id: str) -> None:
    """Run the discovery crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        # Update status to running
        update_job_status(job_id, "running")

        # Build inputs matching all task placeholders
        request_data = job["request_data"]
        inputs = {
            "q1_time_available": request_data.get("q1", ""),
            "q2_practice_timing": request_data.get("q2", ""),
            "q3_session_preference": request_data.get("q3", ""),
            "q4_creative_type": request_data.get("q4", ""),
            "q5_structure_preference": request_data.get("q5", ""),
            "q6_mess_tolerance": request_data.get("q6", ""),
            "q7_learning_method": request_data.get("q7", ""),
            "q8_mistake_attitude": request_data.get("q8", ""),
            "q9_practice_location": request_data.get("q9", ""),
            "q10_social_preference": request_data.get("q10", ""),
            "q11_initial_budget": request_data.get("q11", ""),
            "q12_ongoing_costs": request_data.get("q12", ""),
            "q13_try_before_commit": request_data.get("q13", ""),
            "q14_motivations": request_data.get("q14", ""),
            "q15_resonates": request_data.get("q15", ""),
            "q16_learning_curve": request_data.get("q16", ""),
            "q17_sensory_experience": request_data.get("q17", ""),
            "q18_senses_to_engage": request_data.get("q18", ""),
            "q19_physical_constraints": request_data.get("q19", ""),
            "q20_seasonal_preference": request_data.get("q20", ""),
            "q21_dream_hobby": request_data.get("q21", ""),
            "q22_barriers": request_data.get("q22", ""),
        }

        print(f"[Discovery Job {job_id}] Starting crew with inputs: {list(inputs.keys())}")

        # Call DiscoveryCrew directly
        result = DiscoveryCrew().crew().kickoff(inputs=inputs)

        print(f"[Discovery Job {job_id}] Crew completed. Raw output length: {len(result.raw) if result.raw else 0}")

        # Parse JSON output
        parsed = parse_crew_output(result.raw)

        update_job_result(job_id, parsed)

        # Save hobby matches if user_id is available
        user_id = job.get("user_id", "")
        if user_id and parsed.get("matches"):
            try:
                save_hobby_matches(user_id, parsed["matches"])
                print(f"[Discovery Job {job_id}] Saved {len(parsed['matches'])} hobby matches")
            except Exception as e:
                print(f"[Discovery Job {job_id}] Failed to save hobby matches: {e}")

        print(f"[Discovery Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Discovery Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


def classify_task_json(task_json: dict[str, Any]) -> str | None:
    """Identify what kind of sampling result a JSON object contains."""
    if "primary_path" in task_json:
        return "recommendation"
    if "instruction" in task_json and "title" in task_json:
        return "micro_activity"
    if "videos" in task_json:
        return "videos"
    # Check for video-like array at top level
    if isinstance(task_json, list) and len(task_json) > 0 and "url" in task_json[0]:
        return "videos"
    return None


def run_sampling_preview_job(job_id: str) -> None:
    """Run the sampling preview crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "quiz_answers": request_data.get("quiz_answers", ""),
        }

        print(f"[Sampling Preview Job {job_id}] Starting crew for hobby: {inputs['hobby_name']}")

        result = SamplingPreviewCrew().crew().kickoff(inputs=inputs)

        num_tasks = len(result.tasks_output) if result.tasks_output else 0
        print(f"[Sampling Preview Job {job_id}] Crew completed. Tasks count: {num_tasks}")

        parsed: dict[str, Any] = {
            "recommendation": None,
            "micro_activity": None,
            "videos": None,
        }

        if result.tasks_output:
            for i, task_output in enumerate(result.tasks_output):
                if task_output.pydantic:
                    data = task_output.pydantic.model_dump()
                    if isinstance(task_output.pydantic, SamplingRecommendation):
                        parsed["recommendation"] = data
                        print(f"[Sampling Preview Job {job_id}] Task[{i}] → recommendation (pydantic)")
                    elif isinstance(task_output.pydantic, MicroActivity):
                        parsed["micro_activity"] = data
                        print(f"[Sampling Preview Job {job_id}] Task[{i}] → micro_activity (pydantic)")
                    elif isinstance(task_output.pydantic, CuratedVideos):
                        parsed["videos"] = data["videos"]
                        print(f"[Sampling Preview Job {job_id}] Task[{i}] → videos (pydantic)")
                else:
                    # Fallback: try raw parsing as safety net
                    raw = task_output.raw or ""
                    print(f"[Sampling Preview Job {job_id}] Task[{i}] no pydantic, falling back to raw (len={len(raw)})")
                    task_json = parse_task_output_json(raw)
                    if task_json and i < 3:
                        key = ["recommendation", "micro_activity", "videos"][i]
                        if key == "videos":
                            parsed["videos"] = task_json.get("videos", task_json) if isinstance(task_json, dict) else task_json
                        else:
                            parsed[key] = task_json

        print(f"[Sampling Preview Job {job_id}] FINAL: "
              f"recommendation={'yes' if parsed['recommendation'] else 'no'}, "
              f"micro_activity={'yes' if parsed['micro_activity'] else 'no'}, "
              f"videos={len(parsed['videos']) if isinstance(parsed.get('videos'), list) else 'none'}")

        update_job_result(job_id, parsed)

        # Save sampling result if user_id and hobby_slug are available
        user_id = request_data.get("user_id", "")
        hobby_slug = request_data.get("hobby_slug", "")
        if user_id and hobby_slug:
            try:
                save_sampling_result(user_id, hobby_slug, parsed)
                print(f"[Sampling Preview Job {job_id}] Saved sampling result for {hobby_slug}")
            except Exception as e:
                print(f"[Sampling Preview Job {job_id}] Failed to save sampling result: {e}")

        print(f"[Sampling Preview Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Sampling Preview Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


def run_local_experiences_job(job_id: str) -> None:
    """Run the local experiences crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "location": request_data.get("location", ""),
        }

        print(f"[Local Experiences Job {job_id}] Starting crew for hobby: {inputs['hobby_name']} in {inputs['location']}")

        result = LocalExperiencesCrew().crew().kickoff(inputs=inputs)

        print(f"[Local Experiences Job {job_id}] Crew completed. Raw output length: {len(result.raw) if result.raw else 0}")

        if result.tasks_output and result.tasks_output[0].pydantic:
            parsed = result.tasks_output[0].pydantic.model_dump()
            print(f"[Local Experiences Job {job_id}] Parsed via pydantic output")
        else:
            # Fallback: try raw parsing
            parsed = parse_task_output_json(result.raw or "")
            if not parsed:
                parsed = {"local_spots": [], "general_tips": {}}
            print(f"[Local Experiences Job {job_id}] Parsed via raw fallback")

        print(f"[Local Experiences Job {job_id}] FINAL: "
              f"spots={len(parsed.get('local_spots', []))}, "
              f"tips={'yes' if parsed.get('general_tips') else 'no'}")

        update_job_result(job_id, parsed)

        # Save local experience result if user_id and hobby_slug are available
        user_id = request_data.get("user_id", "")
        hobby_slug = request_data.get("hobby_slug", "")
        if user_id and hobby_slug:
            try:
                save_local_experience_result(user_id, hobby_slug, inputs["location"], parsed)
                print(f"[Local Experiences Job {job_id}] Saved result for {hobby_slug} in {inputs['location']}")
            except Exception as e:
                print(f"[Local Experiences Job {job_id}] Failed to save result: {e}")

        print(f"[Local Experiences Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Local Experiences Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


# ─── Discovery Endpoints ───

@app.post("/discovery", response_model=JobResponse)
async def start_discovery(request: DiscoveryRequest):
    """Start a new discovery job with all quiz answers."""
    request_data = request.model_dump()
    user_id = request_data.pop("user_id")

    job_id = create_job("discovery", request_data, user_id)

    # Run in background thread (CrewAI isn't fully async-compatible)
    thread = Thread(target=run_discovery_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/discovery/{job_id}")
async def get_discovery_status(job_id: str):
    """Get the status and result of a discovery job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Sampling Preview Endpoints ───

@app.post("/sampling/preview", response_model=JobResponse)
async def start_sampling_preview(request: SamplingPreviewRequest):
    """Start a new sampling preview job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("sampling_preview", request_data, user_id)

    thread = Thread(target=run_sampling_preview_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/sampling/preview/{job_id}")
async def get_sampling_preview_status(job_id: str):
    """Get the status and result of a sampling preview job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Local Experiences Endpoints ───

@app.post("/sampling/local", response_model=JobResponse)
async def start_local_experiences(request: LocalExperiencesRequest):
    """Start a new local experiences job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("local_experiences", request_data, user_id)

    thread = Thread(target=run_local_experiences_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/sampling/local/{job_id}")
async def get_local_experiences_status(job_id: str):
    """Get the status and result of a local experiences job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Practice Feedback Endpoints ───

def run_practice_feedback_job(job_id: str) -> None:
    """Run the practice feedback crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "session_type": request_data.get("session_type", "practice"),
            "duration": str(request_data.get("duration", 0)),
            "mood": request_data.get("mood", ""),
            "notes": request_data.get("notes", ""),
            "image_url": request_data.get("image_url", ""),
            "recent_sessions": request_data.get("recent_sessions", "None"),
            "completed_challenges": request_data.get("completed_challenges", "None"),
        }

        print(f"[Practice Feedback Job {job_id}] Starting crew for: {inputs['hobby_name']}")

        result = PracticeFeedbackCrew().crew().kickoff(inputs=inputs)

        if result.tasks_output and result.tasks_output[0].pydantic:
            parsed = result.tasks_output[0].pydantic.model_dump()
        else:
            parsed = parse_task_output_json(result.raw or "")
            if not parsed:
                parsed = {"observations": [], "growth": [], "suggestions": [], "celebration": ""}

        update_job_result(job_id, parsed)

        session_id = request_data.get("session_id", "")
        if session_id:
            try:
                save_ai_feedback(session_id, parsed)
                print(f"[Practice Feedback Job {job_id}] Saved feedback for session {session_id}")
            except Exception as e:
                print(f"[Practice Feedback Job {job_id}] Failed to save feedback: {e}")

        print(f"[Practice Feedback Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Practice Feedback Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


@app.post("/practice/feedback", response_model=JobResponse)
async def start_practice_feedback(request: PracticeFeedbackRequest):
    """Start a practice feedback job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("practice_feedback", request_data, user_id)

    thread = Thread(target=run_practice_feedback_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/practice/feedback/{job_id}")
async def get_practice_feedback_status(job_id: str):
    """Get the status and result of a practice feedback job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Challenge Generation Endpoints ───

def run_challenge_generation_job(job_id: str) -> None:
    """Run the challenge generation crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "session_count": str(request_data.get("session_count", 0)),
            "avg_duration": str(request_data.get("avg_duration", 0)),
            "mood_distribution": request_data.get("mood_distribution", ""),
            "days_active": str(request_data.get("days_active", 0)),
            "completed_challenges": request_data.get("completed_challenges", "None"),
            "skipped_challenges": request_data.get("skipped_challenges", "None"),
            "recent_feedback": request_data.get("recent_feedback", "None"),
            "last_mood_trend": request_data.get("last_mood_trend", ""),
        }

        print(f"[Challenge Generation Job {job_id}] Starting crew for: {inputs['hobby_name']}")

        result = ChallengeGenerationCrew().crew().kickoff(inputs=inputs)

        if result.tasks_output and result.tasks_output[0].pydantic:
            parsed = result.tasks_output[0].pydantic.model_dump()
        else:
            parsed = parse_task_output_json(result.raw or "")
            if not parsed:
                parsed = {"title": "", "description": ""}

        update_job_result(job_id, parsed)

        user_id = request_data.get("user_id", "")
        hobby_slug = request_data.get("hobby_slug", "")
        if user_id and hobby_slug and parsed.get("title"):
            try:
                uc_id = save_generated_challenge(user_id, hobby_slug, parsed)
                if uc_id:
                    print(f"[Challenge Generation Job {job_id}] Saved challenge, user_challenge_id={uc_id}")
            except Exception as e:
                print(f"[Challenge Generation Job {job_id}] Failed to save challenge: {e}")

        print(f"[Challenge Generation Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Challenge Generation Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


@app.post("/challenges/generate", response_model=JobResponse)
async def start_challenge_generation(request: ChallengeGenerationRequest):
    """Start a challenge generation job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("challenge_generation", request_data, user_id)

    thread = Thread(target=run_challenge_generation_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/challenges/generate/{job_id}")
async def get_challenge_generation_status(job_id: str):
    """Get the status and result of a challenge generation job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Motivation Check Endpoints ───

def run_motivation_check_job(job_id: str) -> None:
    """Run the motivation crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "days_since_last_session": str(request_data.get("days_since_last_session", 0)),
            "recent_moods": request_data.get("recent_moods", ""),
            "challenge_skip_rate": str(request_data.get("challenge_skip_rate", 0)),
            "current_streak": str(request_data.get("current_streak", 0)),
            "longest_streak": str(request_data.get("longest_streak", 0)),
            "session_frequency_trend": request_data.get("session_frequency_trend", ""),
        }

        print(f"[Motivation Check Job {job_id}] Starting crew for: {inputs['hobby_name']}")

        result = MotivationCrew().crew().kickoff(inputs=inputs)

        if result.tasks_output and result.tasks_output[0].pydantic:
            parsed = result.tasks_output[0].pydantic.model_dump()
        else:
            parsed = parse_task_output_json(result.raw or "")
            if not parsed:
                parsed = {"nudge_type": "", "message": "", "suggested_action": "", "urgency": "gentle"}

        update_job_result(job_id, parsed)

        user_id = request_data.get("user_id", "")
        hobby_slug = request_data.get("hobby_slug", "")
        if user_id and parsed.get("message"):
            try:
                save_nudge(user_id, hobby_slug, parsed)
                print(f"[Motivation Check Job {job_id}] Saved nudge")
            except Exception as e:
                print(f"[Motivation Check Job {job_id}] Failed to save nudge: {e}")

        print(f"[Motivation Check Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Motivation Check Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


@app.post("/motivation/check", response_model=JobResponse)
async def start_motivation_check(request: MotivationCheckRequest):
    """Start a motivation check job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("motivation_check", request_data, user_id)

    thread = Thread(target=run_motivation_check_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/motivation/check/{job_id}")
async def get_motivation_check_status(job_id: str):
    """Get the status and result of a motivation check job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Roadmap Generation Endpoints ───

def run_roadmap_generation_job(job_id: str) -> None:
    """Run the roadmap crew in a background thread."""
    import traceback

    job = get_job(job_id)
    if not job:
        return

    try:
        update_job_status(job_id, "running")

        request_data = job["request_data"]
        inputs = {
            "hobby_name": request_data.get("hobby_name", ""),
            "session_count": str(request_data.get("session_count", 0)),
            "avg_duration": str(request_data.get("avg_duration", 0)),
            "days_active": str(request_data.get("days_active", 0)),
            "completed_challenges": request_data.get("completed_challenges", "None"),
            "user_goals": request_data.get("user_goals", "None"),
        }

        print(f"[Roadmap Generation Job {job_id}] Starting crew for: {inputs['hobby_name']}")

        result = RoadmapCrew().crew().kickoff(inputs=inputs)

        if result.tasks_output and result.tasks_output[0].pydantic:
            parsed = result.tasks_output[0].pydantic.model_dump()
        else:
            parsed = parse_task_output_json(result.raw or "")
            if not parsed:
                parsed = {"title": "", "description": "", "phases": []}

        update_job_result(job_id, parsed)

        user_id = request_data.get("user_id", "")
        hobby_slug = request_data.get("hobby_slug", "")
        if user_id and hobby_slug and parsed.get("phases"):
            try:
                ur_id = save_generated_roadmap(user_id, hobby_slug, parsed)
                if ur_id:
                    print(f"[Roadmap Generation Job {job_id}] Saved roadmap, user_roadmap_id={ur_id}")
            except Exception as e:
                print(f"[Roadmap Generation Job {job_id}] Failed to save roadmap: {e}")

        print(f"[Roadmap Generation Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Roadmap Generation Job {job_id}] FAILED: {error_details}")
        update_job_error(job_id, str(e))


@app.post("/roadmap/generate", response_model=JobResponse)
async def start_roadmap_generation(request: RoadmapGenerationRequest):
    """Start a roadmap generation job."""
    request_data = request.model_dump()
    user_id = request_data.get("user_id", "")

    job_id = create_job("roadmap_generation", request_data, user_id)

    thread = Thread(target=run_roadmap_generation_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/roadmap/generate/{job_id}")
async def get_roadmap_generation_status(job_id: str):
    """Get the status and result of a roadmap generation job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job["id"],
        "status": job["status"],
        "result": job["result"],
        "error": job["error"],
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
    }


# ─── Health Check ───

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "meraki-api"}


def main():
    """Entry point for the API server."""
    uvicorn.run(
        "meraki_flow.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
