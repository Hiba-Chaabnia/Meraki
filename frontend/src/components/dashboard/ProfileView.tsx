"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { milestoneRules } from "@/lib/milestoneRules";
import type { UserStats, ActiveHobby, Milestone } from "@/lib/dashboardData";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { ArrowLeftIcon, PencilIcon, SettingsIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { PracticeHeatmap } from "./PracticeHeatmap";
import { orderActiveHobbies, type HeatmapDay } from "@/lib/dashboardHome";

const stagger = staggerContainer(0.08);

const HOBBY_COLORS = ["var(--primary)", "var(--secondary)"] as const;

export interface ProfileFields {
  full_name: string;
  bio: string;
  location: string;
}

export interface ProfileViewProps {
  fields: ProfileFields;
  avatarUrl?: string | null;
  /** Rendered as "Joined {joinDate}". */
  joinDate: string;
  stats: UserStats;
  hobbies: ActiveHobby[];
  /** Raw sessions; `PracticeHeatmap` buckets them. Omitted hides the map. */
  heatmap?: HeatmapDay[];
  milestones: Milestone[];
  onSave: (fields: ProfileFields) => void | Promise<void>;
  /**
   * Resolves to an error message, or null on success. Omitted makes the avatar
   * a plain badge with no upload affordance — which is what the preview wants,
   * since there is no storage bucket behind it.
   */
  onAvatarUpload?: (file: File) => Promise<string | null>;
  dashboardHref: string;
  settingsHref: string;
  discoverHref: string;
}

export function ProfileView({
  fields,
  avatarUrl,
  joinDate,
  stats,
  hobbies,
  milestones,
  heatmap,
  onSave,
  onAvatarUpload,
  dashboardHref,
  settingsHref,
  discoverHref,
}: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(fields.full_name);
  const [bio, setBio] = useState(fields.bio);
  const [location, setLocation] = useState(fields.location);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // The app seeds these from a profile that arrives after first paint.
  useEffect(() => {
    setName(fields.full_name);
    setBio(fields.bio);
    setLocation(fields.location);
  }, [fields.full_name, fields.bio, fields.location]);

  /* Same order the dashboard uses, so each hobby keeps the colour it wears on
     its card there. */
  const orderedHobbies = orderActiveHobbies(hobbies);
  const totalSessions = hobbies.reduce((sum, h) => sum + h.totalSessions, 0);

  const earnedMilestones = milestones.filter((m) => m.earned);
  const unearnedMilestones = milestones.filter((m) => !m.earned);
  const initial = (name || "U").charAt(0).toUpperCase();

  const handleSave = async () => {
    await onSave({ full_name: name, bio, location });
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onAvatarUpload) return;

    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarError(await onAvatarUpload(file));
    setAvatarUploading(false);
  };

  const avatarFace = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- user-uploaded external URL, not worth wiring next/image remotePatterns for a single 96px avatar
    <img src={avatarUrl} alt={name || "Profile"} className="w-24 h-24 object-cover" />
  ) : (
    <div className="w-24 h-24 bg-gradient-to-br from-[var(--secondary)] to-[var(--coral)] flex items-center justify-center text-white text-3xl font-bold">
      {initial}
    </div>
  );

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
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Dashboard
        </Link>
        <Link
          href={settingsHref}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <SettingsIcon className="w-4 h-4" />
          Settings
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Avatar + name */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          {onAvatarUpload ? (
            <div className="relative w-24 h-24 mx-auto mb-4">
              <label
                htmlFor="avatar-upload"
                className="group relative block w-24 h-24 rounded-full overflow-hidden cursor-pointer"
                title="Change profile photo"
              >
                {avatarFace}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PencilIcon className="w-5 h-5 text-white" />
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Spinner size="sm" variant="white" />
                  </div>
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">{avatarFace}</div>
          )}
          {avatarError && <p className="text-xs text-red-500 mb-2">{avatarError}</p>}

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
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="text-2xl font-medium text-gray-900 mb-0.5">{name || "Your Name"}</h1>
                {bio && <p className="text-sm text-gray-500 max-w-xs mx-auto mb-2">{bio}</p>}
                <p className="text-xs text-gray-400 mb-3">
                  {location && `${location} · `}Joined {joinDate}
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
            <p className="text-xl font-bold text-gray-800">{stats.totalSessions}</p>
            <p className="text-xs text-gray-400">Sessions</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">{stats.hobbiesExplored}</p>
            <p className="text-xs text-gray-400">Hobbies</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-gray-800">{stats.longestStreak}d</p>
            <p className="text-xs text-gray-400">Best Streak</p>
          </div>
        </motion.div>

        {/* One card, not two. The list and the deleted Progress page's "hobby
            breakdown" both answered "how much of this hobby have I done" — side
            by side they stated the session count twice. The bar is the same
            number the row already carries, drawn. */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="card-heading mb-4">Hobbies</h2>
          {orderedHobbies.length > 0 ? (
            <div className="space-y-4">
              {orderedHobbies.map((h, i) => {
                /* Blue/lime by position in the same order the dashboard uses,
                   so a hobby wears one colour across the app. */
                const color = HOBBY_COLORS[i % 2];
                const pct = totalSessions > 0 ? Math.round((h.totalSessions / totalSessions) * 100) : 0;
                return (
                  <div key={h.slug}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="label truncate">{h.name}</p>
                        <p className="caption">
                          {h.totalSessions} session{h.totalSessions === 1 ? "" : "s"}
                          {totalSessions > 0 && ` (${pct}%)`} &middot; Day {h.daysSinceStart}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {h.status === "active" ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="mt-2 ml-13 h-2 overflow-hidden rounded-full bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" as const }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400 mb-2">No hobbies yet</p>
              <Link href={discoverHref} className="text-sm text-[var(--secondary)] font-medium hover:underline">
                Explore hobbies &rarr;
              </Link>
            </div>
          )}
        </motion.div>

        {/* From the deleted Progress page. Every hobby's sessions in one field —
            an account-level question, and this is the account-level page. */}
        {heatmap && (
          <motion.div variants={fadeUp} className="mb-6">
            <PracticeHeatmap days={heatmap} />
          </motion.div>
        )}

        {/* Milestones showcase */}
        <motion.div variants={fadeUp}>
          <h2 className="card-heading mb-4">Milestones</h2>
          {earnedMilestones.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {earnedMilestones.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                  <span className="text-2xl block mb-1">{milestoneRules.find((r) => r.slug === m.slug)?.icon ?? "🏅"}</span>
                  <p className="text-[11px] font-semibold text-gray-700">{m.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No milestones earned yet. Keep practicing!</p>
          )}

          {/* The half that pulls. It lived only on the deleted Progress page,
              so without it unearned milestones stopped existing in the UI. */}
          {unearnedMilestones.length > 0 && (
            <>
              <p className="mt-6 mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Up next</p>
              <div className="grid grid-cols-4 gap-3">
                {unearnedMilestones.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center opacity-60">
                    <span className="mb-1 block text-2xl grayscale">{milestoneRules.find((r) => r.slug === m.slug)?.icon ?? "🏅"}</span>
                    <p className="text-[11px] font-semibold text-gray-500">{m.title}</p>
                    <p className="caption mt-0.5 text-[10px]">{m.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
