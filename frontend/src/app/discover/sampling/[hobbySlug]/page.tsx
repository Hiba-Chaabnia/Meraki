"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { SamplingPathways } from "@/components/discover/sampling/SamplingPathways";
import { useSamplingPreview } from "@/hooks/useSamplingPreview";
import { useCommit } from "@/hooks/useCommit";
import { formatSlug } from "@/lib/hobbyData";

export default function SamplingPage({
  params,
}: {
  params: Promise<{ hobbySlug: string }>;
}) {
  const { hobbySlug } = use(params);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const base = `/discover/sampling/${hobbySlug}`;

  const backHref = from === "dashboard" ? "/dashboard" : from === "discover" ? "/discover" : "/discover/quiz/results";
  const backLabel = from === "dashboard" ? "Back to dashboard" : from === "discover" ? "Back to discover" : "Back to quiz results";

  const { previewResult, previewLoading, previewError, previewJobId } = useSamplingPreview(hobbySlug);
  const { handleCommit, committing, commitError } = useCommit(hobbySlug);
  const jobQuery = previewJobId ? `?jobId=${previewJobId}` : "";

  return (
    <SamplingPathways
      hobbyName={formatSlug(hobbySlug)}
      backHref={backHref}
      backLabel={backLabel}
      dashboardHref="/dashboard"
      watchHref={`${base}/watch${jobQuery}`}
      microHref={`${base}/micro${jobQuery}`}
      localHref={`${base}/local`}
      recommendedPath={previewResult?.recommendation?.primary_path}
      recommendationReason={previewResult?.recommendation?.reason}
      loading={previewLoading}
      error={Boolean(previewError)}
      onCommit={handleCommit}
      committing={committing}
      commitError={commitError}
    />
  );
}
