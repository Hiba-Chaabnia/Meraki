"use client";

import React from "react";

interface PasswordRequirementsProps {
  password: string;
}

const rules = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
];

export default function PasswordRequirements({
  password,
}: PasswordRequirementsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {rules.map((rule) => {
        const met = password.length > 0 && rule.test(password);
        return (
          <span
            key={rule.label}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              met
                ? "bg-[var(--secondary-lighter)] text-[var(--foreground)] border border-[var(--secondary-light)]"
                : "bg-gray-100 text-gray-400 border border-gray-200"
            }`}
          >
            {met ? (
              <svg className="w-3 h-3 text-[var(--secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="8" />
              </svg>
            )}
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}
