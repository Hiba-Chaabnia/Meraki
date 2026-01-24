"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChallengeCard } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getUserChallenges } from "@/app/actions/challenges";
import { toChallenge } from "@/lib/transformData";
import type { ChallengeStatus, Challenge } from "@/lib/dashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const tabs: { key: ChallengeStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

export default function ChallengesPage() {
  const [filter, setFilter] = useState<ChallengeStatus | "all">("all");
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserChallenges();
        if (res.data) setAllChallenges(res.data.map(toChallenge));
      } catch (e) { console.error("Failed to load challenges:", e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <PageSkeleton />;

  const challenges = filter === "all" ? allChallenges : allChallenges.filter((c) => c.status === filter);
  const activeCount = allChallenges.filter((c) => c.status === "active").length;
  const completedCount = allChallenges.filter((c) => c.status === "completed").length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="!text-2xl md:!text-3xl mb-1">Challenges</h1>
        <p className="text-gray-500 text-sm">
          {activeCount} active &middot; {completedCount} completed
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              filter === tab.key ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {challenges.map((c) => (
          <motion.div key={c.id} variants={fadeUp}>
            <ChallengeCard challenge={c} />
          </motion.div>
        ))}
      </div>

      {challenges.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-16">
          <p className="text-gray-400 text-sm">
            {allChallenges.length === 0 ? "No challenges yet. They will appear as you progress!" : "No challenges in this category."}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
