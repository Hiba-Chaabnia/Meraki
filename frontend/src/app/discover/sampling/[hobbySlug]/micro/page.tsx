"use client";

import { use } from "react";
import { formatSlug } from "@/lib/hobbyData";
import { PageLayout } from "@/components/layouts/PageLayout";
import { MicroActivityCard } from "@/components/discover/sampling/micro/MicroActivityCard";
import { useSamplingPreview } from "@/hooks/useSamplingPreview";
import type { MicroActivity } from "@/components/discover/sampling/micro/types";

export default function MicroPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const hobbyName = formatSlug(hobbySlug);
  const { previewResult, previewLoading } = useSamplingPreview(hobbySlug);

  const ma = previewResult?.micro_activity;
  const activity: MicroActivity | null = ma
    ? { title: ma.title, instruction: ma.instruction, duration: ma.duration, why_it_works: ma.why_it_works }
    : null;

  return (
    <PageLayout
      title="Micro Activity"
      subtitle={`A tiny taste of ${hobbyName.toLowerCase()} — no materials needed, just you.`}
      backHref={`/discover/sampling/${hobbySlug}`}
      backLabel="Back to sampling options"
    >
      <div className="max-w-3xl mx-auto w-full">
        {previewLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[var(--secondary)] animate-spin" />
              <p className="text-sm text-gray-400">Preparing your activity…</p>
            </div>
          </div>
        ) : activity ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <MicroActivityCard
              instruction={activity.instruction}
              duration={activity.duration}
              whyItWorks={activity.why_it_works}
              hobbySlug={hobbySlug}
              hobbyName={hobbyName}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-gray-400">No activity available. Try again later.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
