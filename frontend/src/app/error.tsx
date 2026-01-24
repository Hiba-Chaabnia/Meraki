"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="!text-2xl mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--secondary)] hover:shadow-lg transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
