"use client";

import { Spinner } from "@/components/ui/Spinner";

export function ResultsLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="md" variant="default" className="mx-auto" />
        <p className="text-gray-400 text-sm">Loading your matches...</p>
      </div>
    </div>
  );
}
