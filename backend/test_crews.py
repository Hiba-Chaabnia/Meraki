"""
Diagnostic test script for Meraki CrewAI crews.

Tests each layer independently to pinpoint where failures occur:
  1. Environment & API keys
  2. Individual tools (YouTube, Google Places, Web Search)
  3. Individual crews (Discovery, Sampling Preview, Local Experiences)
  4. Output parsing logic

Usage:
  cd backend
  uv run python test_crews.py                    # Run all tests
  uv run python test_crews.py --tools            # Test tools only
  uv run python test_crews.py --crews            # Test crews only
  uv run python test_crews.py --parsing          # Test parsing only
  uv run python test_crews.py --crew sampling    # Test specific crew
  uv run python test_crews.py --crew discovery   # Test specific crew
  uv run python test_crews.py --crew local       # Test specific crew
"""

import argparse
import json
import os
import sys
import time
import traceback
from datetime import datetime


# ── Helpers ──────────────────────────────────────────────────────────────────

PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[WARN]"
INFO = "[INFO]"

def header(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def subheader(title: str):
    print(f"\n--- {title} ---")

def result(status: str, msg: str):
    print(f"  {status} {msg}")

def print_json_preview(data, max_lines=15):
    """Print a truncated JSON preview."""
    text = json.dumps(data, indent=2, default=str)
    lines = text.split("\n")
    for line in lines[:max_lines]:
        print(f"    {line}")
    if len(lines) > max_lines:
        print(f"    ... ({len(lines) - max_lines} more lines)")


# ── 1. Environment Checks ───────────────────────────────────────────────────

def test_environment():
    header("1. ENVIRONMENT & API KEYS")

    # Check Python version
    result(INFO, f"Python version: {sys.version}")

    # Check required env vars
    env_vars = {
        "YOUTUBE_API_KEY": "Required for YouTubeSearchTool",
        "GOOGLE_PLACES_API_KEY": "Required for GooglePlacesTool (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)",
        "OPENAI_API_KEY": "Required if using OpenAI as LLM provider",
        "ANTHROPIC_API_KEY": "Required if using Anthropic as LLM provider",
    }

    for var, desc in env_vars.items():
        val = os.getenv(var)
        if val:
            masked = val[:8] + "..." + val[-4:] if len(val) > 12 else "***"
            result(PASS, f"{var} = {masked} ({desc})")
        else:
            result(WARN, f"{var} not set ({desc})")

    # Also check the fallback Google key
    google_fallback = os.getenv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
    if google_fallback and not os.getenv("GOOGLE_PLACES_API_KEY"):
        result(INFO, f"NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set (used as fallback for Places)")

    # Check CrewAI import
    subheader("Package imports")
    packages = [
        ("crewai", "CrewAI framework"),
        ("fastapi", "FastAPI server"),
        ("pydantic", "Data models"),
        ("googleapiclient", "YouTube API client"),
        ("duckduckgo_search", "DuckDuckGo search"),
    ]
    for pkg, desc in packages:
        try:
            mod = __import__(pkg)
            version = getattr(mod, "__version__", "unknown")
            result(PASS, f"{pkg} v{version} ({desc})")
        except ImportError:
            result(FAIL, f"{pkg} not installed ({desc})")


# ── 2. Tool Tests ────────────────────────────────────────────────────────────

def test_youtube_tool():
    subheader("YouTubeSearchTool")
    try:
        from meraki_flow.tools.youtube_search import YouTubeSearchTool

        tool = YouTubeSearchTool()
        result(PASS, "Tool instantiated successfully")

        query = "photography beginner tutorial"
        result(INFO, f"Searching: '{query}'")

        start = time.time()
        raw = tool._run(query=query, max_results=3)
        elapsed = time.time() - start

        result(INFO, f"Response received in {elapsed:.1f}s (length: {len(raw)} chars)")

        data = json.loads(raw)

        if "error" in data and data["error"]:
            result(FAIL, f"Tool returned error: {data['error']}")
            return False

        videos = data.get("videos", [])
        result(INFO, f"Videos found: {len(videos)}")

        if len(videos) == 0:
            result(FAIL, "No videos returned - YouTube API may be misconfigured")
            result(INFO, "Check: API key restrictions, quota limits, HTTP referer settings")
            return False

        for i, v in enumerate(videos):
            result(PASS, f"  Video {i+1}: \"{v['title']}\" by {v['channel']} ({v['duration']}, {v.get('view_count_formatted', '?')} views)")
            result(INFO, f"    URL: {v['url']}")
            result(INFO, f"    Thumbnail: {'yes' if v.get('thumbnail') else 'no'}")

        return True

    except Exception as e:
        result(FAIL, f"YouTubeSearchTool failed: {e}")
        traceback.print_exc()
        return False


def test_google_places_tool():
    subheader("GooglePlacesTool")
    try:
        from meraki_flow.tools.google_places import GooglePlacesTool

        tool = GooglePlacesTool()
        result(PASS, "Tool instantiated successfully")

        hobby = "photography"
        location = "New York, NY"
        result(INFO, f"Searching: '{hobby}' near '{location}'")

        start = time.time()
        raw = tool._run(hobby=hobby, location=location, max_results=3)
        elapsed = time.time() - start

        result(INFO, f"Response received in {elapsed:.1f}s (length: {len(raw)} chars)")

        data = json.loads(raw)

        if "error" in data and data["error"]:
            result(FAIL, f"Tool returned error: {data['error']}")
            return False

        places = data.get("places", [])
        result(INFO, f"Places found: {len(places)}")

        if len(places) == 0:
            result(WARN, "No places returned (could be valid for some locations)")
            return True

        for i, p in enumerate(places):
            result(PASS, f"  Place {i+1}: \"{p['name']}\" - {p.get('rating', 'N/A')} stars ({p.get('user_ratings_total', 0)} reviews)")

        return True

    except Exception as e:
        result(FAIL, f"GooglePlacesTool failed: {e}")
        traceback.print_exc()
        return False


def test_web_search_tool():
    subheader("WebSearchTool")
    try:
        from meraki_flow.tools.web_search import WebSearchTool

        tool = WebSearchTool()
        result(PASS, "Tool instantiated successfully")

        query = "photography workshop New York"
        result(INFO, f"Searching: '{query}'")

        start = time.time()
        raw = tool._run(query=query, max_results=3)
        elapsed = time.time() - start

        result(INFO, f"Response received in {elapsed:.1f}s (length: {len(raw)} chars)")

        data = json.loads(raw)

        if "error" in data and data["error"]:
            result(FAIL, f"Tool returned error: {data['error']}")
            return False

        results = data.get("results", [])
        result(INFO, f"Results found: {len(results)}")

        for i, r in enumerate(results):
            result(PASS, f"  Result {i+1}: \"{r['title']}\" ({r.get('source', 'unknown')})")

        return True

    except Exception as e:
        result(FAIL, f"WebSearchTool failed: {e}")
        traceback.print_exc()
        return False


def test_tools():
    header("2. INDIVIDUAL TOOL TESTS")
    results = {}
    results["youtube"] = test_youtube_tool()
    results["google_places"] = test_google_places_tool()
    results["web_search"] = test_web_search_tool()
    return results


# ── 3. Crew Tests ────────────────────────────────────────────────────────────

def test_discovery_crew():
    subheader("Discovery Crew")
    try:
        from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew

        result(PASS, "DiscoveryCrew imported successfully")

        # Minimal quiz inputs for testing
        inputs = {
            "q1_time_available": "3-5 hours per week",
            "q2_practice_timing": "Evenings after work",
            "q3_session_preference": "1-2 hour sessions",
            "q4_creative_type": "I like making things with my hands",
            "q5_structure_preference": "Mix of guided and free exploration",
            "q6_mess_tolerance": "I don't mind getting messy",
            "q7_learning_method": "I learn by watching then trying",
            "q8_mistake_attitude": "Mistakes are part of learning",
            "q9_practice_location": "At home, small apartment",
            "q10_social_preference": "Mostly solo, occasional group",
            "q11_initial_budget": "Under $50 to start",
            "q12_ongoing_costs": "Minimal ongoing costs preferred",
            "q13_try_before_commit": "I want to try before buying anything",
            "q14_motivations": "Relaxation and stress relief",
            "q15_resonates": "Creating something beautiful",
            "q16_learning_curve": "Gentle, I want early wins",
            "q17_sensory_experience": "Working with textures and materials",
            "q18_senses_to_engage": "Touch and sight",
            "q19_physical_constraints": "No physical limitations",
            "q20_seasonal_preference": "Year-round indoor activity",
            "q21_dream_hobby": "I've always wanted to try pottery",
            "q22_barriers": "Not sure where to start, worried about cost",
        }

        result(INFO, f"Kicking off crew with {len(inputs)} inputs...")

        start = time.time()
        crew_instance = DiscoveryCrew().crew()
        crew_result = crew_instance.kickoff(inputs=inputs)
        elapsed = time.time() - start

        result(INFO, f"Crew completed in {elapsed:.1f}s")

        # Inspect the result object
        result(INFO, f"Result type: {type(crew_result).__name__}")
        result(INFO, f"result.raw length: {len(crew_result.raw) if crew_result.raw else 0}")
        result(INFO, f"result.pydantic: {crew_result.pydantic}")
        result(INFO, f"result.tasks_output count: {len(crew_result.tasks_output) if crew_result.tasks_output else 0}")

        # Check each task output
        if crew_result.tasks_output:
            for i, task_out in enumerate(crew_result.tasks_output):
                result(INFO, f"  Task[{i}] name: {task_out.name}")
                result(INFO, f"  Task[{i}] pydantic: {type(task_out.pydantic).__name__ if task_out.pydantic else 'None'}")
                result(INFO, f"  Task[{i}] raw length: {len(task_out.raw) if task_out.raw else 0}")
                if task_out.raw:
                    preview = task_out.raw[:200].replace("\n", " ")
                    result(INFO, f"  Task[{i}] raw preview: {preview}...")

        # Test the parsing logic used in api.py
        from meraki_flow.api import parse_crew_output
        parsed = parse_crew_output(crew_result.raw)

        matches = parsed.get("matches", [])
        result(INFO, f"Parsed matches count: {len(matches)}")

        if matches:
            result(PASS, "Discovery crew returned matches!")
            for m in matches[:3]:
                result(PASS, f"  {m.get('hobby_slug', '?')} - {m.get('match_percentage', '?')}% - tags: {m.get('match_tags', [])}")
        else:
            result(FAIL, "No matches parsed from crew output")
            result(INFO, "Raw output preview:")
            if crew_result.raw:
                for line in crew_result.raw[:500].split("\n"):
                    print(f"    {line}")
            if "raw_output" in parsed:
                result(WARN, "Parsing fell through to raw_output fallback")

        print_json_preview(parsed)
        return True

    except Exception as e:
        result(FAIL, f"Discovery crew failed: {e}")
        traceback.print_exc()
        return False


def test_sampling_preview_crew():
    subheader("Sampling Preview Crew")
    try:
        from meraki_flow.crews.sampling_preview_crew.sampling_preview_crew import SamplingPreviewCrew
        from meraki_flow.models import SamplingRecommendation, MicroActivity, CuratedVideos

        result(PASS, "SamplingPreviewCrew imported successfully")

        inputs = {
            "hobby_name": "photography",
            "quiz_answers": "Prefers solo activities, learns by watching, has 3-5 hours/week, evenings, visual learner, wants relaxation",
        }

        result(INFO, f"Kicking off crew for hobby: {inputs['hobby_name']}")

        start = time.time()
        crew_instance = SamplingPreviewCrew().crew()
        crew_result = crew_instance.kickoff(inputs=inputs)
        elapsed = time.time() - start

        result(INFO, f"Crew completed in {elapsed:.1f}s")

        # Inspect the result object
        result(INFO, f"Result type: {type(crew_result).__name__}")
        result(INFO, f"result.raw length: {len(crew_result.raw) if crew_result.raw else 0}")
        result(INFO, f"result.pydantic: {type(crew_result.pydantic).__name__ if crew_result.pydantic else 'None'}")
        result(INFO, f"result.tasks_output count: {len(crew_result.tasks_output) if crew_result.tasks_output else 0}")

        # ── Detailed per-task inspection (this is the critical part) ──
        parsed = {
            "recommendation": None,
            "micro_activity": None,
            "videos": None,
        }

        if crew_result.tasks_output:
            for i, task_out in enumerate(crew_result.tasks_output):
                print()
                result(INFO, f"  Task[{i}] name: {task_out.name}")
                result(INFO, f"  Task[{i}] pydantic type: {type(task_out.pydantic).__name__ if task_out.pydantic else 'None'}")
                result(INFO, f"  Task[{i}] raw length: {len(task_out.raw) if task_out.raw else 0}")

                if task_out.pydantic:
                    data = task_out.pydantic.model_dump()
                    if isinstance(task_out.pydantic, SamplingRecommendation):
                        parsed["recommendation"] = data
                        result(PASS, f"  Task[{i}] -> SamplingRecommendation (pydantic)")
                        result(INFO, f"    primary_path: {data.get('primary_path')}")
                        result(INFO, f"    reason: {data.get('reason', '')[:100]}...")
                    elif isinstance(task_out.pydantic, MicroActivity):
                        parsed["micro_activity"] = data
                        result(PASS, f"  Task[{i}] -> MicroActivity (pydantic)")
                        result(INFO, f"    title: {data.get('title')}")
                        result(INFO, f"    duration: {data.get('duration')}")
                    elif isinstance(task_out.pydantic, CuratedVideos):
                        parsed["videos"] = data.get("videos", [])
                        result(PASS, f"  Task[{i}] -> CuratedVideos (pydantic)")
                        result(INFO, f"    video count: {len(parsed['videos'])}")
                        for j, v in enumerate(parsed["videos"]):
                            result(INFO, f"    Video {j+1}: \"{v.get('title', '?')}\" - {v.get('url', 'no url')}")
                    else:
                        result(WARN, f"  Task[{i}] -> Unknown pydantic type: {type(task_out.pydantic).__name__}")
                else:
                    result(WARN, f"  Task[{i}] has NO pydantic output - falling back to raw")
                    if task_out.raw:
                        preview = task_out.raw[:300].replace("\n", " ")
                        result(INFO, f"  Task[{i}] raw preview: {preview}")

                        # Try raw JSON parsing (same as api.py fallback)
                        from meraki_flow.api import parse_task_output_json
                        task_json = parse_task_output_json(task_out.raw)
                        if task_json:
                            result(INFO, f"  Task[{i}] raw parsed JSON keys: {list(task_json.keys())}")
                        else:
                            result(FAIL, f"  Task[{i}] raw JSON parsing also failed")

        # ── Summary ──
        print()
        subheader("Sampling Preview Results Summary")
        if parsed["recommendation"]:
            result(PASS, f"Recommendation: primary_path={parsed['recommendation']['primary_path']}")
        else:
            result(FAIL, "Recommendation: MISSING")

        if parsed["micro_activity"]:
            result(PASS, f"Micro Activity: title={parsed['micro_activity']['title']}")
        else:
            result(FAIL, "Micro Activity: MISSING")

        if parsed["videos"] and len(parsed["videos"]) > 0:
            result(PASS, f"Videos: {len(parsed['videos'])} videos returned")
            for v in parsed["videos"]:
                has_url = bool(v.get("url"))
                has_thumb = bool(v.get("thumbnail"))
                result(INFO, f"  - \"{v.get('title', '?')}\" url={'yes' if has_url else 'NO'} thumb={'yes' if has_thumb else 'no'}")
        else:
            result(FAIL, "Videos: MISSING or EMPTY - This is likely the bug!")
            result(INFO, "Possible causes:")
            result(INFO, "  1. YOUTUBE_API_KEY not set or quota exceeded")
            result(INFO, "  2. YouTubeSearchTool returned errors that the agent couldn't handle")
            result(INFO, "  3. CrewAI failed to produce CuratedVideos pydantic output")
            result(INFO, "  4. The agent didn't call the youtube_search tool at all")

        print()
        result(INFO, "Full parsed result:")
        print_json_preview(parsed, max_lines=30)

        return True

    except Exception as e:
        result(FAIL, f"Sampling Preview crew failed: {e}")
        traceback.print_exc()
        return False


def test_local_experiences_crew():
    subheader("Local Experiences Crew")
    try:
        from meraki_flow.crews.local_experiences_crew.local_experiences_crew import LocalExperiencesCrew

        result(PASS, "LocalExperiencesCrew imported successfully")

        inputs = {
            "hobby_name": "photography",
            "location": "New York, NY",
        }

        result(INFO, f"Kicking off crew for hobby: {inputs['hobby_name']} in {inputs['location']}")

        start = time.time()
        crew_instance = LocalExperiencesCrew().crew()
        crew_result = crew_instance.kickoff(inputs=inputs)
        elapsed = time.time() - start

        result(INFO, f"Crew completed in {elapsed:.1f}s")

        # Inspect result
        result(INFO, f"Result type: {type(crew_result).__name__}")
        result(INFO, f"result.raw length: {len(crew_result.raw) if crew_result.raw else 0}")
        result(INFO, f"result.tasks_output count: {len(crew_result.tasks_output) if crew_result.tasks_output else 0}")

        if crew_result.tasks_output:
            for i, task_out in enumerate(crew_result.tasks_output):
                result(INFO, f"  Task[{i}] name: {task_out.name}")
                result(INFO, f"  Task[{i}] pydantic type: {type(task_out.pydantic).__name__ if task_out.pydantic else 'None'}")

                if task_out.pydantic:
                    data = task_out.pydantic.model_dump()
                    spots = data.get("local_spots", [])
                    tips = data.get("general_tips", {})
                    result(PASS, f"  Pydantic output: {len(spots)} spots, tips={'yes' if tips else 'no'}")
                    for j, s in enumerate(spots[:3]):
                        result(INFO, f"    Spot {j+1}: \"{s['name']}\" ({s.get('type', '?')}) - {s.get('address', 'no address')}")
                else:
                    result(WARN, f"  Task[{i}] no pydantic - raw length: {len(task_out.raw) if task_out.raw else 0}")

        # Test parsing used in api.py
        if crew_result.tasks_output and crew_result.tasks_output[0].pydantic:
            parsed = crew_result.tasks_output[0].pydantic.model_dump()
            result(PASS, "Parsed via pydantic model_dump()")
        else:
            from meraki_flow.api import parse_task_output_json
            parsed = parse_task_output_json(crew_result.raw or "")
            if parsed:
                result(WARN, "Parsed via raw JSON fallback")
            else:
                parsed = {"local_spots": [], "general_tips": {}}
                result(FAIL, "Parsing failed - empty result")

        spots = parsed.get("local_spots", [])
        tips = parsed.get("general_tips", {})

        result(INFO, f"Final spots: {len(spots)}, tips: {'yes' if tips else 'no'}")
        print_json_preview(parsed, max_lines=20)

        return True

    except Exception as e:
        result(FAIL, f"Local Experiences crew failed: {e}")
        traceback.print_exc()
        return False


def test_crews(specific_crew: str | None = None):
    header("3. CREW TESTS")
    print("  (Each crew test runs a full CrewAI kickoff - this may take 1-3 minutes per crew)")

    results = {}

    if specific_crew is None or specific_crew == "discovery":
        results["discovery"] = test_discovery_crew()
    if specific_crew is None or specific_crew == "sampling":
        results["sampling"] = test_sampling_preview_crew()
    if specific_crew is None or specific_crew == "local":
        results["local"] = test_local_experiences_crew()

    return results


# ── 4. Parsing Tests ─────────────────────────────────────────────────────────

def test_parsing():
    header("4. OUTPUT PARSING TESTS")
    from meraki_flow.api import parse_crew_output, parse_task_output_json, classify_task_json

    subheader("parse_crew_output")

    # Test: clean JSON
    clean = '{"matches": [{"hobby_slug": "pottery", "match_percentage": 94}], "encouragement": "Go for it!"}'
    parsed = parse_crew_output(clean)
    if parsed.get("matches") and len(parsed["matches"]) == 1:
        result(PASS, "Clean JSON parsed correctly")
    else:
        result(FAIL, f"Clean JSON parsing failed: {parsed}")

    # Test: JSON embedded in text
    embedded = 'Here is my analysis:\n\n```json\n{"matches": [{"hobby_slug": "drawing", "match_percentage": 88}], "encouragement": "Try it!"}\n```'
    parsed = parse_crew_output(embedded)
    if parsed.get("matches") and len(parsed["matches"]) == 1:
        result(PASS, "Embedded JSON parsed correctly")
    else:
        result(FAIL, f"Embedded JSON parsing failed: {parsed}")

    # Test: no JSON at all
    garbage = "I think you should try pottery because it's fun and relaxing."
    parsed = parse_crew_output(garbage)
    if parsed.get("matches") == [] and "raw_output" in parsed:
        result(PASS, "Garbage input falls back to raw_output correctly")
    else:
        result(FAIL, f"Garbage input handling unexpected: {parsed}")

    subheader("parse_task_output_json")

    # Test: direct JSON
    direct = '{"primary_path": "watch", "reason": "You prefer solo"}'
    parsed = parse_task_output_json(direct)
    if parsed and parsed.get("primary_path") == "watch":
        result(PASS, "Direct JSON task output parsed")
    else:
        result(FAIL, f"Direct JSON parsing failed: {parsed}")

    # Test: text then JSON
    mixed = 'Based on analysis:\n{"title": "Frame the World", "instruction": "Look around", "duration": "3 min", "why_it_works": "Builds observation"}'
    parsed = parse_task_output_json(mixed)
    if parsed and parsed.get("title") == "Frame the World":
        result(PASS, "Mixed text+JSON parsed correctly")
    else:
        result(FAIL, f"Mixed text+JSON parsing failed: {parsed}")

    subheader("classify_task_json")

    rec = {"primary_path": "watch", "reason": "test"}
    assert classify_task_json(rec) == "recommendation"
    result(PASS, "Recommendation classified correctly")

    micro = {"title": "Test", "instruction": "Do this"}
    assert classify_task_json(micro) == "micro_activity"
    result(PASS, "Micro activity classified correctly")

    vids = {"videos": [{"url": "https://youtube.com/watch?v=123"}]}
    assert classify_task_json(vids) == "videos"
    result(PASS, "Videos classified correctly")

    unknown = {"something": "else"}
    assert classify_task_json(unknown) is None
    result(PASS, "Unknown type returns None correctly")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Test Meraki CrewAI crews individually")
    parser.add_argument("--tools", action="store_true", help="Test tools only")
    parser.add_argument("--crews", action="store_true", help="Test crews only")
    parser.add_argument("--parsing", action="store_true", help="Test parsing only")
    parser.add_argument("--crew", type=str, choices=["discovery", "sampling", "local"],
                        help="Test a specific crew")
    parser.add_argument("--env", action="store_true", help="Test environment only")
    args = parser.parse_args()

    run_all = not any([args.tools, args.crews, args.parsing, args.crew, args.env])

    print(f"\n{'#'*60}")
    print(f"  Meraki CrewAI Diagnostic Test")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")

    if run_all or args.env:
        test_environment()

    if run_all or args.parsing:
        test_parsing()

    if run_all or args.tools:
        test_tools()

    if run_all or args.crews:
        test_crews()
    elif args.crew:
        test_crews(specific_crew=args.crew)

    header("DONE")
    print("  Review [FAIL] and [WARN] items above to identify the issue.")
    print("  Most likely culprit for 'No curated videos': YouTube tool or pydantic output.\n")


if __name__ == "__main__":
    main()
