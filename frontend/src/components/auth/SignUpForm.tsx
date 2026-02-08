"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { AuthError } from "@/components/auth/AuthPanel";
import { MailIcon, UserIcon } from "@/components/auth/AuthIcons";
import { AUTH_MEDIA } from "@/components/auth/authMedia";
import { LegalModal } from "@/components/legal/LegalModal";
import { PRIVACY, TERMS } from "@/lib/legal";
import { passwordIsValid } from "@/lib/utils/password";

export interface SignUpFormProps {
  onSubmit: (formData: FormData) => void | Promise<void>;
  error: string | null;
  loading: boolean;
  loginHref: string;
  /** Real `OAuthSection` in the app; a no-op stand-in in the preview. */
  oauth: ReactNode;
  defaultName?: string;
  defaultEmail?: string;
}

export function SignUpForm({
  onSubmit,
  error,
  loading,
  loginHref,
  oauth,
  defaultName,
  defaultEmail,
}: SignUpFormProps) {
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [legalDoc, setLegalDoc] = useState<"terms" | "privacy" | null>(null);

  const formValid = password.length > 0 && passwordIsValid(password) && agreed;

  return (
    <AuthLayout imageSrc={AUTH_MEDIA.src} imageAlt={AUTH_MEDIA.alt}>
      <div className="space-y-6">
        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Create Your Account</h1>
          <p className="text-sm text-gray-500">Join thousands discovering their creative spark</p>
        </div>

        {error && <AuthError message={error} />}

        {/* Form */}
        <form action={onSubmit} className="space-y-4">
          <div>
            <AuthTextField
              icon={UserIcon}
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={defaultName}
              aria-label="Full Name"
              placeholder="Jane Doe"
            />
          </div>

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
              <button type="button" onClick={() => setLegalDoc("terms")} className="underline text-gray-900">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" onClick={() => setLegalDoc("privacy")} className="underline text-gray-900">
                Privacy Policy
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={!formValid || loading}
            className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--primary)] hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {oauth}

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href={loginHref} className="text-[var(--primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <LegalModal doc={TERMS} isOpen={legalDoc === "terms"} onClose={() => setLegalDoc(null)} />
      <LegalModal doc={PRIVACY} isOpen={legalDoc === "privacy"} onClose={() => setLegalDoc(null)} />
    </AuthLayout>
  );
}
