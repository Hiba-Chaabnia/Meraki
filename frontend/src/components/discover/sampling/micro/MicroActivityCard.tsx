"use client";

import { useState } from "react";
import { useCommit } from "@/hooks/useCommit";
import { SamplingCTA } from "@/components/discover/sampling/SamplingCTA";
import { Button } from "@/components/ui/Button";

interface MicroActivityCardProps {
  instruction: string;
  duration: string;
  whyItWorks: string;
  hobbySlug: string;
  hobbyName: string;
}

export function MicroActivityCard({
  instruction,
  duration,
  whyItWorks,
  hobbySlug,
  hobbyName,
}: MicroActivityCardProps) {
  const [done, setDone] = useState(false);
  const { handleCommit, committing, commitError } = useCommit(hobbySlug);

  return (
    <div className="p-4 md:p-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--secondary)] border border-[var(--secondary-theme-border)] bg-[var(--secondary-theme-bg)] mb-4 rounded-full px-2">
          {duration}
        </div>
        <p className="text-gray-700 text-base leading-relaxed max-w-xl mx-auto">
          {instruction}
        </p>
      </div>

      <div
        className="rounded-xl p-4 mb-8 border"
        style={{ backgroundColor: "var(--secondary-theme-bg)", borderColor: "var(--secondary-theme-border)" }}
      >
        <p className="text-sm font-semibold text-[var(--secondary)] mb-2">
          Why this works
        </p>
        <p className="text-gray-600 text-sm">{whyItWorks}</p>
      </div>

      <div className="text-center">
        {!done ? (
          <Button
            onClick={() => setDone(true)}
            variant="primary"
            size="lg"
            className="hover:shadow-lg"
          >
            Done
          </Button>
        ) : (
          <div className="space-y-3">
            <SamplingCTA
              hobbySlug={hobbySlug}
              hobbyName={hobbyName}
              currentPath="micro"
              onCommit={handleCommit}
              committing={committing}
              commitError={commitError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
