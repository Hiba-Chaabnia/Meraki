"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";
import { ProfileSkeleton } from "@/components/ui/LoadingSkeleton";
import { updateProfile } from "@/app/actions/profile";
import { getUserStats, getUserMilestones } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { toUserStats, toActiveHobby, toMilestone } from "@/lib/transformData";
import type { UserStats, ActiveHobby, Milestone } from "@/lib/dashboardData";

/* ─── Icons ─── */
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const SettingsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setPronouns(profile.pronouns || "");
    }
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, hobbiesRes, milestonesRes] = await Promise.all([
          getUserStats(),
          getUserHobbies(),
          getUserMilestones(),
        ]);
        if (statsRes.data) setStats(toUserStats(statsRes.data));
        if (hobbiesRes.data)
          setHobbies(
            hobbiesRes.data
              .filter((h: any) => h.status === "active" || h.status === "paused")
              .map(toActiveHobby),
          );
        if (milestonesRes.data) setMilestones(milestonesRes.data.map(toMilestone));
      } catch (e) {
        console.error("Failed to load profile data:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return <ProfileSkeleton />;

  const displayStats = stats ?? {
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    totalHours: 0,
    challengesCompleted: 0,
    hobbiesExplored: 0,
    daysSinceJoining: 0,
  };
  const earnedMilestones = milestones.filter((m) => m.earned);
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";
  const initial = (name || "U").charAt(0).toUpperCase();

  const handleSave = async () => {
    await updateProfile({ full_name: name, bio, location, pronouns });
    await refreshProfile();
    setEditing(false);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-[var(--background)]"
    >
      {/* Top bar */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar + name */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--secondary)] to-[var(--coral)] mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
            {initial}
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 max-w-sm mx-auto"
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-center text-xl font-bold border-b-2 border-[var(--secondary)] bg-transparent outline-none py-1"
                  placeholder="Your name"
                />
                <input
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="w-full text-center text-sm text-gray-500 border-b border-gray-200 bg-transparent outline-none py-1"
                  placeholder="Pronouns"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-center text-sm text-gray-500 border border-gray-200 rounded-xl bg-transparent outline-none p-3 resize-none"
                  rows={2}
                  placeholder="Short bio"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-center text-sm text-gray-500 border-b border-gray-200 bg-transparent outline-none py-1"
                  placeholder="Location"
                />
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={handleSave}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--secondary)] hover:shadow-lg transition-all cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="!text-2xl mb-0.5">{name || "Your Name"}</h1>
                {pronouns && <p className="text-sm text-gray-400 mb-1">{pronouns}</p>}
                {bio && (
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mb-2">{bio}</p>
                )}
                <p className="text-xs text-gray-400 mb-3">
                  {location && `${location} \u00B7 `}Joined {joinDate}
                </p>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--secondary)] font-medium hover:underline cursor-pointer"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">
              {displayStats.totalSessions}
            </p>
            <p className="text-xs text-gray-400">Sessions</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">
              {displayStats.hobbiesExplored}
            </p>
            <p className="text-xs text-gray-400">Hobbies</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">
              {displayStats.longestStreak}d
            </p>
            <p className="text-xs text-gray-400">Best Streak</p>
          </div>
        </motion.div>

        {/* Active hobbies */}
        <motion.div
          variants={fadeUp}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">
            My Hobbies
          </h2>
          {hobbies.length > 0 ? (
            <div className="space-y-3">
              {hobbies.map((h) => (
                <div key={h.slug} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: h.lightColor }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{h.name}</p>
                    <p className="text-xs text-gray-400">
                      {h.totalSessions} sessions &middot; Day {h.daysSinceStart}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      h.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {h.status === "active" ? "Active" : "Paused"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-2">No hobbies yet</p>
              <Link
                href="/discover"
                className="text-sm text-[var(--secondary)] font-medium hover:underline"
              >
                Explore hobbies &rarr;
              </Link>
            </div>
          )}
        </motion.div>

        {/* Milestones showcase */}
        <motion.div variants={fadeUp}>
          <h2 className="!text-base !font-semibold !tracking-normal !text-gray-800 mb-4">
            Milestones
          </h2>
          {earnedMilestones.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {earnedMilestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center"
                >
                  <span className="text-2xl block mb-1">{m.icon}</span>
                  <p className="text-[11px] font-semibold text-gray-700">
                    {m.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No milestones earned yet. Keep practicing!
            </p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
