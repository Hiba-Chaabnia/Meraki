"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SessionLoggerModal } from "@/components/dashboard";
import type { SessionFormData } from "@/components/dashboard";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { getSessions, createSession } from "@/app/actions/sessions";
import { getUserHobbies } from "@/app/actions/hobbies";
import { toPracticeSession, toActiveHobby } from "@/lib/transformData";
import { moodEmojis } from "@/lib/dashboardData";
import { Plus, Filter, Image as ImageIcon } from "lucide-react";
import type { PracticeSession, ActiveHobby } from "@/lib/dashboardData";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export default function SessionsPage() {
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [filterHobby, setFilterHobby] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, hobbiesRes] = await Promise.all([getSessions(), getUserHobbies()]);
      if (sessionsRes.data) setAllSessions(sessionsRes.data.map(toPracticeSession));
      if (hobbiesRes.data) setHobbies(hobbiesRes.data.filter((h: any) => h.status === "active" || h.status === "paused").map(toActiveHobby));
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <PageSkeleton />;

  const sessions = filterHobby === "all" ? allSessions : allSessions.filter((s) => s.hobbySlug === filterHobby);

  const handleSaveSession = async (data: SessionFormData) => {
    const hobby = hobbies.find((h) => h.slug === data.hobbySlug);
    if (!hobby) return;
    await createSession({
      userHobbyId: hobby.userHobbyId,
      sessionType: data.type,
      duration: data.duration,
      mood: data.mood,
      notes: data.notes,
    });
    fetchData();
  };

  return (
    <>
      <SessionLoggerModal
        isOpen={loggerOpen}
        onClose={() => setLoggerOpen(false)}
        onSave={handleSaveSession}
        hobbies={hobbies}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between mb-6">
          <div>
            <h1 className="!text-2xl md:!text-3xl mb-1">Practice Sessions</h1>
            <p className="text-gray-500 text-sm">
              {allSessions.length} sessions logged
            </p>
          </div>
          <button
            onClick={() => setLoggerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold bg-[var(--secondary)] hover:shadow-lg transition-all active:scale-[0.97] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setFilterHobby("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterHobby === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {hobbies.map((h) => (
            <button
              key={h.slug}
              onClick={() => setFilterHobby(h.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterHobby === h.slug
                  ? "text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
              style={filterHobby === h.slug ? { backgroundColor: h.color } : undefined}
            >
              {h.name}
            </button>
          ))}
        </motion.div>

        <div className="space-y-3">
          {sessions.map((s) => (
            <motion.div key={s.id} variants={fadeUp}>
              <Link href={`/dashboard/sessions/${s.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ backgroundColor: s.hobbyColor + "20" }}
                    >
                      {moodEmojis[s.mood]?.emoji ?? ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: s.hobbyColor + "20", color: s.hobbyColor }}
                        >
                          {s.hobbyName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(s.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{s.notes}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400">{s.duration} min</span>
                        {s.hasImage && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Photo
                          </span>
                        )}
                        {s.aiFeedback && (
                          <span className="text-xs text-blue-400 font-medium">AI Feedback</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {sessions.length === 0 && (
          <motion.div variants={fadeUp} className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {allSessions.length === 0 ? "No sessions yet. Log your first practice!" : "No sessions found for this filter."}
            </p>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
