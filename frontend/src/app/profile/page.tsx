"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import { ProfileSkeleton } from "@/components/ui/LoadingSkeleton";
import { ProfileView, type ProfileFields } from "@/components/dashboard";
import { updateProfile, uploadAvatar } from "@/app/actions/profile";
import { getUserStats, getUserMilestones, getHeatmapData } from "@/app/actions/stats";
import { getUserHobbies } from "@/app/actions/hobbies";
import { toUserStats, toActiveHobbies, toMilestone } from "@/lib/transformData";
import type { UserStats, ActiveHobby, Milestone } from "@/lib/dashboardData";
import type { HeatmapDay } from "@/lib/dashboardHome";

const EMPTY_STATS: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalHours: 0,
  challengesCompleted: 0,
  hobbiesExplored: 0,
  daysSinceJoining: 0,
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [hobbies, setHobbies] = useState<ActiveHobby[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, hobbiesRes, milestonesRes, heatRes] = await Promise.all([
          getUserStats(),
          getUserHobbies(),
          getUserMilestones(),
          getHeatmapData(),
        ]);
        if (statsRes.data) setStats(toUserStats(statsRes.data));
        setHobbies(toActiveHobbies(hobbiesRes.data ?? null));
        if (milestonesRes.data) setMilestones(milestonesRes.data.map(toMilestone));
        if (heatRes.data) setHeatmap(heatRes.data);
      } catch (e) {
        console.error("Failed to load profile data:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return <ProfileSkeleton />;

  const handleSave = async (fields: ProfileFields) => {
    await updateProfile(fields);
    await refreshProfile();
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await uploadAvatar(formData);

    if (res.error) return res.error;
    if (res.url) {
      const updateRes = await updateProfile({ avatar_url: res.url });
      await refreshProfile();
      if (updateRes.error) return updateRes.error;
    }
    return null;
  };

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  return (
    <ProfileView
      fields={{
        full_name: profile?.full_name || "",
        bio: profile?.bio || "",
        location: profile?.location || "",
      }}
      avatarUrl={profile?.avatar_url}
      joinDate={joinDate}
      stats={stats ?? EMPTY_STATS}
      hobbies={hobbies}
      milestones={milestones}
      heatmap={heatmap}
      onSave={handleSave}
      onAvatarUpload={handleAvatarUpload}
      dashboardHref="/dashboard"
      settingsHref="/settings"
      discoverHref="/discover"
    />
  );
}
