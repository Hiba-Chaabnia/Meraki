"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { resetPassword } from "../actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (formData: FormData) => {
    const result = await resetPassword(formData);
    return result?.error ?? null;
  }, []);

  // Auto-redirect after success
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push("/auth/login"), 3000);
    return () => clearTimeout(timer);
  }, [done, router]);

  return (
    <ResetPasswordForm
      onSubmit={handleSubmit}
      loginHref="/auth/login"
      onSuccess={() => setDone(true)}
    />
  );
}
