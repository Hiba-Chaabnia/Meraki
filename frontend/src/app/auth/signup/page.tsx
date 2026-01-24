"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import OAuthSection from "@/components/auth/OAuthSection";
import { passwordIsValid } from "@/lib/utils/password";
import { signUp } from "../actions";

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const formValid = password.length > 0 && passwordIsValid(password) && agreed;

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    },
    [],
  );

  return (
    <AuthLayout imageSrc="https://res.cloudinary.com/dm3csn6xh/video/upload/v1770607520/AI_Guided_Creative_Journey_Animation_jkudij.mp4" imageAlt="Meraki Animation">
      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-1">
          <h1 className="!text-3xl font-serif font-bold text-gray-900">
            Create Your Account
          </h1>
          <p className="text-sm text-gray-500">
            Join thousands discovering their creative spark
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Form */}
        <form action={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                aria-label="Full Name"
                className="w-full p-3 pl-11 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/40 focus:border-[var(--secondary)] transition-colors"
                placeholder="Jane Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                aria-label="Email"
                className="w-full p-3 pl-11 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)]/40 focus:border-[var(--secondary)] transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <PasswordInput
            label="Password"
            id="password"
            name="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
          <PasswordRequirements password={password} />

          {/* Terms */}
          <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-[var(--secondary)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="underline text-gray-900">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline text-gray-900">
                Privacy Policy
              </Link>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!formValid || loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <OAuthSection />

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--primary)] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
