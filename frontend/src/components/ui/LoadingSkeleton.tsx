"use client";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-100 ${className}`}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <SkeletonBox className="h-6 w-16 mx-auto mb-1" />
      <SkeletonBox className="h-3 w-20 mx-auto" />
    </div>
  );
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <SkeletonBox className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <SkeletonBox className="h-4 w-24 mb-2" />
          <SkeletonBox className="h-3 w-full mb-2" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ChallengeCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <SkeletonBox className="h-4 w-20 mb-3" />
      <SkeletonBox className="h-5 w-3/4 mb-2" />
      <SkeletonBox className="h-3 w-full mb-1" />
      <SkeletonBox className="h-3 w-2/3" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
      <div>
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="space-y-3">
        <SessionCardSkeleton />
        <SessionCardSkeleton />
        <SessionCardSkeleton />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <SkeletonBox className="w-24 h-24 rounded-full mx-auto mb-4" />
        <SkeletonBox className="h-6 w-32 mx-auto mb-2" />
        <SkeletonBox className="h-4 w-24 mx-auto mb-2" />
        <SkeletonBox className="h-3 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  );
}
