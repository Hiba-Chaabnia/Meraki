import { type FilterType } from "./types";

interface SpotFiltersProps {
  filters: FilterType[];
  active: FilterType;
  onChange: (f: FilterType) => void;
}

export function SpotFilters({ filters, active, onChange }: SpotFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`text-sm transition-colors whitespace-nowrap rounded-full px-1.5 py-0.5 ${
            active === f
              ? "text-white font-semibold bg-[var(--primary)]"
              : "text-gray-400 border border-gray-300 hover:text-[var(--secondary)] hover:border-[var(--secondary)]"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
