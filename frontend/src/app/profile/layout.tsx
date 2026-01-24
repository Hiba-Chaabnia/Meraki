"use client";

import { DashboardNav } from "@/components/dashboard";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardNav>{children}</DashboardNav>;
}
