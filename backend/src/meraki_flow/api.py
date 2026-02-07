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
import re
import uuid
from datetime import datetime
from enum import Enum
from threading import Thread
from typing import Any

import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew
from meraki_flow.crews.sampling_preview_crew.sampling_preview_crew import SamplingPreviewCrew
from meraki_flow.crews.local_experiences_crew.local_experiences_crew import LocalExperiencesCrew
from meraki_flow.models import SamplingRecommendation, MicroActivity, CuratedVideos


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


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


class LocalExperiencesRequest(BaseModel):
    hobby_name: str
    location: str


class JobResponse(BaseModel):
    job_id: str


class Job(BaseModel):
    id: str
    user_id: str
    job_type: str = "discovery"  # "discovery", "sampling_preview", "local_experiences"
    status: JobStatus
    request_data: dict[str, Any]
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime


# In-memory job store (for production, use Redis or a database)
job_store: dict[str, Job] = {}


app = FastAPI(
    title="Meraki API",
    description="API for hobby discovery and sampling using CrewAI",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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


def parse_local_output(raw_output: str) -> dict[str, Any]:
    """Parse the local experiences crew's raw output to extract JSON results."""
    # Try to find the main JSON structure
    patterns = [
        r'\{[\s\S]*"local_spots"[\s\S]*\}',
        r'\{[\s\S]*"general_tips"[\s\S]*\}',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, raw_output)
        if matches:
            for match in reversed(matches):
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue

    # Fallback
    return {
        "local_spots": [],
        "general_tips": {},
        "raw_output": raw_output,
    }


def run_discovery_job(job_id: str) -> None:
    """Run the discovery crew in a background thread."""
    import traceback

    job = job_store.get(job_id)
    if not job:
        return

    try:
        # Update status to running
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now()

        # Build inputs matching all task placeholders
        request_data = job.request_data
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

        job.result = parsed
        job.status = JobStatus.COMPLETED
        job.updated_at = datetime.now()

        print(f"[Discovery Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Discovery Job {job_id}] FAILED: {error_details}")
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.updated_at = datetime.now()


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

    job = job_store.get(job_id)
    if not job:
        return

    try:
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now()

        request_data = job.request_data
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

        job.result = parsed
        job.status = JobStatus.COMPLETED
        job.updated_at = datetime.now()

        print(f"[Sampling Preview Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Sampling Preview Job {job_id}] FAILED: {error_details}")
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.updated_at = datetime.now()


def run_local_experiences_job(job_id: str) -> None:
    """Run the local experiences crew in a background thread."""
    import traceback

    job = job_store.get(job_id)
    if not job:
        return

    try:
        job.status = JobStatus.RUNNING
        job.updated_at = datetime.now()

        request_data = job.request_data
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

        job.result = parsed
        job.status = JobStatus.COMPLETED
        job.updated_at = datetime.now()

        print(f"[Local Experiences Job {job_id}] Job completed successfully")

    except Exception as e:
        error_details = f"{str(e)}\n{traceback.format_exc()}"
        print(f"[Local Experiences Job {job_id}] FAILED: {error_details}")
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.updated_at = datetime.now()


# ─── Discovery Endpoints ───

@app.post("/discovery", response_model=JobResponse)
async def start_discovery(request: DiscoveryRequest, background_tasks: BackgroundTasks):
    """Start a new discovery job with all quiz answers."""
    job_id = str(uuid.uuid4())
    now = datetime.now()

    # Store request data
    request_data = request.model_dump()
    user_id = request_data.pop("user_id")

    job = Job(
        id=job_id,
        user_id=user_id,
        job_type="discovery",
        status=JobStatus.PENDING,
        request_data=request_data,
        created_at=now,
        updated_at=now,
    )
    job_store[job_id] = job

    # Run in background thread (CrewAI isn't fully async-compatible)
    thread = Thread(target=run_discovery_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/discovery/{job_id}")
async def get_discovery_status(job_id: str):
    """Get the status and result of a discovery job."""
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.id,
        "status": job.status,
        "result": job.result,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }


# ─── Sampling Preview Endpoints ───

@app.post("/sampling/preview", response_model=JobResponse)
async def start_sampling_preview(request: SamplingPreviewRequest):
    """Start a new sampling preview job."""
    job_id = str(uuid.uuid4())
    now = datetime.now()

    job = Job(
        id=job_id,
        user_id="",  # Not required for sampling
        job_type="sampling_preview",
        status=JobStatus.PENDING,
        request_data=request.model_dump(),
        created_at=now,
        updated_at=now,
    )
    job_store[job_id] = job

    thread = Thread(target=run_sampling_preview_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/sampling/preview/{job_id}")
async def get_sampling_preview_status(job_id: str):
    """Get the status and result of a sampling preview job."""
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.id,
        "status": job.status,
        "result": job.result,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
    }


# ─── Local Experiences Endpoints ───

@app.post("/sampling/local", response_model=JobResponse)
async def start_local_experiences(request: LocalExperiencesRequest):
    """Start a new local experiences job."""
    job_id = str(uuid.uuid4())
    now = datetime.now()

    job = Job(
        id=job_id,
        user_id="",  # Not required for local search
        job_type="local_experiences",
        status=JobStatus.PENDING,
        request_data=request.model_dump(),
        created_at=now,
        updated_at=now,
    )
    job_store[job_id] = job

    thread = Thread(target=run_local_experiences_job, args=(job_id,))
    thread.start()

    return JobResponse(job_id=job_id)


@app.get("/sampling/local/{job_id}")
async def get_local_experiences_status(job_id: str):
    """Get the status and result of a local experiences job."""
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "job_id": job.id,
        "status": job.status,
        "result": job.result,
        "error": job.error,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat(),
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
