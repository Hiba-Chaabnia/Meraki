"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Challenge } from "@/lib/dashboardData";

type ArchiveFilter = "all" | "completed" | "skipped";

const FILTERS: { key: ArchiveFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "skipped", label: "Swapped out" },
];

export interface ChallengeArchiveProps {
  /** Completed and swapped-out challenges. Active ones belong on the panel above. */
  challenges: Challenge[];
  /** Omitted renders the rows as static — nothing to open them into. */
  onOpen?: (challenge: Challenge) => void;
}

/**
 * Everything you have already been through, searchable.
 *
 * Rows rather than cards: the archive is a reference you scan, not something
 * you read, and `ChallengeCard` gave every past challenge the same weight as
 * the one you are actually on.
 *
 * Swapped-out challenges are kept, not hidden — their titles feed the crew's
 * "do not repeat" prompt, so a challenge you rejected is still doing work.
 */
export function ChallengeArchive({
  challenges,
  onOpen,
}: ChallengeArchiveProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ArchiveFilter>("all");

  const completedCount = challenges.filter(
    (c) => c.status === "completed",
  ).length;
  const skippedCount = challenges.length - completedCount;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return challenges.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [challenges, filter, query]);

  return (
    <div className="flex h-full flex-col">
      {/* The section label lives outside the card, as it does on every other
          block on the page — so the white surfaces all start at the same y. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="card-heading flex items-center gap-2">
          Challenge Archive
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
            {challenges.length} total
          </span>
        </h2>
        <span className="caption flex-shrink-0">
          {completedCount} completed
          {skippedCount > 0 && ` · ${skippedCount} swapped out`}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-gray-200/90 bg-white p-5 shadow-sm">
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search archived challenges or skills…"
              aria-label="Search archived challenges"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`cursor-pointer whitespace-nowrap rounded-xl px-3 py-1.5 font-semibold transition-all ${
                  filter === f.key
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grows to meet the challenge card beside it, and scrolls past that. */}
        {visible.length > 0 ? (
          <div className="min-h-[160px] flex-1 space-y-2.5 overflow-y-auto pr-1">
            {visible.map((c) => (
              <ArchiveRow key={c.id} challenge={c} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p className="min-h-[160px] flex-1 py-6 text-center text-xs text-gray-400">
            {query.trim()
              ? `Nothing matching “${query.trim()}”.`
              : "Nothing here yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function ArchiveRow({
  challenge: c,
  onOpen,
}: {
  challenge: Challenge;
  onOpen?: (c: Challenge) => void;
}) {
  const isDone = c.status === "completed";
  const date = c.completedDate ?? c.startedDate;

  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(c) : undefined}
      disabled={!onOpen}
      className="group w-full rounded-2xl border border-gray-200/80 bg-white p-3.5 text-left transition-all enabled:cursor-pointer hover:border-gray-300 hover:shadow-sm"
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
            isDone
              ? "bg-emerald-100 text-emerald-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {isDone ? "completed" : "swapped out"}
        </span>
        {date && (
          <span className="text-[10px] font-medium text-gray-400">
            {date.slice(0, 10)}
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase text-gray-400">
          · {c.difficulty}
        </span>
      </div>

      <p className="line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover:text-[var(--primary)]">
        {c.title}
      </p>

      {c.skills.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {c.skills.map((s) => (
            <span
              key={s}
              className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
