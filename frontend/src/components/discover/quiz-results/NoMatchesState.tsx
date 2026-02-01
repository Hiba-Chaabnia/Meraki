"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

interface NoMatchesStateProps {
  quizPath?: string;
}

export function NoMatchesState({ quizPath = "/discover/quiz" }: NoMatchesStateProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <EmptyState
          icon={<span className="text-5xl block">&#x1F50D;</span>}
          title="No Matches Yet"
          description="Take our quiz to discover hobbies that match your personality!"
          action={
            <Button
              href={quizPath}
              variant="primary"
              size="md"
              style={{ backgroundColor: "var(--lavender)" }}
            >
              Take the Quiz
            </Button>
          }
        />
      </div>
    </div>
  );
}
