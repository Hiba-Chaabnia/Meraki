"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboardData";

interface ActivityTimelineProps {
  items: ActivityItem[];
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 shadow-sm p-8 text-center" style={{ borderColor: "var(--primary)" }}>
        <p className="text-sm text-gray-400">No recent activity yet. Log your first practice!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.3 }}
        >
          <Link href={item.href}>
            <div
              className="bg-white rounded-2xl border-2 shadow-sm p-4 hover:shadow-md transition-shadow flex items-center gap-4"
              style={{ borderColor: item.color }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: item.color + "20" }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: item.color + "15", color: item.color }}
                >
                  {item.type === "session" ? "Session" : "Challenge"}
                </span>
                <p className="text-xs text-gray-400 mt-1">
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
    </div>
  );
}
