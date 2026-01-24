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

      // Check if the user has picked any hobbies yet.
      // New users (or those who haven't completed onboarding) won't have any,
      // so send them to discover. Returning users go to the dashboard.
      const { data: { user } } = await supabase.auth.getUser();
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
