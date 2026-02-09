# Backend Setup — Meraki API

Step-by-step guide to set up and run the Meraki FastAPI backend using **uv**.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.10 – 3.13 |
| [uv](https://docs.astral.sh/uv/) | latest |

Install uv if you don't have it yet:

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

You will also need:
- A **Supabase** project (for the database) — [supabase.com](https://supabase.com)
- An **OpenAI** API key — [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- A **Google Cloud** API key with **Places API** and **YouTube Data API v3** enabled — [console.cloud.google.com](https://console.cloud.google.com)
- An **Opik** API key for observability — [comet.com/site/products/opik](https://www.comet.com/site/products/opik/)

---

## 1. Clone and Navigate

```bash
git clone <repo-url>
cd Meraki/backend
```

---

## 2. Create the Virtual Environment and Install Dependencies

uv handles the virtual environment and dependency resolution in a single command:

```bash
uv sync
```

This reads `pyproject.toml`, creates a `.venv/` in the backend directory, and installs all dependencies (including CrewAI, FastAPI, Opik, Supabase client, etc.).

To also install dev dependencies (pytest, coverage):

```bash
uv sync --extra dev
```

---

## 3. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.exemple .env
```

---

## 4. Set Up the Database

The database schema is managed via SQL migration files located in `frontend/supabase/migrations/`. Run them **in order** in your Supabase SQL Editor (Dashboard → SQL Editor):

| Order | File | Description |
|---|---|---|
| 1 | `001_initial_schema.sql` | Core tables (profiles, hobbies, challenges, sessions, quiz, matches, milestones), RLS policies, triggers, helper functions |
| 2 | `002_sampling_results.sql` | Sampling results cache table |
| 3 | `003_jobs_table.sql` | Background job tracking table |
| 4 | `004_hobby_matches_write_policies.sql` | Write policies for hobby matches |
| 5 | `005_nudges_table.sql` | Motivation nudges table |
| 6 | `006_seed_milestones.sql` | Seed milestone definitions |
| 7 | `007_hobbies_insert_policy.sql` | Insert policy for hobbies |
| 8 | `008_roadmaps.sql` | Roadmaps and user_roadmaps tables |

Open each file, paste it into the SQL Editor, and run. They must be executed sequentially since later migrations reference tables created by earlier ones.

---

## 5. Run the Server

```bash
uv run api
```

This invokes the `api` script defined in `pyproject.toml`, which starts the FastAPI server with hot-reload:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Alternatively, you can run directly:

```bash
uv run uvicorn meraki_flow.api:app --reload --host 0.0.0.0 --port 8000
```

---

## 6. Verify It's Working

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{"status": "healthy", "service": "meraki-api"}
```

---

## 7. Run Evaluations (Optional)

To batch-evaluate all CrewAI crews against the curated Opik datasets:

```bash
uv run python -m meraki_flow.evaluation.run_evaluation
```

Results are saved as timestamped JSON files in `src/meraki_flow/evaluation/results/`.

---

## 8. Run Tests

```bash
uv run pytest
```

With coverage:

```bash
uv run pytest --cov=meraki_flow
```

---

## Useful Commands Reference

| Command | Description |
|---|---|
| `uv sync` | Install/update all dependencies |
| `uv sync --extra dev` | Install with dev dependencies |
| `uv run api` | Start the FastAPI server |
| `uv run pytest` | Run the test suite |
| `uv run python -m meraki_flow.evaluation.run_evaluation` | Run crew evaluations |
| `uv add <package>` | Add a new dependency |
| `uv lock` | Regenerate the lock file |

