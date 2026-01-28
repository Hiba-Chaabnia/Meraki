import { createClient } from "./server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type AuthSuccess = { supabase: SupabaseClient; user: User; error?: never };
export type AuthFailure = { supabase?: never; user?: never; error: string };
export type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), 5000)
    );
    const {
      data: { user },
    } = await Promise.race([supabase.auth.getUser(), timeout]);

    if (!user) return { error: "Not authenticated" };
    return { supabase, user };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "Auth timeout";
    console.error("requireAuth failed:", err);
    return { error: isTimeout ? "Auth check timed out" : "Not authenticated" };
  }
}
