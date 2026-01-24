"use client";

import Link from "next/link";

interface NoMatchesStateProps {
  quizPath?: string;
}

export function NoMatchesState({ quizPath = "/discover/quiz" }: NoMatchesStateProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        <span className="text-5xl block">&#x1F50D;</span>
        <h1 className="!text-2xl md:!text-3xl">No Matches Yet</h1>
        <p className="text-gray-500">
          Take our quiz to discover hobbies that match your personality!
        </p>
        <Link
          href={quizPath}
          className="inline-block px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
          style={{ backgroundColor: "var(--lavender)" }}
        >
          Take the Quiz
        </Link>
      </div>
    </div>
  );
}
