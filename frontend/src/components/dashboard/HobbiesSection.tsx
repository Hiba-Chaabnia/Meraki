"use client";

import { Plus } from "lucide-react";
import { HobbyCard } from "./HobbyCard";
import type { ActiveHobby, Challenge } from "@/lib/dashboardData";
import { THEME_PRIMARY, THEME_SECONDARY } from "@/lib/sectionTheme";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface HobbiesSectionProps {
  hobbies: ActiveHobby[];
  challenges: Challenge[];
  onAddHobby: () => void;
  onStatusChange?: () => void;
  onLogHobby?: (slug: string) => void;
}

export function HobbiesSection({ hobbies, challenges, onAddHobby, onStatusChange, onLogHobby }: HobbiesSectionProps) {
  return (
    <Card radius="3xl" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl text-[var(--foreground)]">My Hobbies</h3>
        <Button
          onClick={onAddHobby}
          title="Add a hobby"
          variant="outline"
          size="md"
          shape="pill"
          iconOnly
          outlineColor="#d1d5db"
          outlineHoverColor="#6b7280"
          className="border-dashed"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {hobbies.length > 0 ? (
        <div className="space-y-3">
          {hobbies.map((h, index) => {
            const activeChallengeCount = challenges.filter(
              (c) => c.hobbySlug === h.slug && (c.status === "active" || c.status === "upcoming")
            ).length;
            const activeChallenge = challenges.find(
              (c) => c.hobbySlug === h.slug && c.status === "active"
            ) ?? null;
            const theme = index % 2 === 0 ? THEME_PRIMARY : THEME_SECONDARY;
            return (
              <HobbyCard
                key={h.slug}
                hobby={h}
                activeChallengeCount={activeChallengeCount}
                activeChallenge={activeChallenge}
                onStatusChange={onStatusChange}
                onLog={() => onLogHobby?.(h.slug)}
                theme={theme}
                compact
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No hobbies yet."
          description="Add your first hobby to get started!"
          bordered
        />
      )}
    </Card>
  );
}
