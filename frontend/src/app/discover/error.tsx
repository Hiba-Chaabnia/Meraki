"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";

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
    // This boundary replaces the whole page, so it owns the background —
    // `body` has no background rule, and without this it renders on white.
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 py-12">
      <ErrorState
        message="We couldn't load this page. Please try again."
        actions={
          <>
            <Button onClick={reset} variant="secondary">
              Try again
            </Button>
            <Button href="/discover" variant="ghost">
              Back to discover
            </Button>
          </>
        }
      />
    </div>
  );
}
