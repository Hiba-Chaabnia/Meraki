import { FlowerSpinner } from "@/components/ui/FlowerSpinner";

interface SamplingLoadingStateProps {
  message?: string;
  submessage?: string;
}

export function SamplingLoadingState({
  message = "Loading...",
  submessage = "This may take a moment",
}: SamplingLoadingStateProps) {
  return (
    <div>
      <FlowerSpinner size={48} className="mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
      <p className="text-sm text-gray-400 mt-2">{submessage}</p>
    </div>
  );
}
