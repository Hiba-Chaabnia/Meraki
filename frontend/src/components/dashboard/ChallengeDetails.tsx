"use client";

import type { Challenge } from "@/lib/dashboardData";

/**
 * Skills, what-you'll-learn and tips — the three fields the challenge crew
 * produces that no card shows.
 *
 * Lifted out of the deleted `/dashboard/challenges/[id]` page so the same block
 * can appear wherever a challenge is opened. These are three of the crew's
 * seven output fields; without this block they are generated and never read.
 */
export function ChallengeDetails({ challenge }: { challenge: Challenge }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="card-heading mb-3">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {challenge.skills.map((skill) => (
              <span key={skill} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="card-heading mb-3">What You&apos;ll Learn</h3>
          <ul className="space-y-2">
            {challenge.whatYoullLearn.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1 flex-shrink-0 text-green-400">&#8226;</span>{item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {challenge.tips.length > 0 && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5">
          <h3 className="card-heading mb-3">Tips</h3>
          <ul className="space-y-3">
            {challenge.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
