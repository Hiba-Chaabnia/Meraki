"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startHobby } from "@/app/actions/hobbies";

interface UseCommitResult {
  handleCommit: () => Promise<void>;
  committing: boolean;
  commitError: string | null;
}

/**
 * Start a hobby, from any of the four sampling surfaces.
 *
 * One destination for all of them: the hobby's own page. Watch used to commit
 * and stay put behind a success screen telling you to go to the dashboard,
 * while Micro and Local pushed straight through — the same decision cost two
 * extra clicks depending on which pathway you happened to open.
 *
 * Committing does not start a roadmap. The hobby page opens with the build
 * offered as a button, which is the only thing that starts one.
 */
export function useCommit(hobbySlug: string): UseCommitResult {
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const router = useRouter();

  const handleCommit = async () => {
    if (committing) return;
    setCommitting(true);
    setCommitError(null);

    const result = await startHobby(hobbySlug);

    if (result.error) {
      console.error("[useCommit] startHobby failed:", result.error);
      setCommitError(result.error);
      setCommitting(false);
      return;
    }

    /* Left true through the navigation: flipping it back would un-disable the
       button for the frame before the route changes. */
    router.push(`/dashboard/hobby/${hobbySlug}`);
  };

  return { handleCommit, committing, commitError };
}
