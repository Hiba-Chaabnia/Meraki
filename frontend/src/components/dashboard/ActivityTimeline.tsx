"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboardData";
import { fadeUp, staggerContainer } from "@/components/ui/animations";
import { Card } from "@/components/ui/Card";

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <Card variant="bordered" borderColor="var(--primary)" padding="lg">
        <p className="text-sm text-gray-400 text-center">
          No recent activity yet. Log your first practice!
        </p>
      </Card>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      variants={staggerContainer(0.05)}
      initial="hidden"
      animate="show"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={fadeUp}>
          <Link href={item.href}>
            <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-gray-100">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="label">{item.title}</p>
                <p className="caption truncate">{item.subtitle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="badge-sm bg-gray-100 text-gray-700">
                  {item.type === "session" ? "Session" : "Challenge"}
                </span>
                <p className="caption mt-1">
                  {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}

      <div className="text-center pt-2">
        <Link
          href="/dashboard/sessions"
          className="text-sm text-[var(--secondary)] font-medium hover:underline inline-flex items-center gap-1"
        >
          View all activity <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
}
