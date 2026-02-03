import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Backfill the avatar from the OAuth provider's profile photo on
      // first login, if we don't already have one on file.
      const providerAvatar =
        (user!.user_metadata?.avatar_url as string | undefined) ??
        (user!.user_metadata?.picture as string | undefined);

      if (providerAvatar) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user!.id)
          .single();

        if (profile && !profile.avatar_url) {
          await supabase
            .from("profiles")
            .update({ avatar_url: providerAvatar })
            .eq("id", user!.id);
        }
      }

      // Check if the user has picked any hobbies yet.
      // New users (or those who haven't completed onboarding) won't have any,
      // so send them to discover. Returning users go to the dashboard.
      const { data: hobbies } = await supabase
        .from("user_hobbies")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);

      if (hobbies && hobbies.length > 0) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
      return NextResponse.redirect(`${origin}/discover`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
