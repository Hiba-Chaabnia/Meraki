"use client";

import { useState, useCallback } from "react";
import OAuthSection from "@/components/auth/OAuthSection";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { signUp } from "../actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (formData: FormData) => {
    setError(null);
    setLoading(true);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }, []);

  return (
    <SignUpForm
      onSubmit={handleSubmit}
      error={error}
      loading={loading}
      loginHref="/auth/login"
      oauth={<OAuthSection />}
    />
  );
}
