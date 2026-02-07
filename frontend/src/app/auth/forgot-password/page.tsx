"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);
      const result = await forgotPassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
      setLoading(false);
    },
    [],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[450px]"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          {/* Back link */}
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Sign In
          </Link>

          {!sent ? (
            <div className="space-y-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[var(--secondary-light)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[var(--secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>

              <div className="space-y-1">
                <h1 className="!text-2xl font-serif font-bold text-gray-900">
                  Forgot Your Password?
                </h1>
                <p className="text-sm text-gray-500">
                  No worries! Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
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
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h1 className="!text-2xl font-serif font-bold text-gray-900">
                  Check Your Inbox
                </h1>
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
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
