"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RoadmapSection } from "@/components/dashboard/RoadmapSection";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import type { ActiveHobby, Roadmap, ActivityItem } from "@/lib/dashboardData";

/* ─── Mock hobbies ─── */

const hobbyPainting: ActiveHobby = {
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

const hobbyGuitar: ActiveHobby = {
  userHobbyId: "uhobby-2",
  slug: "guitar",
  name: "Guitar",
  color: "#FF9149",
  lightColor: "#ffeadb",
  status: "active",
  currentStreak: 2,
  totalSessions: 7,
  daysSinceStart: 18,
  lastSessionDaysAgo: 3,
};

/* ─── Mock roadmaps ─── */

const roadmapPainting: Roadmap = {
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
      description: "Learn brush control, basic washes, and colour mixing. This phase sets the groundwork for everything that follows.",
      goals: ["Complete 5 wash exercises"],
      suggested_activities: ["Daily 15-min warm-up"],
      time_per_week: "2–3 hrs",
    },
    {
      phase_number: 2,
      title: "Building Confidence",
      description: "Paint simple subjects from life using loose, expressive technique.",
      goals: ["Finish 3 still-life studies"],
      suggested_activities: ["Paint fruits or flowers"],
      time_per_week: "3–4 hrs",
    },
    {
      phase_number: 3,
      title: "Personal Style",
      description: "Develop a recognisable visual voice through experimentation.",
      goals: ["Complete a personal series of 5 paintings"],
      suggested_activities: ["Mood boards, palette exploration"],
      time_per_week: "4–5 hrs",
    },
  ],
  currentPhase: 1,
  totalPhases: 3,
  userRoadmapId: "user-roadmap-1",
};

const roadmapGuitar: Roadmap = {
  id: "roadmap-2",
  hobbySlug: "guitar",
  hobbyName: "Guitar",
  hobbyColor: "#FF9149",
  title: "Guitar Journey",
  description: "From open chords to fluid lead playing.",
  phases: [
    {
      phase_number: 1,
      title: "Open Chords & Strumming",
      description: "Build finger strength and learn the 8 essential open chords.",
      goals: ["Play 3 full songs"],
      suggested_activities: ["Chord transitions drill"],
      time_per_week: "3 hrs",
    },
    {
      phase_number: 2,
      title: "Barre Chords & Rhythm",
      description: "Master barre chord shapes and develop a solid internal pulse.",
      goals: ["Play barre chords cleanly across all positions"],
      suggested_activities: ["Metronome practice"],
      time_per_week: "3–4 hrs",
    },
  ],
  currentPhase: 0,
  totalPhases: 2,
  userRoadmapId: "user-roadmap-2",
};

/* ─── Mock activity items ─── */

const activityItems: ActivityItem[] = [
  {
    id: "act-1",
    type: "session",
    title: "Watercolor Painting",
    subtitle: "Practiced wet-on-wet washes for 25 min",
    date: "2026-02-15",
    color: "#E87DA5",
    icon: "😍",
    href: "/dashboard/sessions/act-1",
  },
  {
    id: "act-2",
    type: "challenge",
    title: "Paint a 10-minute colour study",
    subtitle: "Watercolor Painting",
    date: "2026-02-13",
    color: "#E87DA5",
    icon: "✔️",
    href: "/dashboard/challenges/act-2",
  },
  {
    id: "act-3",
    type: "session",
    title: "Guitar",
    subtitle: "30 min — barre chord transitions",
    date: "2026-02-12",
    color: "#FF9149",
    icon: "😊",
    href: "/dashboard/sessions/act-3",
  },
];

/* ─── Helper ─── */

function ScenarioShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="text-xs font-mono font-semibold uppercase tracking-widest text-gray-400 px-1">
        {label}
      </span>
      {children}
    </section>
  );
}

/* ─── RoadmapSection states ─── */

function Roadmap_NoHobbies() {
  return <RoadmapSection hobbies={[]} roadmaps={[]} />;
}

function Roadmap_OneHobbyNoRoadmap() {
  return <RoadmapSection hobbies={[hobbyPainting]} roadmaps={[]} />;
}

function Roadmap_OneHobbyWithRoadmap() {
  return <RoadmapSection hobbies={[hobbyPainting]} roadmaps={[roadmapPainting]} />;
}

function Roadmap_MultipleHobbies() {
  return (
    <RoadmapSection
      hobbies={[hobbyPainting, hobbyGuitar]}
      roadmaps={[roadmapPainting, roadmapGuitar]}
    />
  );
}

function Roadmap_MultipleHobbiesMixedRoadmaps() {
  // Guitar has a roadmap, Painting doesn't
  return (
    <RoadmapSection
      hobbies={[hobbyPainting, hobbyGuitar]}
      roadmaps={[roadmapGuitar]}
    />
  );
}

/* ─── ActivityTimeline states ─── */

function Activity_Empty() {
  return <ActivityTimeline items={[]} />;
}

function Activity_Sessions() {
  return <ActivityTimeline items={activityItems} />;
}

/* ─── Dashboard layout preview ─── */

function DashboardLayout_Preview() {
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([hobbyPainting, hobbyGuitar]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([roadmapPainting, roadmapGuitar]);
  const [items, setItems] = useState<ActivityItem[]>(activityItems);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setHobbies([hobbyPainting, hobbyGuitar]); setRoadmaps([roadmapPainting, roadmapGuitar]); setItems(activityItems); }}
          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
        >
          Full data
        </button>
        <button
          onClick={() => { setHobbies([]); setRoadmaps([]); setItems([]); }}
          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
        >
          Empty state
        </button>
        <button
          onClick={() => { setHobbies([hobbyPainting]); setRoadmaps([]); setItems(activityItems.slice(0, 1)); }}
          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-medium"
        >
          1 hobby, no roadmap
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RoadmapSection hobbies={hobbies} roadmaps={roadmaps} />

        <section>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-2 border-gray-200 rounded-xl p-4 h-full"
          >
            <h2 className="font-serif text-lg font-semibold text-gray-800 mb-4">
              Recent Activity
            </h2>
            <ActivityTimeline items={items} />
          </motion.div>
        </section>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function RoadmapActivityDevPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-14">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Roadmap & Recent Activity — dev preview</h1>
          <p className="text-sm text-gray-500">Individual component states + live dashboard layout.</p>
        </header>

        {/* ── Dashboard layout (interactive) ── */}
        <ScenarioShell label="Dashboard layout — interactive (toggle data with buttons above)">
          <DashboardLayout_Preview />
        </ScenarioShell>

        <hr className="border-gray-200" />

        {/* ── RoadmapSection states ── */}
        <div className="flex flex-col gap-10">
          <h2 className="text-base font-semibold text-gray-700 -mb-4">RoadmapSection states</h2>

          <ScenarioShell label="No hobbies">
            <div className="max-w-sm">
              <Roadmap_NoHobbies />
            </div>
          </ScenarioShell>

          <ScenarioShell label="1 hobby — no roadmap generated yet">
            <div className="max-w-sm">
              <Roadmap_OneHobbyNoRoadmap />
            </div>
          </ScenarioShell>

          <ScenarioShell label="1 hobby — with roadmap (phase 2 of 3)">
            <div className="max-w-sm">
              <Roadmap_OneHobbyWithRoadmap />
            </div>
          </ScenarioShell>

          <ScenarioShell label="2 hobbies — both with roadmaps (nav arrows visible)">
            <div className="max-w-sm">
              <Roadmap_MultipleHobbies />
            </div>
          </ScenarioShell>

          <ScenarioShell label="2 hobbies — first has no roadmap, second does">
            <div className="max-w-sm">
              <Roadmap_MultipleHobbiesMixedRoadmaps />
            </div>
          </ScenarioShell>
        </div>

        <hr className="border-gray-200" />

        {/* ── ActivityTimeline states ── */}
        <div className="flex flex-col gap-10">
          <h2 className="text-base font-semibold text-gray-700 -mb-4">ActivityTimeline states</h2>

          <ScenarioShell label="Empty — no activity yet">
            <Activity_Empty />
          </ScenarioShell>

          <ScenarioShell label="Mixed sessions & completed challenges">
            <Activity_Sessions />
          </ScenarioShell>
        </div>
      </div>
    </div>
  );
}
