"use server";

import { requireAuth } from "@/lib/supabase/requireAuth";
import { API_URL } from "@/lib/config";

export interface DiscoveryJobResponse {
  job_id: string;
}

export interface DiscoveryStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  result: {
    matches: Array<{
      hobby_slug: string;
      match_percentage: number;
      match_tags: string[];
      reasoning: string;
    }>;
    encouragement?: string;
  } | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Trigger discovery by fetching all quiz responses and sending to the FastAPI backend.
 */
export async function triggerDiscovery(): Promise<{
  job_id?: string;
  error?: string;
}> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data: responses, error: fetchError } = await supabase
    .from("quiz_responses")
    .select("question_id, answer")
    .eq("user_id", user.id);

  if (fetchError) return { error: fetchError.message };

  const quizData: Record<string, string> = {};
  responses?.forEach((r) => {
    const answer = Array.isArray(r.answer)
      ? r.answer.join(", ")
      : String(r.answer ?? "");
    quizData[`q${r.question_id}`] = answer;
  });

  try {
    const response = await fetch(`${API_URL}/discovery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, ...quizData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    const data: DiscoveryJobResponse = await response.json();
    return { job_id: data.job_id };
  } catch (e) {
    console.error("[Discovery] API connection failed:", e);
    return { error: `Failed to connect to discovery API: ${e}` };
  }
}

/**
 * Poll the discovery job status.
 */
export async function pollDiscoveryStatus(
  jobId: string
): Promise<DiscoveryStatusResponse | { error: string }> {
  try {
    const response = await fetch(`${API_URL}/discovery/${jobId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API error: ${response.status} - ${errorText}` };
    }

    return await response.json() as DiscoveryStatusResponse;
  } catch (e) {
    console.error("[Discovery] Poll failed:", e);
    return { error: `Failed to poll discovery status: ${e}` };
  }
}
