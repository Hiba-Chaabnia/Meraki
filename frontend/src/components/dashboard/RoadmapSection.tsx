"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ActiveHobby, Roadmap } from "@/lib/dashboardData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface RoadmapSectionProps {
  hobbies: ActiveHobby[];
  roadmaps: Roadmap[];
}

export function RoadmapSection({ hobbies, roadmaps }: RoadmapSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentHobby = hobbies[currentIndex];
  const currentRoadmap = currentHobby
    ? roadmaps.find((r) => r.hobbySlug === currentHobby.slug) ?? null
    : null;

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev - 1 + hobbies.length) % hobbies.length);
  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % hobbies.length);

  const accentColor = "var(--primary)";
  const currentPhase = currentRoadmap?.phases[currentRoadmap.currentPhase] ?? null;
  const nextPhase = currentRoadmap?.phases[currentRoadmap.currentPhase + 1] ?? null;

  return (
    <Card radius="3xl" padding="lg" className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-xl text-[var(--foreground)]">My Roadmap</h3>
        {currentRoadmap && (
          <Link
            href={`/dashboard/roadmap/${currentRoadmap.userRoadmapId}`}
            className="text-sm font-medium hover:underline flex items-center gap-1 transition-colors"
            style={{ color: accentColor }}
          >
            View full <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {hobbies.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-400 mb-3">Add a hobby to create a roadmap.</p>
          <Link href="/discover" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Explore hobbies →
          </Link>
        </div>
      ) : !currentRoadmap ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-gray-500 mb-3">
            No roadmap yet for <span className="font-medium">{currentHobby?.name}</span>.
          </p>
          {currentHobby && (
            <Link
              href={`/dashboard/hobby/${currentHobby.slug}`}
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: accentColor }}
            >
              Generate Roadmap →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative border-l-2 pl-6 ml-2 space-y-6 flex-1" style={{ borderColor: accentColor + "40" }}>
            {/* Current phase */}
            {currentPhase && (
              <div className="relative">
                <div
                  className="absolute -left-[31px] top-1 w-4 h-4 rounded-full ring-4 ring-white"
                  style={{ backgroundColor: accentColor }}
                />
                <p
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: accentColor }}
                >
                  Phase {currentRoadmap.currentPhase + 1}/{currentRoadmap.totalPhases} · In Progress
                </p>
                <h4 className="font-semibold text-gray-900 mb-1">{currentPhase.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2">{currentPhase.description}</p>
              </div>
            )}

            {/* Next phase */}
            {nextPhase && (
              <div className="relative opacity-50">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Phase {currentRoadmap.currentPhase + 2}/{currentRoadmap.totalPhases} · Up Next
                </p>
                <h4 className="font-semibold text-gray-900">{nextPhase.title}</h4>
              </div>
            )}
          </div>

          {/* Hobby navigation */}
          {hobbies.length > 1 && (
            <div className="mt-6 flex gap-2 justify-end">
              <Button
                onClick={handlePrev}
                variant="ghost"
                size="md"
                shape="pill"
                iconOnly
                aria-label="Previous"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="md"
                shape="pill"
                iconOnly
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
