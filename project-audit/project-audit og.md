# Meraki Project Audit

**Date:** 2026-02-07
**Scope:** Full-stack audit (Backend + Frontend + Supabase data flow)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Backend Audit](#2-backend-audit)
3. [Frontend Audit](#3-frontend-audit)
4. [Data Flow: Backend <-> Frontend <-> Supabase](#4-data-flow-backend--frontend--supabase)
5. [Broken Chains](#5-broken-chains)
6. [Dead / Useless Code](#6-dead--useless-code)
7. [Incomplete Logic](#7-incomplete-logic)
8. [Caching & Session Strategy](#8-caching--session-strategy)
9. [Security & Production Readiness](#9-security--production-readiness)
10. [Summary & Recommendations](#10-summary--recommendations)

---

## 1. Architecture Overview

```
+------------------+       REST API        +------------------+
|                  |  POST /discovery      |                  |
|    Next.js 14    |  POST /sampling/*     |  FastAPI + CrewAI |
|   (App Router)   | -------------------→ |  (Background      |
|                  |  GET  /{job_id}       |   Threads)        |
|  Server Actions  | ←------------------- |                  |
|  + Client Pages  |    JSON responses     |  5 AI Crews       |
+--------+---------+                      +------------------+
         |                                        |
         |  Supabase SDK (server+client)          | NO DB ACCESS
         v                                        |
+------------------+                              |
|    Supabase DB   |     (backend does NOT        |
|   (PostgreSQL)   |      talk to Supabase)       |
|                  |                              |
|  - quiz_responses|                              |
|  - hobby_matches |                              |
|  - sampling_results                             |
|  - local_experience_results                     |
|  - user_hobbies  |                              |
|  - practice_sessions                            |
|  - user_challenges                              |
|  - profiles      |                              |
+------------------+                              |
                                                  |
                              External APIs:      |
                              - YouTube Data v3   |
                              - Google Places     |
                              - DuckDuckGo (free) |
```

**Key Insight:** The backend has ZERO Supabase integration. All database persistence is handled exclusively by the Next.js frontend via server actions. The backend is a stateless AI processing engine that stores jobs in memory only.

---

## 2. Backend Audit

### 2.1 Project Structure

```
backend/src/meraki_flow/
├── api.py                              # FastAPI server (567 lines) - THE entry point
├── main.py                             # CrewAI Flow orchestrator (250 lines) - BROKEN, unused
├── models.py                           # Pydantic output models (69 lines)
├── state.py                            # Flow state definitions (42 lines)
├── crews/
│   ├── discovery_crew/                 # Quiz → hobby matching
│   ├── sampling_preview_crew/          # Hobby → watch/micro/local pathways
│   ├── local_experiences_crew/         # Location → nearby venues
│   ├── practice_crew/                  # Session feedback & challenges
│   └── retention_crew/                 # Re-engagement & motivation
├── tools/
│   ├── youtube_search.py               # YouTube Data API v3 integration
│   ├── google_places.py                # Google Places API integration
│   ├── web_search.py                   # DuckDuckGo free search
│   ├── custom_tool.py                  # UNUSED template
│   ├── opik_tracking.py                # Observability init
│   └── opik_metrics.py                 # 4 custom evaluation metrics
├── evaluation/                         # Agent evaluation suite
│   ├── evaluate_agents.py
│   ├── analyze_experiments.py
│   ├── online_rules.py                 # BROKEN - references non-existent crew
│   └── datasets/*.json
└── optimization/                       # Prompt optimization (UNUSED)
    ├── discovery_optimizer.py
    ├── challenge_optimizer.py
    └── datasets/*.json
```

### 2.2 API Endpoints

| Endpoint | Method | Request Body | Response | Used By Frontend |
|----------|--------|-------------|----------|-----------------|
| `/discovery` | POST | `{user_id, q1..q22}` | `{job_id}` | Yes - quiz results page |
| `/discovery/{job_id}` | GET | - | `{status, result, error}` | Yes - polling |
| `/sampling/preview` | POST | `{hobby_name, quiz_answers}` | `{job_id}` | Yes - sampling page |
| `/sampling/preview/{job_id}` | GET | - | `{status, result, error}` | Yes - polling |
| `/sampling/local` | POST | `{hobby_name, location}` | `{job_id}` | Yes - local page |
| `/sampling/local/{job_id}` | GET | - | `{status, result, error}` | Yes - polling |
| `/health` | GET | - | `{status: "healthy"}` | No |

**Missing from API but crews exist:**
- Practice Crew - no `/practice` endpoint in `api.py`
- Retention Crew - no `/retention` endpoint in `api.py`

### 2.3 Crew Details

| Crew | Agents | Tasks | Tools | Pydantic Output |
|------|--------|-------|-------|-----------------|
| DiscoveryCrew | 1 (discovery_agent) | 3 (analyze → rank → recommend) | None | No (raw JSON) |
| SamplingPreviewCrew | 1 (sampling_preview_agent) | 3 (recommend path → micro activity → videos) | YouTubeSearchTool | Yes (3 models) |
| LocalExperiencesCrew | 1 (local_experiences_agent) | 1 (find_local) | GooglePlacesTool, WebSearchTool | Yes |
| PracticeCrew | 2 (practice + challenge) | 4 (analyze → feedback → emotional → challenge) | None | Not checked |
| RetentionCrew | 2 (motivation + stuck_helper) | 4 (detect stall → intervene → patterns → unstick) | None | Not checked |

### 2.4 Job Storage

```python
# api.py line 96
job_store: dict[str, Job] = {}  # In-memory only!
```

**CRITICAL:** All jobs are stored in a plain Python dict. No persistence, no thread safety (no locks), lost on restart.

---

## 3. Frontend Audit

### 3.1 Page Map

| Route | Purpose | Data Source | Saves To |
|-------|---------|-------------|----------|
| `/` | Landing page | Static | - |
| `/discover` | Quiz intro | Static | - |
| `/discover/quiz` | 9-section quiz (22 questions) | `useQuiz()` hook | `quiz_responses` table |
| `/discover/quiz/results` | Hobby matches display | Cache → DB → API crew | `hobby_matches` table |
| `/discover/sampling/[slug]` | Sampling preview (3 pathways) | Cache → DB → API crew | `sampling_results` table |
| `/discover/sampling/[slug]/watch` | Watch videos | URL jobId → API poll → defaults | - |
| `/discover/sampling/[slug]/micro` | Micro-activity | URL jobId → API poll → defaults | - |
| `/discover/sampling/[slug]/local` | Local experiences | Geolocation → API crew | `local_experience_results` table |
| `/discover/sampling/[slug]/project` | Try-at-home project | Static `hobbyData.ts` | localStorage |
| `/discover/sampling/[slug]/journey` | 7-day journey | Static `hobbyData.ts` | localStorage |
| `/discover/sampling/[slug]/complete` | Completion page | hobbySlug param | `user_hobbies` table |
| `/dashboard` | Main dashboard | DB reads (5 queries) | - |
| `/dashboard/sessions` | Session list | DB | - |
| `/dashboard/sessions/[id]` | Session detail | DB with joins | - |
| `/dashboard/challenges` | Challenge list | DB | - |
| `/dashboard/challenges/[id]` | Challenge detail | DB | - |
| `/dashboard/progress` | Heatmap | DB | - |
| `/dashboard/motivation` | Streaks | DB | - |
| `/profile` | User profile edit | DB | `profiles` table |
| `/settings` | App settings | DB | `user_settings` table |
| `/auth/login` | Login | Supabase Auth | - |
| `/auth/signup` | Signup | Supabase Auth | - |
| `/auth/forgot-password` | Password reset request | Supabase Auth | - |
| `/auth/reset-password` | Password reset form | Supabase Auth | - |

### 3.2 Server Actions

| File | Action | Supabase Table | Operation |
|------|--------|---------------|-----------|
| `actions/quiz.ts` | `saveQuizResponses()` | `quiz_responses` | Upsert |
| `actions/quiz.ts` | `saveHobbyMatches()` | `hobby_matches` + `hobbies` | Delete old + insert |
| `actions/quiz.ts` | `getHobbyMatches()` | `hobby_matches` + `hobbies` | Select with join |
| `actions/discovery.ts` | `triggerDiscovery()` | `quiz_responses` (read) | Select → POST to API |
| `actions/discovery.ts` | `pollDiscoveryStatus()` | - | GET from API |
| `actions/sampling.ts` | `triggerSamplingPreview()` | `quiz_responses` (read) | Select → POST to API |
| `actions/sampling.ts` | `pollSamplingPreviewStatus()` | - | GET from API |
| `actions/sampling.ts` | `getSamplingResult()` | `sampling_results` | Select |
| `actions/sampling.ts` | `saveSamplingResult()` | `sampling_results` | Upsert |
| `actions/sampling.ts` | `triggerLocalExperiences()` | - | POST to API |
| `actions/sampling.ts` | `pollLocalExperiencesStatus()` | - | GET from API |
| `actions/sampling.ts` | `getLocalExperienceResult()` | `local_experience_results` | Select |
| `actions/sampling.ts` | `saveLocalExperienceResult()` | `local_experience_results` | Upsert |
| `actions/sampling.ts` | `completeSampling()` | `user_hobbies` + `hobbies` | Upsert |
| `actions/hobbies.ts` | `getUserHobbies()` | `user_hobbies` + joins | Select |
| `actions/hobbies.ts` | `addUserHobby()` | `user_hobbies` | Insert |
| `actions/hobbies.ts` | `updateHobbyStatus()` | `user_hobbies` | Update |
| `actions/hobbies.ts` | `getAllHobbies()` | `hobbies` | Select all |
| `actions/sessions.ts` | `createSession()` | `practice_sessions` | Insert |
| `actions/sessions.ts` | `getSessions()` | `practice_sessions` + joins | Select |
| `actions/sessions.ts` | `getSessionById()` | `practice_sessions` + joins | Select |
| `actions/challenges.ts` | `getUserChallenges()` | `user_challenges` + joins | Select |
| `actions/challenges.ts` | `getChallengeById()` | `user_challenges` + joins | Select |
| `actions/challenges.ts` | `completeChallenge()` | `user_challenges` | Update |
| `actions/stats.ts` | `getUserStats()` | RPC `get_user_stats()` | Function call |
| `actions/stats.ts` | `getStreakDays()` | `practice_sessions` | Select |
| `actions/stats.ts` | `getHeatmapData()` | `practice_sessions` | Select |
| `actions/stats.ts` | `getUserMilestones()` | `milestones` + `user_milestones` | Select |

---

## 4. Data Flow: Backend <-> Frontend <-> Supabase

### 4.1 Discovery Flow (Quiz → Hobby Matches)

```
USER answers 22 questions in quiz UI
         │
         ▼
[Quiz Page] ──saveQuizResponses()──→ [Supabase: quiz_responses] (upsert)
         │
         ▼
[Results Page] ──triggerDiscovery()──→ [Server Action]
         │                                    │
         │                    Reads quiz_responses from Supabase
         │                    Maps to {user_id, q1..q22}
         │                                    │
         │                                    ▼
         │                         POST /discovery → [Backend]
         │                                    │
         │                         DiscoveryCrew kicks off
         │                         3 tasks: analyze → rank → recommend
         │                                    │
         │                                    ▼
         │                         Returns: {matches: [{hobby_slug,
         │                                   match_percentage, match_tags,
         │                                   reasoning}], encouragement}
         │                                    │
         ◄────────────────────────────────────┘
         │
         ▼
[Results Page] stores in:
  1. Module-level cache (matchesCache Map)
  2. sessionStorage ("quiz-matches")
  3. saveHobbyMatches() → [Supabase: hobby_matches] (delete + insert)
         │
         ▼
User clicks a hobby card → navigate to /discover/sampling/[slug]
```

### 4.2 Sampling Preview Flow

```
[Sampling Page] checks 3-tier cache:
  1. Module cache (resultCache) → instant if found
  2. sessionStorage ("sampling-preview-{slug}") → sync if found
  3. getSamplingResult() → [Supabase: sampling_results] → if found
  4. If nothing cached → triggerSamplingPreview()
         │
         ▼
[Server Action: triggerSamplingPreview()]
  - Reads quiz_responses from Supabase (filters Q3,Q5,Q7,Q9,Q10,Q11,Q14,Q15)
  - POST /sampling/preview {hobby_name, quiz_answers}
         │
         ▼
[Backend: SamplingPreviewCrew]
  Task 1: recommend_sampling_path_task → {primary_path, reason, ...}
  Task 2: generate_micro_activity_task → {title, instruction, duration, ...}
  Task 3: curate_watch_videos_task → {videos: [{title, url, thumbnail, ...}]}
         │
         ▼
[Sampling Page] receives result, stores in:
  1. Module cache (resultCache)
  2. sessionStorage ("sampling-preview-{slug}")
  3. saveSamplingResult() → [Supabase: sampling_results] (upsert)
         │
         ▼
Displays 3 pathway cards: Watch / Try Micro Activity / Find Locally
Also stores jobId in sessionStorage ("sampling-job-{slug}")
and passes it via URL param to child pages
```

### 4.3 Local Experiences Flow

```
[Local Page] opens location modal
  - Google Places autocomplete OR browser geolocation
  - User confirms location
         │
         ▼
Checks: getLocalExperienceResult() → [Supabase: local_experience_results]
  If cached for this hobby+location → display immediately
  Else → triggerLocalExperiences()
         │
         ▼
[Server Action: triggerLocalExperiences()]
  POST /sampling/local {hobby_name, location}
         │
         ▼
[Backend: LocalExperiencesCrew]
  Agent uses: GooglePlacesTool + WebSearchTool
  - Google Places: searches "{hobby} class/workshop/studio near {location}"
  - DuckDuckGo: searches for meetups, eventbrite, community events
  - Deduplicates, sorts by rating
  - Returns: {local_spots: [...], general_tips: {...}}
         │
         ▼
[Local Page] receives result, stores:
  saveLocalExperienceResult() → [Supabase: local_experience_results] (upsert)
  Displays venue cards + beginner tips
```

### 4.4 Watch & Micro Pages (Child Pages)

```
[Watch/Micro Page]
  Reads jobId from URL param (passed by parent sampling page)
         │
         ▼
  If jobId exists → poll backend directly (client-side fetch)
    GET /sampling/preview/{jobId}
    Extract videos / micro_activity from result
         │
  If no jobId OR poll fails → fall back to default content
    Watch: default video list (hardcoded)
    Micro: default activities by slug from hobbyData.ts
         │
  NOTE: These pages also try sessionStorage as secondary source
  KEY: "sampling-preview-{slug}" written by parent page
```

### 4.5 Dashboard Data Flow

```
[Dashboard Page] loads 5 queries in parallel on mount:
  1. getUserStats()       → RPC get_user_stats(user_id) → stats summary
  2. getUserHobbies()     → user_hobbies + hobbies join → hobby cards
  3. getSessions()        → practice_sessions + joins → recent sessions
  4. getUserChallenges()  → user_challenges + joins → active challenges
  5. getStreakDays()       → practice_sessions dates → streak count
         │
         ▼
All read from Supabase. No backend API calls.
Dashboard is purely a Supabase consumer.
```

### 4.6 Data That Never Reaches Supabase

| Data | Generated By | Stored In | Persisted? |
|------|-------------|-----------|------------|
| Project progress (steps) | User interaction | localStorage | Browser only |
| Journey progress (days) | User interaction | localStorage | Browser only |
| Backend job metadata | api.py job_store | In-memory dict | NO - lost on restart |
| Opik traces | CrewAI hooks | Opik cloud | External service |

### 4.7 Supabase Tables Referenced (Full List)

| Table | Written By | Read By | RLS Required |
|-------|-----------|---------|-------------|
| `quiz_responses` | saveQuizResponses | triggerDiscovery, triggerSamplingPreview | Yes (auth.uid) |
| `hobbies` | (seed data) | saveHobbyMatches, completeSampling, getAllHobbies | No (public read) |
| `hobby_matches` | saveHobbyMatches | getHobbyMatches | Yes (auth.uid) |
| `sampling_results` | saveSamplingResult | getSamplingResult | Yes (auth.uid) |
| `local_experience_results` | saveLocalExperienceResult | getLocalExperienceResult | Yes (auth.uid) |
| `user_hobbies` | completeSampling, addUserHobby, updateHobbyStatus | getUserHobbies | Yes (auth.uid) |
| `practice_sessions` | createSession | getSessions, getSessionById, getStreakDays, getHeatmapData | Yes (auth.uid) |
| `user_challenges` | completeChallenge | getUserChallenges, getChallengeById | Yes (auth.uid) |
| `challenges` | (seed data) | getUserChallenges (join) | No (public read) |
| `profiles` | updateProfile | UserProvider | Yes (auth.uid) |
| `user_settings` | updateSettings | UserProvider | Yes (auth.uid) |
| `milestones` | (seed data) | getUserMilestones (join) | No (public read) |
| `user_milestones` | (not found) | getUserMilestones | Yes (auth.uid) |
| `ai_feedback` | (not found - backend?) | getSessionById (join) | Yes (auth.uid) |

---

## 5. Broken Chains

### 5.1 CRITICAL: `SamplingCrew` Import Does Not Exist

**Files affected:**
- `backend/src/meraki_flow/main.py` line 12: `from meraki_flow.crews.sampling_crew.sampling_crew import SamplingCrew`
- `backend/src/meraki_flow/evaluation/online_rules.py` line 158: same import

**Problem:** The directory `crews/sampling_crew/` does not exist. Only `crews/sampling_preview_crew/` exists with class `SamplingPreviewCrew`.

**Impact:** `main.py` (the Flow orchestrator) and `online_rules.py` will crash on import. These modules appear to be unused by `api.py` (which imports crews directly), so the live API works, but they are broken code paths.

### 5.2 CRITICAL: Practice & Retention Crews Have No API Endpoints

**Problem:** Two crews are fully implemented but have no corresponding FastAPI endpoints:
- `PracticeCrew` - feedback, emotional check-in, challenge calibration
- `RetentionCrew` - stall detection, intervention, unsticking

**Frontend references:**
- Dashboard has `SessionLoggerModal` with `EmotionalCheckIn` component
- Dashboard has `StuckHelper` and `MotivationNudge` components
- `actions/challenges.ts` reads challenges but never triggers the practice crew
- `actions/stats.ts` reads streak data but never triggers the retention crew

**Impact:** The practice and retention features exist in UI and crew form but have no bridge between them. The frontend reads challenge/session data from Supabase but never triggers AI-generated feedback or motivation interventions.

### 5.3 MODERATE: `ai_feedback` Table Read but Never Written

**Problem:** `getSessionById()` in `actions/sessions.ts` joins with `ai_feedback` table, but no server action or backend endpoint writes to this table.

**Impact:** Session detail pages will always show empty AI feedback. The `PracticeCrew` would generate this feedback, but it has no API endpoint (see 5.2).

### 5.4 MODERATE: `user_milestones` Table Read but Never Written

**Problem:** `getUserMilestones()` in `actions/stats.ts` reads from `user_milestones` join table, but no code ever inserts milestone achievements.

**Impact:** Progress page milestones section will always be empty.

### 5.5 MODERATE: Challenge Creation Missing

**Problem:** `getUserChallenges()` and `getChallengeById()` read from `user_challenges`, and `completeChallenge()` updates status, but no code creates new challenges for users. The `PracticeCrew` generates challenge calibrations, but results are never stored.

**Impact:** Users will never have challenges unless manually inserted into the database.

### 5.6 LOW: `main.py` Flow Orchestrator Is Entirely Unused

**Problem:** `main.py` defines a `MerakiFlow` class using CrewAI's Flow pattern, but `api.py` bypasses it entirely by calling crews directly.

**Impact:** 250 lines of dead orchestration code. The Flow pattern (with state management and routing) was likely the original design but was replaced by direct crew calls in `api.py`.

---

## 6. Dead / Useless Code

### 6.1 Files to Delete

| File | Reason | Lines |
|------|--------|-------|
| `backend/src/meraki_flow/main.py` | Unused Flow orchestrator, broken imports | 250 |
| `backend/src/meraki_flow/tools/custom_tool.py` | Template placeholder, never imported | 22 |
| `frontend/src/lib/quizData copy.ts` | Exact duplicate of `quizData.ts` | ~200 |
| `frontend/src/components/landing/SolutionSection copy.tsx` | Exact duplicate of `SolutionSection.tsx` | ~100 |

### 6.2 Modules Never Called

| File/Module | Purpose | Why Unused |
|-------------|---------|------------|
| `backend/src/meraki_flow/optimization/discovery_optimizer.py` | Prompt optimization | Never imported by api.py |
| `backend/src/meraki_flow/optimization/challenge_optimizer.py` | Prompt optimization | Never imported by api.py |
| `backend/src/meraki_flow/evaluation/analyze_experiments.py` | Experiment analysis | Development tool only |
| `backend/src/meraki_flow/evaluation/online_rules.py` | Production tracing | Broken import (SamplingCrew) |
| `backend/src/meraki_flow/state.py` | Flow state | Only used by unused `main.py` |

### 6.3 Unused Exports / Variables

None found in frontend - all exported components are actively imported and used.

---

## 7. Incomplete Logic

### 7.1 CRITICAL: No Persistence for Backend Jobs

**File:** `backend/src/meraki_flow/api.py` line 96
**Code:** `job_store: dict[str, Job] = {}`

**Problem:** Jobs are stored in a Python dict. Server restart = all jobs lost. If a user triggers a crew and the server restarts mid-processing, the job disappears with no error feedback.

### 7.2 CRITICAL: No Thread Safety on Job Store

**File:** `backend/src/meraki_flow/api.py`
**Problem:** Multiple background threads read/write `job_store` without any locking mechanism (`threading.Lock`). Under concurrent load, this can cause race conditions.

### 7.3 HIGH: Opik Calls Unprotected in 2 Crews

**Files:**
- `backend/src/meraki_flow/crews/practice_crew/practice_crew.py` lines 18, 33
- `backend/src/meraki_flow/crews/retention_crew/retention_crew.py` lines 18, 33

**Problem:** Direct `opik_context.update_current_trace()` calls without try-except. Other crews (discovery, sampling_preview, local_experiences) properly wrap these in `if OPIK_AVAILABLE: try/except`.

**Impact:** If Opik is unavailable, these crews will crash instead of degrading gracefully.

### 7.4 MODERATE: Watch/Micro Pages Silent Fallback

**Files:**
- `frontend/src/app/discover/sampling/[hobbySlug]/watch/page.tsx`
- `frontend/src/app/discover/sampling/[hobbySlug]/micro/page.tsx`

**Problem:** When backend polling fails or no jobId is available, these pages silently fall back to default/hardcoded content with no indication to the user that they're seeing generic content instead of personalized recommendations.

### 7.5 MODERATE: No Post-Completion Redirect

**File:** `frontend/src/app/discover/sampling/[hobbySlug]/complete/page.tsx`

**Problem:** After `completeSampling()` upserts to `user_hobbies`, the page just displays a success message. There is no automatic redirect to the dashboard. Users must manually navigate.

### 7.6 MODERATE: DB Saves Fail Silently When Unauthenticated

**Pattern across all server actions:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Not authenticated" };
```

**Problem:** Client-side callers (pages) often call save functions with `.catch(e => console.error(...))` but don't show UI feedback when the save fails due to authentication loss.

### 7.7 LOW: Hobby Slug Not Validated Against DB

**File:** `frontend/src/app/actions/sampling.ts` lines 93-99

**Problem:** `hobbySlug` format is validated (non-empty string) but never checked against the `hobbies` table to confirm it's a real hobby. Could trigger a crew for a non-existent hobby.

### 7.8 LOW: CORS Hardcoded to Localhost

**File:** `backend/src/meraki_flow/api.py`

**Problem:** CORS origins are hardcoded to `localhost:3000` only. Deploying to production would require code change.

---

## 8. Caching & Session Strategy

### 8.1 Three-Tier Cache Pattern

```
Tier 1: Module-Level Cache (Map outside React component)
  - Survives: unmount/remount during client-side navigation
  - Lost on: page refresh, new tab
  - Used by: quiz results, sampling preview

Tier 2: sessionStorage
  - Survives: unmount + soft navigation + same-tab refresh
  - Lost on: new tab, browser close
  - Used by: quiz matches, sampling preview, job IDs

Tier 3: Supabase Database
  - Survives: everything (cross-session, cross-device)
  - Requires: authenticated user (auth.uid)
  - Used by: all crew results
```

### 8.2 Cache Keys Reference

| Key Pattern | Storage | Writer | Reader | Purpose |
|-------------|---------|--------|--------|---------|
| `matchesCache` (Map) | Module | quiz/results | quiz/results | Hobby matches |
| `resultCache` (Map) | Module | sampling/[slug] | sampling/[slug] | Sampling preview |
| `jobIdCache` (Map) | Module | sampling/[slug] | sampling/[slug] | Active job IDs |
| `quiz-matches` | sessionStorage | quiz/results | quiz/results | Hobby matches backup |
| `sampling-preview-{slug}` | sessionStorage | sampling/[slug] | sampling/[slug], watch, micro | Preview results |
| `sampling-job-{slug}` | sessionStorage | sampling/[slug] | sampling/[slug] | Job ID for polling resume |
| `meraki-journey-{slug}` | localStorage | journey page | journey page | Day completion tracking |
| `meraki-project-{slug}` | localStorage | project page | project page | Step completion tracking |

### 8.3 Cache Gaps

1. **Local experiences** have no module-level or sessionStorage cache - only Supabase (requires auth + network roundtrip on every back-nav).
2. **Watch/micro pages** read sessionStorage from parent but never write their own cache - re-poll on every visit.
3. **Dashboard data** has no caching at all - 5 parallel DB queries on every mount.

---

## 9. Security & Production Readiness

### 9.1 Backend Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| No authentication on API | HIGH | Any client can POST to /discovery, /sampling/* |
| No rate limiting | HIGH | Could be abused to exhaust LLM credits |
| CORS localhost only | MEDIUM | Must update for deployment |
| No input sanitization | LOW | Quiz answers passed directly to LLM prompts |
| No HTTPS enforcement | MEDIUM | Depends on deployment setup |
| API keys in .env | OK | Standard pattern, just ensure not committed |

### 9.2 Frontend Issues

| Issue | Severity | Detail |
|-------|----------|--------|
| All server actions check auth.uid | OK | Proper authentication |
| Supabase RLS assumed | OK | Standard pattern for row-level security |
| NEXT_PUBLIC_ env vars exposed | LOW | Only API URLs and Google Maps key |
| No CSRF protection | LOW | Server actions have built-in Next.js protection |

### 9.3 Environment Variables Required

**Backend (.env):**
- `YOUTUBE_API_KEY` - YouTube Data API v3
- `GOOGLE_PLACES_API_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Places API
- `OPENAI_API_KEY` or equivalent - LLM for CrewAI
- `OPIK_API_KEY` - Observability (optional, but practice/retention crews crash without it)

**Frontend (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `CREWAI_API_URL` - Backend URL (server-side)
- `NEXT_PUBLIC_CREWAI_API_URL` - Backend URL (client-side, defaults to localhost:8000)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps/Places
- `NEXT_PUBLIC_SITE_URL` - For password reset redirects

---

## 10. Summary & Recommendations

### 10.1 Critical Issues (Fix Immediately)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Practice & Retention crews have no API endpoints | `api.py` | Add `/practice` and `/retention` endpoints, or remove the crews if not needed yet |
| 2 | `ai_feedback`, `user_milestones`, `user_challenges` are read but never written | Server actions | Wire up practice crew results to write these, or remove the UI that reads them |
| 3 | `SamplingCrew` import broken in main.py and online_rules.py | `main.py:12`, `online_rules.py:158` | Fix to `SamplingPreviewCrew` or delete these unused files |
| 4 | No thread safety on job_store | `api.py:96` | Add `threading.Lock` around all job_store reads/writes |
| 5 | Opik calls unprotected in practice_crew and retention_crew | `practice_crew.py:18,33`, `retention_crew.py:18,33` | Wrap in try-except like the other crews |

### 10.2 High Priority (Should Fix)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 6 | Job store is in-memory only | `api.py` | Persist to Supabase or Redis for production |
| 7 | No authentication on backend API | `api.py` | Add API key or JWT validation middleware |
| 8 | No rate limiting on crew endpoints | `api.py` | Add rate limiter (slowapi or similar) |
| 9 | Delete dead files | See section 6.1 | Remove 4 dead files |

### 10.3 Medium Priority (Nice to Have)

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 10 | Watch/micro pages show generic content silently | watch/page.tsx, micro/page.tsx | Add "showing default content" indicator |
| 11 | No post-sampling redirect | complete/page.tsx | Auto-redirect to dashboard after 3-5s |
| 12 | Local experiences have no module-level cache | local/page.tsx | Add cache Map like sampling page |
| 13 | Dashboard has no caching | dashboard/page.tsx | Add SWR or module-level cache |
| 14 | CORS hardcoded to localhost | api.py | Make configurable via env var |

### 10.4 Architecture Health Score

| Area | Score | Notes |
|------|-------|-------|
| Frontend ↔ Backend API contract | 8/10 | Clean polling pattern, well-typed. Missing 2 crew endpoints. |
| Frontend ↔ Supabase | 7/10 | Good server actions pattern. Some tables written but never populated. |
| Backend ↔ Supabase | 0/10 | No connection at all. Backend is fully stateless. |
| Caching strategy | 7/10 | Good 3-tier pattern on main pages. Missing on dashboard and local. |
| Error handling | 6/10 | Frontend is solid. Backend has unprotected Opik calls. |
| Dead code | 5/10 | Several unused files and modules. 2 duplicate files. |
| Data flow completeness | 5/10 | Discovery + Sampling flows are complete. Practice + Retention flows are broken chains. |
| Production readiness | 3/10 | No auth, no persistence, no rate limiting, hardcoded CORS. |

---

*Generated by project audit scan - 2026-02-07*
