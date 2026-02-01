"use client";

import React from "react";
import { createClient } from "@/lib/supabase/client";
import GoogleSvg from "./GoogleSvg";
import { Button } from "@/components/ui/Button";

export default function OAuthSection() {
  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--background)] px-3 text-gray-400">
            or continue with
          </span>
        </div>
      </div>

      {/* Google */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        variant="outline"
        fullWidth
        outlineColor="#d1d5db"
        outlineHoverColor="#9ca3af"
        className="gap-3 bg-white hover:bg-gray-50 text-gray-700"
      >
        {GoogleSvg}
        Google
      </Button>
    </>
  );
}
