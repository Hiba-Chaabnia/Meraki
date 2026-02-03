import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely. Server-only: never import
 * this from a Client Component or anything bundled for the browser.
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment (not NEXT_PUBLIC_).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
