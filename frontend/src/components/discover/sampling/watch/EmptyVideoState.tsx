import { ExternalLinkIcon } from "@/components/ui/Icons";

interface EmptyVideoStateProps {
  hobbyName: string;
}

export function EmptyVideoState({ hobbyName }: EmptyVideoStateProps) {
  return (
    <div>
      <p className="text-gray-500 mb-3">
        We couldn&apos;t load curated videos right now,<br /> but you can search YouTube directly:
      </p>
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(hobbyName + " beginner tutorial")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[var(--primary)] bg-[var(--primary-theme-bg)] border border-[var(--primary-theme-border)] text-sm font-semibold transition-all hover:shadow-lg active:scale-95"
      >
        &ldquo;{hobbyName} beginner tutorial&rdquo;
        <ExternalLinkIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
