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


def save_hobby_matches(
    user_id: str,
    matches: list[dict[str, Any]],
) -> None:
    """Save discovery matches. Looks up hobby_id by slug and upserts into hobby_matches."""
    if not user_id or not matches:
        return
    sb = get_supabase()
    for match in matches:
        slug = match.get("hobby_slug", "")
        if not slug:
            continue
        # Look up hobby_id by slug
        resp = sb.table("hobbies").select("id").eq("slug", slug).execute()
        if not resp.data or len(resp.data) == 0:
            continue
        hobby_id = resp.data[0]["id"]
        now = datetime.now(timezone.utc).isoformat()
        sb.table("hobby_matches").upsert(
            {
                "user_id": user_id,
                "hobby_id": hobby_id,
                "match_percentage": match.get("match_percentage", 0),
                "match_tags": match.get("match_tags", []),
                "reasoning": match.get("reasoning", ""),
                "created_at": now,
            },
            on_conflict="user_id,hobby_id",
        ).execute()
