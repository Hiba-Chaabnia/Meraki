import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The one place that decides what to call someone.
 *
 * `profiles.full_name` is the answer whenever it is set, but it starts empty for
 * an OAuth sign-up: `handle_new_user` reads `raw_user_meta_data->>'full_name'`,
 * and Google returns the name under `name`. So the auth metadata is checked
 * before falling back to the email — otherwise the header and the greeting
 * disagree about who you are, which is what they used to do.
 *
 * The email local-part is a last resort, not a name. It is why the greeting
 * truncates: "hiba.chaabnia.pro" is a realistic value.
 */
export function displayName(user: User | null, profile: Profile | null): string {
  const meta = user?.user_metadata;

  return (
    profile?.full_name?.trim() ||
    (typeof meta?.full_name === "string" ? meta.full_name.trim() : "") ||
    (typeof meta?.name === "string" ? meta.name.trim() : "") ||
    user?.email?.split("@")[0] ||
    ""
  );
}

/** First word of {@link displayName}, for the greeting's "Good to see you, X". */
export function firstName(
  user: User | null,
  profile: Profile | null,
  fallback = "there",
): string {
  return displayName(user, profile).split(" ")[0] || fallback;
}
