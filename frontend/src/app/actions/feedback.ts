"use server";

import { createClient } from "@/lib/supabase/server";

const API_URL = process.env.CREWAI_API_URL || "http://localhost:8000";

export interface PracticeFeedback {
  observations: string[];
  growth: string[];
  suggestions: string[];
  celebration: string;
}

export interface FeedbackStatusResponse {
  job_id: string;
  status: "pending" | "running" | "completed" | "failed";
  result: PracticeFeedback | null;
  error: string | null;
}

export async function getSessionFeedback(
  sessionId: string
): Promise<{ data?: PracticeFeedback; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ai_feedback")
    .select("observations, growth, suggestions, celebration")
    .eq("session_id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return {}; // No rows
    return { error: error.message };
  }

  return { data: data as PracticeFeedback };
}

export async function triggerPracticeFeedback(
  sessionId: string
): Promise<{ job_id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch session with joins
  const { data: session, error: sessError } = await supabase
    .from("practice_sessions")
    .select("*, user_hobbies!inner(*, hobbies(*))")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (sessError || !session) return { error: "Session not found" };

  const hobby = session.user_hobbies?.hobbies;
  const hobbyName = hobby?.name ?? "Unknown Hobby";

  // Fetch recent sessions for context
  const { data: recentSessions } = await supabase
    .from("practice_sessions")
    .select("duration, mood, notes, session_type, created_at")
    .eq("user_id", user.id)
    .eq("user_hobby_id", session.user_hobby_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentStr = (recentSessions ?? [])
    .map(
      (s) =>
        `${s.session_type} ${s.duration}min, mood: ${s.mood ?? "n/a"}, notes: ${s.notes ?? "none"}`
    )
    .join(" | ");

  // Fetch completed challenges
  const { data: completedCh } = await supabase
    .from("user_challenges")
    .select("challenges(title)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .limit(5);

  const challengeStr = (completedCh ?? [])
    .map((c: any) => c.challenges?.title ?? "")
    .filter(Boolean)
    .join(", ");

  try {
    const response = await fetch(`${API_URL}/practice/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: user.id,
        hobby_name: hobbyName,
        session_type: session.session_type ?? "practice",
        duration: session.duration ?? 0,
        mood: session.mood ?? "",
        notes: session.notes ?? "",
        image_url: session.image_url ?? "",
        recent_sessions: recentStr || "None",
        completed_challenges: challengeStr || "None",
      }),
    });

    if (!response.ok) {
      return { error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return { job_id: data.job_id };
  } catch (e) {
    console.error("[Practice Feedback] API connection failed:", e);
    return { error: `Failed to connect to feedback API: ${e}` };
  }
}

export async function pollPracticeFeedbackStatus(
  jobId: string
): Promise<FeedbackStatusResponse | { error: string }> {
  try {
    const response = await fetch(`${API_URL}/practice/feedback/${jobId}`);
    if (!response.ok) {
      return { error: `API error: ${response.status}` };
    }
    return await response.json();
  } catch (e) {
    return { error: `Failed to poll feedback status: ${e}` };
  }
}
