"use client";

import { Modal } from "@/components/ui/Modal";
import { RoadmapDetail } from "./RoadmapDetail";
import type { Roadmap } from "@/lib/dashboardData";

export interface RoadmapModalProps {
  /** null closes it; the value is held through the exit animation. */
  roadmap: Roadmap | null;
  onClose: () => void;
  advancing?: boolean;
  error?: string | null;
  onAdvance: () => void;
  onToggleGoal?: (userRoadmapId: string, goalKey: string) => void;
}

/**
 * The full roadmap, opened in place from the hobby page.
 *
 * Replaces `/dashboard/roadmap/[slug]`. That route had exactly one link into it
 * and belonged to exactly one hobby, so being a page bought a navigation, a
 * second header and a back link — the same trade `/dashboard/challenges/[id]`
 * lost when it became `ChallengeModal`.
 *
 * `scrollable`, because a roadmap is as long as its phase count.
 */
export function RoadmapModal({
  roadmap,
  onClose,
  advancing = false,
  error,
  onAdvance,
  onToggleGoal,
}: RoadmapModalProps) {
  return (
    <Modal isOpen={roadmap !== null} onClose={onClose} maxWidth="max-w-2xl" scrollable>
      {roadmap && (
        <RoadmapDetail
          roadmap={roadmap}
          advancing={advancing}
          error={error}
          onAdvance={onAdvance}
          onToggleGoal={onToggleGoal}
        />
      )}
    </Modal>
  );
}
