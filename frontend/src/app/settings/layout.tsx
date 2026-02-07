"use client";

import { DashboardNav } from "@/components/dashboard";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardNav>{children}</DashboardNav>;
}
