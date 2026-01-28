"use client";

import { useState } from "react";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import type { ActiveHobby, Challenge, Roadmap } from "@/lib/dashboardData";
import type { NudgeData } from "@/app/actions/nudges";

/* ─── Mock data ─── */

const mockHobby: ActiveHobby = {
  userHobbyId: "uhobby-1",
  slug: "watercolor-painting",
  name: "Watercolor Painting",
  color: "#E87DA5",
  lightColor: "#fce4ef",
  status: "active",
  currentStreak: 5,
  totalSessions: 12,
  daysSinceStart: 30,
  lastSessionDaysAgo: 1,
};

const mockChallenge: Challenge = {
  id: "challenge-1",
  hobbySlug: "watercolor-painting",
  hobbyName: "Watercolor Painting",
  hobbyColor: "#E87DA5",
  title: "Paint a 10-minute colour study",
  description:
    "Choose three colours you've never combined before and fill a small sheet with loose, expressive washes.",
  whyThisChallenge: "Builds colour intuition and loosens brushwork.",
  skills: ["colour mixing", "wet-on-wet", "speed painting"],
  difficulty: "easy",
  estimatedTime: "10 min",
  status: "active",
  startedDate: "2026-02-15",
  completedDate: null,
  tips: ["Work fast", "Don't overthink"],
  whatYoullLearn: ["Colour relationships", "Brush confidence"],
};

const mockNudge: NudgeData = {
  message: "You haven't painted in 3 days — your streak is at risk!",
  suggested_action: "Even 10 minutes of quick sketching counts.",
  action_data: "/dashboard/sessions/new",
};

const mockRoadmap: Roadmap = {
  id: "roadmap-1",
  hobbySlug: "watercolor-painting",
  hobbyName: "Watercolor Painting",
  hobbyColor: "#E87DA5",
  title: "Watercolor Mastery Path",
  description: "A structured journey from beginner to confident painter.",
  phases: [
    {
      phase_number: 1,
      title: "Foundations",
      description: "Learn brush control, basic washes, and colour mixing.",
      goals: ["Complete 5 wash exercises"],
      suggested_activities: ["Daily 15-min warm-up"],
      time_per_week: "2–3 hrs",
    },
    {
      phase_number: 2,
      title: "Building Confidence",
      description: "Paint simple subjects from life with loose technique.",
      goals: ["Finish 3 still-life studies"],
      suggested_activities: ["Paint fruits or flowers"],
      time_per_week: "3–4 hrs",
    },
  ],
  currentPhase: 0,
  totalPhases: 2,
  userRoadmapId: "user-roadmap-1",
};

/* ─── Individual scenario wrappers ─── */

function ScenarioShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-xs font-mono font-semibold uppercase tracking-widest text-gray-400 px-1">
        {label}
      </span>
      {children}
    </section>
  );
}

function State1_NoHobbies() {
  return (
    <TodaysFocus
      hobbies={[]}
      activeChallenges={[]}
      nudge={null}
      roadmap={null}
      onGenerateChallenge={() => {}}
      generatingChallenge={false}
      onDismissNudge={() => {}}
    />
  );
}

function State2_Nudge() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed)
    return (
      <p className="text-sm text-gray-400 italic px-1">Nudge dismissed — reload to reset.</p>
    );
  return (
    <TodaysFocus
      hobbies={[mockHobby]}
      activeChallenges={[]}
      nudge={mockNudge}
      roadmap={null}
      onGenerateChallenge={() => {}}
      generatingChallenge={false}
      onDismissNudge={() => setDismissed(true)}
    />
  );
}

function State3_ActiveChallenge() {
  return (
    <TodaysFocus
      hobbies={[mockHobby]}
      activeChallenges={[mockChallenge]}
      nudge={null}
      roadmap={null}
      onGenerateChallenge={() => {}}
      generatingChallenge={false}
      onDismissNudge={() => {}}
    />
  );
}

function State4_Roadmap() {
  return (
    <TodaysFocus
      hobbies={[mockHobby]}
      activeChallenges={[]}
      nudge={null}
      roadmap={mockRoadmap}
      onGenerateChallenge={() => {}}
      generatingChallenge={false}
      onDismissNudge={() => {}}
    />
  );
}

function State5_GenerateChallenge() {
  const [generating, setGenerating] = useState(false);

  function handleGenerate() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  }

  return (
    <TodaysFocus
      hobbies={[mockHobby]}
      activeChallenges={[]}
      nudge={null}
      roadmap={null}
      onGenerateChallenge={handleGenerate}
      generatingChallenge={generating}
      onDismissNudge={() => {}}
    />
  );
}

/* ─── Page ─── */

export default function TodaysFocusDevPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-xl mx-auto flex flex-col gap-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">TodaysFocus — dev preview</h1>
          <p className="text-sm text-gray-500">All 5 priority states rendered with mock data.</p>
        </header>

        <ScenarioShell label="State 1 — no hobbies">
          <State1_NoHobbies />
        </ScenarioShell>

        <ScenarioShell label="State 2 — motivation nudge (dismissable)">
          <State2_Nudge />
        </ScenarioShell>

        <ScenarioShell label="State 3 — active challenge">
          <State3_ActiveChallenge />
        </ScenarioShell>

        <ScenarioShell label="State 4 — roadmap phase">
          <State4_Roadmap />
        </ScenarioShell>

        <ScenarioShell label="State 5 — generate challenge (interactive)">
          <State5_GenerateChallenge />
        </ScenarioShell>
      </div>
    </div>
  );
}
