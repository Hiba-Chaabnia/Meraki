"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { dismissNudge, type NudgeData } from "@/app/actions/nudges";

const urgencyStyles: Record<string, { bg: string; border: string; text: string }> = {
  gentle: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  check_in: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  re_engage: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800" },
};

const actionLabels: Record<string, { label: string; href: string }> = {
  log_session: { label: "Log a Session", href: "/dashboard" },
  view_challenge: { label: "View Challenges", href: "/dashboard/challenges" },
  browse_hobbies: { label: "Browse Hobbies", href: "/dashboard" },
};

export function MotivationNudgeCard({
  nudge,
  onDismiss,
}: {
  nudge: NudgeData;
  onDismiss: () => void;
}) {
  const style = urgencyStyles[nudge.urgency] ?? urgencyStyles.gentle;
  const action = actionLabels[nudge.suggested_action] ?? actionLabels.log_session;

  const handleDismiss = async () => {
    await dismissNudge(nudge.id);
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-2xl border ${style.bg} ${style.border} p-4 flex items-start gap-3`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${style.text}`}>{nudge.message}</p>
        <Link
          href={action.href}
          className={`inline-block mt-2 text-xs font-semibold ${style.text} hover:underline`}
        >
          {action.label} &rarr;
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
}
