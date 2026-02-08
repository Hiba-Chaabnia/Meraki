"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { buildHeatmap, type HeatmapDay } from "@/lib/dashboardHome";

const heatColors: Record<number, string> = {
  0: "#f3f4f6",
  1: "#FFECDB",
  2: "#FFB87A",
  3: "#FF9149",
};
const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];

/* The cell value is a minutes band, not a session count — `buildHeatmap`
   buckets at 30 and 60 minutes. The tooltip used to read "2 sessions". */
const INTENSITY_LABEL = ["No practice", "Under 30 min", "30–60 min", "Over an hour"];

/**
 * Long-range practice activity, lifted out of the deleted Progress page.
 *
 * An account-level question — every hobby's sessions in one field — so it sits
 * on the profile beside the other account-level numbers. `PracticeWeek` on the
 * dashboard covers seven days; this is the only long-range view, and a
 * per-hobby page structurally cannot show it.
 *
 * Takes sessions, not intensities: `buildHeatmap` buckets them against the
 * viewer's local dates and pads the grid to whole Monday-start weeks, which is
 * what makes the M/W/F/S labels beside the columns true.
 */
export function PracticeHeatmap({ days }: { days: HeatmapDay[] }) {
  const { cells } = useMemo(() => buildHeatmap(days), [days]);

  const weeks: (0 | 1 | 2 | 3)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="card-heading mb-4">Practice activity</h2>
      {days.length > 0 ? (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-1">
              <div className="mr-1 flex flex-col gap-1">
                {DAY_LABELS.map((label, i) => (
                  <div key={i} className="flex h-3 w-3 items-center justify-center">
                    <span className="text-[8px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((val, di) => (
                    <motion.div
                      key={di}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.005 }}
                      className="h-3 w-3 rounded-[3px]"
                      style={{ backgroundColor: heatColors[val] }}
                      title={INTENSITY_LABEL[val]}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-gray-400">Less</span>
            {[0, 1, 2, 3].map((v) => (
              <div key={v} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: heatColors[v] }} />
            ))}
            <span className="text-[10px] text-gray-400">More</span>
          </div>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">
          No activity yet — your first session starts the map.
        </p>
      )}
    </div>
  );
}
