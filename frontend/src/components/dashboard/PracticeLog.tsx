"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { moodEmojis } from "@/lib/dashboardData";
import type { PracticeSession } from "@/lib/dashboardData";
import type { PracticeFeedback } from "@/app/actions/feedback";

export interface PracticeLogProps {
  sessions: PracticeSession[];
  /** Keyed by session id. Only `celebration` is shown here. */
  feedbackMap: Record<string, PracticeFeedback>;
  sessionHref: (sessionId: string) => string;
  onLogPractice: () => void;
  /** The hobby's own colour, for the log button. */
  themeColor: string;
  hobbyName: string;
}

/**
 * Every session for this hobby, full width.
 *
 * There is no sessions index any more, so this is the only place a session can
 * be found — which is why it is the whole log rather than a preview of it. It
 * ran as a narrow single-column list beside the archive; three across reads the
 * same number of sessions in a third of the scroll.
 */
export function PracticeLog({
  sessions,
  feedbackMap,
  sessionHref,
  onLogPractice,
  themeColor,
  hobbyName,
}: PracticeLogProps) {
  return (
    <div className="rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm md:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900">
            Practice log
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${themeColor} 14%, transparent)`,
                color: themeColor,
              }}
            >
              {sessions.length} logged
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Your recorded practice time, moods and feedback.
          </p>
        </div>

        <button
          onClick={onLogPractice}
          style={{ backgroundColor: themeColor }}
          className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Log practice session
        </button>
      </div>

      {sessions.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => {
            const mood = moodEmojis[s.mood] ?? { emoji: "", label: "" };
            const celebration = feedbackMap[s.id]?.celebration;
            return (
              <Link
                key={s.id}
                href={sessionHref(s.id)}
                className="flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-slate-50/70 p-4 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-xl"
                      title={mood.label}
                    >
                      {mood.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-extrabold text-gray-900">{s.duration} min</p>
                        <span className="text-[11px] font-medium text-gray-400">
                          {new Date(s.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-gray-600">
                        {s.notes || "No notes logged"}
                      </p>
                    </div>
                  </div>
                </div>

                {celebration && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border-t border-gray-200/60 bg-white/60 p-2.5">
                    <span className="flex-shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      Insight
                    </span>
                    <p className="text-xs font-medium italic text-gray-700">{celebration}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No practice sessions logged yet for {hobbyName}.</p>
        </div>
      )}
    </div>
  );
}
