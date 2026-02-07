"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signUp(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!fullName) return { error: "Full name is required." };
  if (fullName.length > 100) return { error: "Full name must be 100 characters or fewer." };
  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email address is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/discover");
}

export async function signIn(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email address is required." };
  if (!password) return { error: "Password is required." };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function forgotPassword(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";

  if (!email || !EMAIL_RE.test(email)) return { error: "A valid email address is required." };

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?type=recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const password = (formData.get("password") as string | null) ?? "";

  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/login");
}
