"use client";

import { useCallback } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const handleSubmit = useCallback(async (formData: FormData) => {
    const result = await forgotPassword(formData);
    return result?.error ?? null;
  }, []);

  return <ForgotPasswordForm onSubmit={handleSubmit} loginHref="/auth/login" />;
}
