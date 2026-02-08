"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startHobby } from "@/app/actions/hobbies";

/* Must match `JOB_KEY_PREFIX` in lib/hooks/useRoadmapGeneration — that hook
   resumes any job it finds under this key on mount, which is how the roadmap
   build started here survives the navigation to the hobby page. */
const ROADMAP_JOB_KEY_PREFIX = "roadmap-job-";

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
 * The roadmap job id is parked in sessionStorage under the key
 * `useRoadmapGeneration` resumes from, so the hobby page picks the build up
 * mid-flight and renders its generating state instead of an empty slot.
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

    if (result.roadmapJobId) {
      try {
        sessionStorage.setItem(`${ROADMAP_JOB_KEY_PREFIX}${hobbySlug}`, result.roadmapJobId);
      } catch {
        /* Private mode or quota — the hobby page still offers the manual build. */
      }
    }

    /* Left true through the navigation: flipping it back would un-disable the
       button for the frame before the route changes. */
    router.push(`/dashboard/hobby/${hobbySlug}`);
  };

  return { handleCommit, committing, commitError };
}
