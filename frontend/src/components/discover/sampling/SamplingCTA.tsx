import Link from "next/link";

type SamplingPath = "watch" | "micro" | "local";

const pathConfig: Record<SamplingPath, { label: string; segment: string }> = {
  watch: { label: "Watch a Video", segment: "watch" },
  micro: { label: "Try a Micro Activity", segment: "micro" },
  local: { label: "Find something nearby", segment: "local" },
};

interface SamplingCTAProps {
  hobbySlug: string;
  hobbyName?: string;
  currentPath: SamplingPath;
  onCommit?: () => void;
  committing?: boolean;
  showCommit?: boolean;
}

export function SamplingCTA({
  hobbySlug,
  hobbyName,
  currentPath,
  onCommit,
  committing = false,
  showCommit = true,
}: SamplingCTAProps) {
  const otherPaths = (Object.keys(pathConfig) as SamplingPath[]).filter(
    (p) => p !== currentPath
  );

  return (
    <div className="space-y-3">
      {showCommit && onCommit && (
        <button
          onClick={onCommit}
          disabled={committing}
          className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-[var(--background)] bg-[var(--primary)] transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          {committing ? "Adding to your hobbies..." : `Commit to ${hobbyName}`}
        </button>
      )}
      <div className="flex gap-3">
        {otherPaths.map((path) => (
          <Link
            key={path}
            href={`/discover/sampling/${hobbySlug}/${pathConfig[path].segment}`}
            className="flex-1 text-center px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg active:scale-95 text-[var(--foreground)] bg-[var(--secondary)]"
          >
            {pathConfig[path].label}
          </Link>
        ))}
      </div>
    </div>
  );
}
