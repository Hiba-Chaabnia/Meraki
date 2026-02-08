"""
Supabase client and job CRUD helpers for Meraki backend.

Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.
Service-role key bypasses RLS, so the jobs table needs no policies.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


_supabase: Client | None = None


def get_supabase() -> Client:
    """Return a singleton Supabase client."""
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
            )
        _supabase = create_client(url, key)
    return _supabase


# ─── Job CRUD ───

def create_job(
    job_type: str,
    request_data: dict[str, Any],
    user_id: str = "",
) -> str:
    """INSERT a new job row and return its id."""
    job_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    row = {
        "id": job_id,
        "job_type": job_type,
        "status": "pending",
        "request_data": request_data,
        "user_id": user_id if user_id else None,
        "created_at": now,
        "updated_at": now,
    }

    get_supabase().table("jobs").insert(row).execute()
    return job_id


def get_job(job_id: str) -> dict[str, Any] | None:
    """SELECT a job by id. Returns dict or None."""
    resp = get_supabase().table("jobs").select("*").eq("id", job_id).execute()
    if resp.data and len(resp.data) > 0:
        return resp.data[0]
    return None


def update_job_status(job_id: str, status: str) -> None:
    """UPDATE a job's status and updated_at."""
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("jobs").update({
        "status": status,
        "updated_at": now,
    }).eq("id", job_id).execute()


def update_job_progress(job_id: str, completed_tasks: int) -> None:
    """
    UPDATE how many crew tasks have finished so far.

    Called from a CrewAI task_callback, so it runs on the crew's thread between
    tasks. Never raise from here — a bookkeeping failure must not kill a job
    that is otherwise succeeding.
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        get_supabase().table("jobs").update({
            "progress": completed_tasks,
            "updated_at": now,
        }).eq("id", job_id).execute()
    except Exception as e:  # noqa: BLE001 - progress is best-effort
        print(f"[Job {job_id}] progress update failed (non-fatal): {e}")


def update_job_result(job_id: str, result: dict[str, Any]) -> None:
    """UPDATE a job with its result and mark completed."""
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("jobs").update({
        "status": "completed",
        "result": result,
        "updated_at": now,
    }).eq("id", job_id).execute()


def update_job_error(job_id: str, error: str) -> None:
    """UPDATE a job with an error message and mark failed."""
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("jobs").update({
        "status": "failed",
        "error": error,
        "updated_at": now,
    }).eq("id", job_id).execute()


# ─── Result persistence helpers ───

def save_sampling_result(
    user_id: str,
    hobby_slug: str,
    result: dict[str, Any],
) -> None:
    """UPSERT a sampling preview result for a user+hobby."""
    if not user_id:
        return
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("sampling_results").upsert(
        {
            "user_id": user_id,
            "hobby_slug": hobby_slug,
            "result": result,
            "created_at": now,
        },
        on_conflict="user_id,hobby_slug",
    ).execute()


def save_local_experience_result(
    user_id: str,
    hobby_slug: str,
    location: str,
    result: dict[str, Any],
) -> None:
    """UPSERT a local experience result for a user+hobby+location."""
    if not user_id:
        return
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("local_experience_results").upsert(
        {
            "user_id": user_id,
            "hobby_slug": hobby_slug,
            "location": location,
            "result": result,
            "created_at": now,
        },
        on_conflict="user_id,hobby_slug,location",
    ).execute()


def save_ai_feedback(
    session_id: str,
    feedback: dict[str, Any],
) -> None:
    """INSERT AI feedback for a practice session."""
    if not session_id:
        return
    now = datetime.now(timezone.utc).isoformat()
    get_supabase().table("ai_feedback").upsert(
        {
            "session_id": session_id,
            "observations": feedback.get("observations", []),
            "growth": feedback.get("growth", []),
            "suggestions": feedback.get("suggestions", []),
            "celebration": feedback.get("celebration", ""),
            "created_at": now,
        },
        on_conflict="session_id",
    ).execute()


def save_generated_challenge(
    user_id: str,
    hobby_slug: str,
    challenge_data: dict[str, Any],
) -> str | None:
    """Insert a generated challenge and assign it to the user. Returns user_challenge_id."""
    if not user_id or not hobby_slug:
        return None
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Insert challenge
    challenge_row = {
        "hobby_slug": hobby_slug,
        "title": challenge_data.get("title", ""),
        "description": challenge_data.get("description", ""),
        "skills": challenge_data.get("skills", []),
        "difficulty": challenge_data.get("difficulty", "easy"),
        "estimated_time": challenge_data.get("estimated_time", ""),
        "tips": challenge_data.get("tips", []),
        "what_youll_learn": challenge_data.get("what_youll_learn", []),
        "created_at": now,
    }
    ch_resp = sb.table("challenges").insert(challenge_row).execute()
    if not ch_resp.data or len(ch_resp.data) == 0:
        return None
    challenge_id = ch_resp.data[0]["id"]

    # Assign to user
    uc_row = {
        "user_id": user_id,
        "challenge_id": challenge_id,
        "status": "active",
        "started_at": now,
    }
    uc_resp = sb.table("user_challenges").insert(uc_row).execute()
    if not uc_resp.data or len(uc_resp.data) == 0:
        return None
    new_uc_id = uc_resp.data[0]["id"]

    # Nothing to retire: triggerChallengeGeneration refuses to run while a
    # challenge is active for this hobby, so a second one cannot exist. The old
    # _skip_previous_active_challenges silently marked the previous challenge
    # `skipped`, which is now a user action and means something different.

    return new_uc_id


def save_generated_roadmap(
    user_id: str,
    hobby_slug: str,
    roadmap_data: dict[str, Any],
) -> str | None:
    """Insert a generated roadmap and assign it to the user. Returns user_roadmap_id."""
    if not user_id or not hobby_slug:
        return None
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    phases = roadmap_data.get("phases", [])

    # `phases` is jsonb straight from the crew, so nothing downstream can trust
    # its shape. A phase without goals produces a dashboard card that shows a
    # stage with no checklist and can only offer to rebuild — better to refuse
    # the roadmap here and let the caller surface a retry than to persist one
    # the UI has to apologise for.
    if not phases or any(not p.get("goals") for p in phases):
        print(
            "[db] Rejecting roadmap for "
            f"{hobby_slug}: {len(phases)} phase(s), one or more without goals"
        )
        return None

    # Read before writing: the upsert below overwrites roadmap_id, so this is
    # the last chance to learn which row it supersedes.
    prev_resp = (
        sb.table("user_roadmaps")
        .select("roadmap_id")
        .eq("user_id", user_id)
        .eq("hobby_slug", hobby_slug)
        .limit(1)
        .execute()
    )
    prev_rows = prev_resp.data or []
    previous_roadmap_id = prev_rows[0]["roadmap_id"] if prev_rows else None

    # Insert roadmap
    roadmap_row = {
        "hobby_slug": hobby_slug,
        "title": roadmap_data.get("title", ""),
        "description": roadmap_data.get("description", ""),
        "phases": phases,
        "total_phases": len(phases),
        "created_at": now,
    }
    r_resp = sb.table("roadmaps").insert(roadmap_row).execute()
    if not r_resp.data or len(r_resp.data) == 0:
        return None
    roadmap_id = r_resp.data[0]["id"]

    # Assign to user.
    #
    # Upsert, not insert: user_roadmaps carries `unique (user_id, hobby_slug)`,
    # so a plain insert made a roadmap impossible to replace — the second
    # attempt failed on the constraint and left the freshly-inserted `roadmaps`
    # row above orphaned. That is what blocked rebuilding a roadmap whose
    # phases came back without goals.
    #
    # current_phase resets to 0 because the new phases are a different list;
    # carrying the old index would land the user mid-way through a roadmap they
    # have not started. completed_goals resets for the same reason and is the
    # sharper version of it: the keys are positional -- roadmapGoalKey() is
    # `phase-index` -- so a surviving "2-1" would tick whatever item happens to
    # sit at that position in the new phases.
    ur_row = {
        "user_id": user_id,
        "roadmap_id": roadmap_id,
        "hobby_slug": hobby_slug,
        "current_phase": 0,
        "completed_goals": [],
        "started_at": now,
        "updated_at": now,
    }
    ur_resp = (
        sb.table("user_roadmaps")
        .upsert(ur_row, on_conflict="user_id,hobby_slug")
        .execute()
    )
    if not ur_resp.data or len(ur_resp.data) == 0:
        return None

    # The upsert repoints user_roadmaps at the new roadmap; without this the
    # one it replaced stays in `roadmaps` forever with nothing referencing it.
    #
    # Checked for references first because user_roadmaps.roadmap_id is
    # `on delete cascade`: a roadmaps row that some other user_roadmaps row
    # still points at would take that row down with it.
    if previous_roadmap_id and previous_roadmap_id != roadmap_id:
        try:
            refs = (
                sb.table("user_roadmaps")
                .select("id")
                .eq("roadmap_id", previous_roadmap_id)
                .limit(1)
                .execute()
            )
            if not (refs.data or []):
                sb.table("roadmaps").delete().eq("id", previous_roadmap_id).execute()
        except Exception as e:
            print(f"[db] Could not remove superseded roadmap {previous_roadmap_id}: {e}")

    return ur_resp.data[0]["id"]


def save_hobby_matches(
    user_id: str,
    matches: list[dict[str, Any]],
) -> None:
    """Save discovery matches. Upserts into hobby_matches keyed by hobby_slug."""
    if not user_id or not matches:
        return
    sb = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    for match in matches:
        slug = match.get("hobby_slug", "")
        if not slug:
            continue
        sb.table("hobby_matches").upsert(
            {
                "user_id": user_id,
                "hobby_slug": slug,
                "match_percentage": match.get("match_percentage", 0),
                "match_tags": match.get("match_tags", []),
                "reasoning": match.get("reasoning", ""),
                "created_at": now,
            },
            on_conflict="user_id,hobby_slug",
        ).execute()
