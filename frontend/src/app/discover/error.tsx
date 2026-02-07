"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DiscoverError({
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
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 text-center">
      <h2 className="!text-2xl mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-sm mb-6">
        We couldn&apos;t load this page. Please try again.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--secondary)] hover:shadow-lg transition-all cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/discover"
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Back to Discover
        </Link>
      </div>
    </div>
  );
}
