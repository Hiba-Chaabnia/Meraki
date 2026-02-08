"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { AuthPanel, AuthPanelIcon, AuthError } from "@/components/auth/AuthPanel";
import { LockIcon, SuccessCheckIcon } from "@/components/auth/AuthIcons";
import { passwordIsValid } from "@/lib/utils/password";

export interface ResetPasswordFormProps {
  /** Resolves to an error message, or null on success. */
  onSubmit: (formData: FormData) => Promise<string | null>;
  loginHref: string;
  /** Fired once the reset lands — the caller owns the redirect timing. */
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSubmit, loginHref, onSuccess }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const formValid = passwordIsValid(password) && password === confirm && !mismatch;

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      setError(null);
      setLoading(true);
      const message = await onSubmit(formData);
      if (message) {
        setError(message);
        setLoading(false);
      } else {
        setSuccess(true);
      }
    },
    [onSubmit],
  );

  useEffect(() => {
    if (success) onSuccess?.();
  }, [success, onSuccess]);

  return (
    <AuthPanel>
      {!success ? (
        <div className="space-y-6">
          <AuthPanelIcon icon={LockIcon} />

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900">Set New Password</h1>
            <p className="text-sm text-gray-500">Create a strong password for your account</p>
          </div>

          {error && <AuthError message={error} />}

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
            {mismatch && <p className="text-xs text-red-500">Passwords do not match</p>}

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
          <AuthPanelIcon icon={SuccessCheckIcon} tone="success" />

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900">Password Reset!</h1>
            <p className="text-sm text-gray-500">
              Your password has been updated. Redirecting to sign in...
            </p>
          </div>

          <Link
            href={loginHref}
            className="inline-block text-sm text-[var(--secondary)] font-semibold hover:underline"
          >
            Go to Sign In
          </Link>
        </div>
      )}
    </AuthPanel>
  );
}
