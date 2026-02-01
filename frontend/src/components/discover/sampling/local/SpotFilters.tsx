import { Button } from "@/components/ui/Button";
import { type FilterType } from "./types";

interface SpotFiltersProps {
  filters: FilterType[];
  active: FilterType;
  onChange: (f: FilterType) => void;
}

export function SpotFilters({ filters, active, onChange }: SpotFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded">
      {filters.map((f) => (
        <Button
          key={f}
          onClick={() => onChange(f)}
          variant={active === f ? "primary" : "outline"}
          size="sm"
          shape="pill"
          aria-pressed={active === f}
          outlineColor="#d1d5db"
          outlineHoverColor="var(--secondary)"
        >
          {f}
        </Button>
      ))}
    </div>
  );
}
