import { Button } from "@/components/ui/Button";

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
        <Button
          onClick={onCommit}
          disabled={committing}
          variant="primary"
          fullWidth
          className="hover:shadow-lg"
        >
          {committing ? "Adding to your hobbies..." : `Commit to ${hobbyName}`}
        </Button>
      )}
      <div className="flex gap-3">
        {otherPaths.map((path) => (
          <Button
            key={path}
            href={`/discover/sampling/${hobbySlug}/${pathConfig[path].segment}`}
            variant="secondary"
            className="flex-1 hover:shadow-lg"
          >
            {pathConfig[path].label}
          </Button>
        ))}
      </div>
    </div>
  );
}
