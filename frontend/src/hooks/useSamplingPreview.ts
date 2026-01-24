"use client";

import { useState, useEffect } from "react";
import {
  triggerSamplingPreview,
  pollSamplingPreviewStatus,
  getSamplingResult,
  saveSamplingResult,
  type SamplingPreviewResult,
} from "@/app/actions/sampling";

/* ─── Module-level caches ───
   These survive component unmount/remount during client-side navigation.
   This is the primary guard against re-triggering the crew on back-nav. */
const resultCache = new Map<string, SamplingPreviewResult>();
const jobIdCache = new Map<string, string>();

function cacheResult(slug: string, result: SamplingPreviewResult) {
  resultCache.set(slug, result);
  try {
    sessionStorage.setItem(`sampling-preview-${slug}`, JSON.stringify(result));
  } catch { /* quota exceeded — module cache is still the primary */ }
}

export function useSamplingPreview(hobbySlug: string) {
  const [previewResult, setPreviewResult] = useState<SamplingPreviewResult | null>(
    () => resultCache.get(hobbySlug) ?? null
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(
    () => jobIdCache.get(hobbySlug) ?? null
  );

  useEffect(() => {
    if (resultCache.has(hobbySlug)) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function storeResult(result: SamplingPreviewResult, jobId?: string) {
      cacheResult(hobbySlug, result);
      if (jobId) jobIdCache.set(hobbySlug, jobId);
      if (!cancelled) {
        setPreviewResult(result);
        setPreviewLoading(false);
      }
    }

    function startPolling(jobId: string) {
      jobIdCache.set(hobbySlug, jobId);
      if (!cancelled) setPreviewJobId(jobId);
      pollTimer = setInterval(async () => {
        const status = await pollSamplingPreviewStatus(jobId);

        if ("status" in status && status.status === "completed" && status.result) {
          if (pollTimer) clearInterval(pollTimer);
          cacheResult(hobbySlug, status.result);
          if (jobId) jobIdCache.set(hobbySlug, jobId);
          saveSamplingResult(hobbySlug, status.result).catch((e) => console.error("[Sampling] DB save failed:", e));
          if (!cancelled) {
            setPreviewResult(status.result);
            setPreviewLoading(false);
          }
          return;
        }

        if (cancelled) return;

        if (!("status" in status)) {
          if (pollTimer) clearInterval(pollTimer);
          setPreviewError(status.error);
          setPreviewLoading(false);
          return;
        }

        if (status.status === "failed") {
          if (pollTimer) clearInterval(pollTimer);
          setPreviewError(status.error || "Preview generation failed");
          setPreviewLoading(false);
        }
      }, 2000);
    }

    async function fetchPreview() {
      setPreviewError(null);

      // 1. Check sessionStorage (sync, secondary cache)
      try {
        const stored = sessionStorage.getItem(`sampling-preview-${hobbySlug}`);
        if (stored) {
          const data: SamplingPreviewResult = JSON.parse(stored);
          if (data.recommendation || data.micro_activity || (data.videos && data.videos.length > 0)) {
            storeResult(data);
            return;
          }
        }
      } catch { /* parse error — continue to DB */ }

      // Only show loading after all sync checks miss
      setPreviewLoading(true);

      try {
        // 2. Check database (survives page refresh / restart)
        const dbResult = await getSamplingResult(hobbySlug);
        if (cancelled) return;
        if (dbResult.data) {
          storeResult(dbResult.data);
          return;
        }

        // 3. Check if there's an existing job still running
        const existingJobId = jobIdCache.get(hobbySlug)
          || sessionStorage.getItem(`sampling-job-${hobbySlug}`);
        if (existingJobId) {
          const status = await pollSamplingPreviewStatus(existingJobId);
          if (cancelled) return;
          if ("status" in status) {
            if (status.status === "completed" && status.result) {
              storeResult(status.result, existingJobId);
              saveSamplingResult(hobbySlug, status.result).catch((e) => console.error("[Sampling] DB save failed:", e));
              return;
            } else if (status.status === "pending" || status.status === "running") {
              startPolling(existingJobId);
              return;
            }
          }
        }

        // 4. Only trigger a new job if no existing result or job
        console.log("[Sampling] All caches missed — triggering new crew for", hobbySlug);
        const { job_id, error } = await triggerSamplingPreview(hobbySlug);
        if (cancelled) return;
        if (error || !job_id) {
          setPreviewError(error || "Failed to start preview");
          setPreviewLoading(false);
          return;
        }

        jobIdCache.set(hobbySlug, job_id);
        setPreviewJobId(job_id);
        try { sessionStorage.setItem(`sampling-job-${hobbySlug}`, job_id); } catch {}
        startPolling(job_id);
      } catch (e) {
        if (!cancelled) {
          setPreviewError(`Failed to fetch preview: ${e}`);
          setPreviewLoading(false);
        }
      }
    }

    fetchPreview();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [hobbySlug]);

  return { previewResult, previewLoading, previewError, previewJobId };
}
