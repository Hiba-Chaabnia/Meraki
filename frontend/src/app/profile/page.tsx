"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";
import { ProfileSkeleton } from "@/components/ui/LoadingSkeleton";
import { Spinner } from "@/components/ui/Spinner";
import { updateProfile, uploadAvatar } from "@/app/actions/profile";
import { getUserStats, getUserMilestones } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { toUserStats, toActiveHobbies, toMilestone } from "@/lib/transformData";
import { milestoneRules } from "@/lib/milestoneRules";
import type { UserStats, ActiveHobby, Milestone } from "@/lib/dashboardData";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { ArrowLeftIcon, PencilIcon, SettingsIcon } from "@/components/ui/Icons";

const stagger = staggerContainer(0.08);

export default function ProfilePage() {
  const { profile, refreshProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setBio(profile.bio || "");
      setLocation(profile.location || "");
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
        setHobbies(toActiveHobbies(hobbiesRes.data ?? null));
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
    await updateProfile({ full_name: name, bio, location });
    await refreshProfile();
    setEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadAvatar(formData);

    if (res.error) {
      setAvatarError(res.error);
    } else if (res.url) {
      const updateRes = await updateProfile({ avatar_url: res.url });
      if (updateRes.error) setAvatarError(updateRes.error);
      await refreshProfile();
    }
    setAvatarUploading(false);
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
          <ArrowLeftIcon className="w-4 h-4" />
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
          <div className="relative w-24 h-24 mx-auto mb-4">
            <label
              htmlFor="avatar-upload"
              className="group relative block w-24 h-24 rounded-full overflow-hidden cursor-pointer"
              title="Change profile photo"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded external URL, not worth wiring next/image remotePatterns for a single 96px avatar
                <img
                  src={profile.avatar_url}
                  alt={name || "Profile"}
                  className="w-24 h-24 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--secondary)] to-[var(--coral)] flex items-center justify-center text-white text-3xl font-bold">
                  {initial}
                </div>
              )}
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
          {avatarError && (
            <p className="text-xs text-red-500 mb-2">{avatarError}</p>
          )}

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
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="text-2xl font-medium text-gray-900 mb-0.5">{name || "Your Name"}</h1>
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
          <h2 className="card-heading mb-4">
            Hobbies
          </h2>
          {hobbies.length > 0 ? (
            <div className="space-y-3">
              {hobbies.map((h) => (
                <div key={h.slug} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100"
                  >
                    <div
                      className="w-3 h-3 rounded-full bg-gray-700"
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
          <h2 className="card-heading mb-4">
            Milestones
          </h2>
          {earnedMilestones.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {earnedMilestones.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center"
                >
                  <span className="text-2xl block mb-1">{milestoneRules.find((r) => r.slug === m.slug)?.icon ?? "🏅"}</span>
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
