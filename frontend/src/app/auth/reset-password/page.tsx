"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { passwordIsValid } from "@/lib/utils/password";
import { resetPassword } from "../actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const formValid =
    passwordIsValid(password) && password === confirm && !mismatch;

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);
      const result = await resetPassword(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
      }
    },
    [],
  );

  // Auto-redirect after success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => router.push("/auth/login"), 3000);
    return () => clearTimeout(timer);
  }, [success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[450px]"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          {!success ? (
            <div className="space-y-6">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[var(--secondary-light)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-[var(--secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h1 className="!text-2xl font-serif font-bold text-gray-900">
                  Set New Password
                </h1>
                <p className="text-sm text-gray-500">
                  Create a strong password for your account
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <form action={handleSubmit} className="space-y-4">
                <PasswordInput
                  label="New Password"
                  showLabel
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
                <PasswordRequirements password={password} />

                <PasswordInput
                  label="Confirm Password"
                  showLabel
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                />
                {mismatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}

                <button
                  type="submit"
                  disabled={!formValid || loading}
                  className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--secondary)] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {loading ? "Resetting..." : "Reset Password"}
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
                  Password Reset!
                </h1>
                <p className="text-sm text-gray-500">
                  Your password has been updated. Redirecting to sign in...
                </p>
              </div>

              <Link
                href="/auth/login"
                className="inline-block text-sm text-[var(--secondary)] font-semibold hover:underline"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
