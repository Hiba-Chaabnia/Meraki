"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AuthPanel, AuthPanelIcon, AuthError } from "@/components/auth/AuthPanel";
import { MailIcon, SuccessCheckIcon, BackArrowIcon } from "@/components/auth/AuthIcons";

export interface ForgotPasswordFormProps {
  /** Resolves to an error message, or null on success. */
  onSubmit: (formData: FormData) => Promise<string | null>;
  loginHref: string;
  defaultEmail?: string;
}

export function ForgotPasswordForm({ onSubmit, loginHref, defaultEmail = "" }: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);
      const message = await onSubmit(formData);
      if (message) setError(message);
      else setSent(true);
      setLoading(false);
    },
    [onSubmit],
  );

  return (
    <AuthPanel>
      {/* Back link */}
      <Link
        href={loginHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
      >
        <BackArrowIcon className="w-4 h-4" />
        Back to Sign In
      </Link>

      {!sent ? (
        <div className="space-y-6">
          <AuthPanelIcon icon={MailIcon} />

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900">Forgot Your Password?</h1>
            <p className="text-sm text-gray-500">
              No worries! Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {error && <AuthError message={error} />}

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/40 focus:border-[var(--secondary)] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--secondary)] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      ) : (
        /* Success state */
        <div className="space-y-6 text-center">
          <AuthPanelIcon icon={SuccessCheckIcon} tone="success" />

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900">Check Your Inbox</h1>
            <p className="text-sm text-gray-500">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setSent(false); setLoading(false); }}
            className="text-sm text-[var(--secondary)] hover:underline cursor-pointer"
          >
            Didn&apos;t receive it? Resend
          </button>

          <div>
            <Link href={loginHref} className="text-sm text-gray-500 hover:text-gray-700 underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </AuthPanel>
  );
}
