"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

const API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── Types ───

export interface SamplingPreviewJobResponse {
  job_id: string;
}

export interface SamplingPreviewResult {
  recommendation: {
    primary_path: "watch" | "micro" | "local";
    reason: string;
    what_to_expect: string;
    secondary_path: "watch" | "micro" | "local";
    encouragement: string;
  } | null;
  micro_activity: {
    title: string;
    instruction: string;
    duration: string;
    why_it_works: string;
  } | null;
  videos: Array<{
    title: string;
    channel: string;
    url: string;
    thumbnail?: string;
    duration: string;
    why_good: string;
    what_to_watch_for?: string;
  }> | null;
}

export interface SamplingPreviewStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  result: SamplingPreviewResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalExperiencesJobResponse {
  job_id: string;
}

export interface LocalSpot {
  name: string;
  type: string;
  address: string;
  rating: number | null;
  reviews_count: number | null;
  price: string;
  url?: string;
  beginner_friendly: boolean;
  single_session: boolean;
  beginner_tips: string;
  source: "google_places" | "web_search";
}

export interface LocalExperiencesResult {
  local_spots: LocalSpot[];
  general_tips: {
    what_to_wear: string;
    what_to_bring: string;
    what_to_expect: string;
    how_to_not_feel_awkward: string;
  };
  search_location: string;
  hobby: string;
}

export interface LocalExperiencesStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  result: LocalExperiencesResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Sampling Preview Actions ───

/**
 * Trigger sampling preview by fetching relevant quiz answers and sending to the API.
 */
export async function triggerSamplingPreview(hobbySlug: string): Promise<{
  job_id?: string;
  error?: string;
}> {
  if (!hobbySlug || hobbySlug.length > 50 || !SLUG_RE.test(hobbySlug)) {
    return { error: "Invalid hobby slug." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch quiz responses if user is authenticated
  let quizAnswers = "";
  if (user) {
    const { data: responses } = await supabase
      .from("quiz_responses")
      .select("question_id, answer")
      .eq("user_id", user.id);

    if (responses && responses.length > 0) {
      // Extract relevant quiz answers for sampling recommendation
      // Focus on: q3 (social), q5 (energy), q7 (learning), q9 (schedule), q10 (gratification), q11 (style)
      const relevantQuestions = [3, 5, 7, 9, 10, 11, 14, 15];
      const relevantResponses = responses.filter((r) =>
        relevantQuestions.includes(r.question_id)
      );

      quizAnswers = relevantResponses
        .map((r) => {
          const answer = Array.isArray(r.answer)
            ? r.answer.join(", ")
            : String(r.answer ?? "");
          return `q${r.question_id}: ${answer}`;
        })
        .join("; ");
    }
  }

  // Convert slug to hobby name (capitalize and replace hyphens)
  const hobbyName = hobbySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  console.log("[Sampling Preview] Starting for hobby:", hobbyName);

  try {
    const response = await fetch(`${API_URL}/sampling/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hobby_name: hobbyName,
        quiz_answers: quizAnswers,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    const data: SamplingPreviewJobResponse = await response.json();
    console.log("[Sampling Preview] Job started:", data.job_id);
    return { job_id: data.job_id };
  } catch (e) {
    console.error("[Sampling Preview] API connection failed:", e);
    return { error: `Failed to connect to sampling API: ${e}` };
  }
}

/**
 * Poll the sampling preview job status.
 */
export async function pollSamplingPreviewStatus(
  jobId: string
): Promise<SamplingPreviewStatusResponse | { error: string }> {
  try {
    const response = await fetch(`${API_URL}/sampling/preview/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    const data: SamplingPreviewStatusResponse = await response.json();
    console.log("[Sampling Preview] Poll status:", data.status);
    return data;
  } catch (e) {
    console.error("[Sampling Preview] Poll failed:", e);
    return { error: `Failed to poll sampling preview status: ${e}` };
  }
}

// ─── Local Experiences Actions ───

/**
 * Trigger local experiences search for a hobby and location.
 */
export async function triggerLocalExperiences(
  hobbySlug: string,
  location: string
): Promise<{
  job_id?: string;
  error?: string;
}> {
  if (!hobbySlug || hobbySlug.length > 50 || !SLUG_RE.test(hobbySlug)) {
    return { error: "Invalid hobby slug." };
  }

  if (!location || location.trim().length < 2) {
    return { error: "Location is required." };
  }

  // Convert slug to hobby name
  const hobbyName = hobbySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  console.log("[Local Experiences] Starting for hobby:", hobbyName, "in", location);

  try {
    const response = await fetch(`${API_URL}/sampling/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hobby_name: hobbyName,
        location: location.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    const data: LocalExperiencesJobResponse = await response.json();
    console.log("[Local Experiences] Job started:", data.job_id);
    return { job_id: data.job_id };
  } catch (e) {
    console.error("[Local Experiences] API connection failed:", e);
    return { error: `Failed to connect to local experiences API: ${e}` };
  }
}

/**
 * Poll the local experiences job status.
 */
export async function pollLocalExperiencesStatus(
  jobId: string
): Promise<LocalExperiencesStatusResponse | { error: string }> {
  try {
    const response = await fetch(`${API_URL}/sampling/local/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    const data: LocalExperiencesStatusResponse = await response.json();
    console.log("[Local Experiences] Poll status:", data.status);
    return data;
  } catch (e) {
    console.error("[Local Experiences] Poll failed:", e);
    return { error: `Failed to poll local experiences status: ${e}` };
  }
}

// ─── Database Persistence Actions ───

/**
 * Save (upsert) a sampling preview result to the database.
 */
export async function saveSamplingResult(
  hobbySlug: string,
  result: SamplingPreviewResult
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("sampling_results")
    .upsert(
      {
        user_id: user.id,
        hobby_slug: hobbySlug,
        result: result as unknown as Json,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_slug" }
    );

  if (error) return { error: error.message };
  return {};
}

/**
 * Get a cached sampling preview result from the database.
 */
export async function getSamplingResult(
  hobbySlug: string
): Promise<{ data?: SamplingPreviewResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("sampling_results")
    .select("result")
    .eq("user_id", user.id)
    .eq("hobby_slug", hobbySlug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return {}; // No rows found
    return { error: error.message };
  }

  return { data: data.result as unknown as SamplingPreviewResult };
}

/**
 * Save (upsert) a local experience result to the database.
 */
export async function saveLocalExperienceResult(
  hobbySlug: string,
  location: string,
  result: LocalExperiencesResult
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("local_experience_results")
    .upsert(
      {
        user_id: user.id,
        hobby_slug: hobbySlug,
        location,
        result: result as unknown as Json,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_slug,location" }
    );

  if (error) return { error: error.message };
  return {};
}

/**
 * Get a cached local experience result from the database.
 */
export async function getLocalExperienceResult(
  hobbySlug: string,
  location: string
): Promise<{ data?: LocalExperiencesResult; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("local_experience_results")
    .select("result")
    .eq("user_id", user.id)
    .eq("hobby_slug", hobbySlug)
    .eq("location", location)
    .single();

  if (error) {
    if (error.code === "PGRST116") return {}; // No rows found
    return { error: error.message };
  }

  return { data: data.result as unknown as LocalExperiencesResult };
}

// ─── Complete Sampling Action ───

export async function completeSampling(hobbySlug: string) {
  if (!hobbySlug || hobbySlug.length > 50 || !SLUG_RE.test(hobbySlug))
    return { error: "Invalid hobby slug." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Find the hobby by slug
  const { data: hobby, error: hobbyError } = await supabase
    .from("hobbies")
    .select("id")
    .eq("slug", hobbySlug)
    .single();

  if (hobbyError || !hobby) return { error: "Hobby not found" };

  // Upsert into user_hobbies with "active" status
  const { data, error } = await supabase
    .from("user_hobbies")
    .upsert(
      {
        user_id: user.id,
        hobby_id: hobby.id,
        status: "active" as const,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,hobby_id" },
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}
