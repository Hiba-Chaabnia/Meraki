"use client";

import { useState } from "react";
import { completeSampling } from "@/app/actions/sampling";

interface UseCommitResult {
  handleCommit: () => Promise<void>;
  committing: boolean;
  committed: boolean;
  commitError: string | null;
}

export function useCommit(hobbySlug: string): UseCommitResult {
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const handleCommit = async () => {
    if (committing) return;
    setCommitting(true);
    setCommitError(null);

    const result = await completeSampling(hobbySlug);

    setCommitting(false);

    if ("error" in result) {
      console.error("[useCommit] completeSampling failed:", result.error);
      setCommitError(result.error);
    } else {
      setCommitted(true);
    }
  };

  return { handleCommit, committing, committed, commitError };
}
