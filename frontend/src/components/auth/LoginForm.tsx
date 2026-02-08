"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthError } from "@/components/auth/AuthPanel";
import { MailIcon } from "@/components/auth/AuthIcons";
import { AUTH_MEDIA } from "@/components/auth/authMedia";

export interface LoginFormProps {
  onSubmit: (formData: FormData) => void | Promise<void>;
  error: string | null;
  loading: boolean;
  forgotHref: string;
  signupHref: string;
  /** Real `OAuthSection` in the app; a no-op stand-in in the preview. */
  oauth: ReactNode;
  defaultEmail?: string;
  defaultPassword?: string;
}

export function LoginForm({
  onSubmit,
  error,
  loading,
  forgotHref,
  signupHref,
  oauth,
  defaultEmail,
  defaultPassword,
}: LoginFormProps) {
  return (
    <AuthLayout imageSrc={AUTH_MEDIA.src} imageAlt={AUTH_MEDIA.alt}>
      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500">Continue your creative journey</p>
        </div>

        {error && <AuthError message={error} />}

        {/* Form */}
        <form action={onSubmit} className="space-y-4">
          <div>
            <AuthTextField
              icon={MailIcon}
              id="email"
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              aria-label="Email"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <PasswordInput
              label="Password"
              id="password"
              name="password"
              required
              defaultValue={defaultPassword}
              placeholder="Your password"
            />
            <div className="flex justify-end mt-1.5">
              <Link href={forgotHref} className="text-xs text-[var(--primary)] hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {oauth}

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href={signupHref} className="text-[var(--primary)] font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
