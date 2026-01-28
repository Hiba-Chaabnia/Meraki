import { createClient } from "./server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function requireAuth(): Promise<
  { supabase: SupabaseClient; user: User } | { error: string }
> {
  const supabase = await createClient();

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Supabase auth timeout (5 s)")), 5000)
    );
    const { data: { user } } = await Promise.race([supabase.auth.getUser(), timeout]);
    if (!user) return { error: "Not authenticated" };
    return { supabase, user };
  } catch (err) {
    // In development, fall back to the cookie-based session so a slow or
    // temporarily unreachable Supabase doesn't force re-authentication on
    // every hot-reload. getSession() decodes the JWT from the cookie
    // locally — no network call.
    if (process.env.NODE_ENV === "development") {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) return { supabase, user: session.user };
    }
    console.error("requireAuth failed:", err);
    return { error: "Not authenticated" };
  }
}
