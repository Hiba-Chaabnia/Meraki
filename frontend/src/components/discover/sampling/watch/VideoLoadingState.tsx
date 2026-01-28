import { FlowerSpinner } from "@/components/ui/FlowerSpinner";

interface VideoLoadingStateProps {
  message?: string;
  submessage?: string;
}

export function VideoLoadingState({
  message = "Finding the best videos for you...",
  submessage = "This may take a moment while our AI curates beginner-friendly content",
}: VideoLoadingStateProps) {
  return (
    <>
      <FlowerSpinner size={48} className="mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
      <p className="text-sm text-gray-400 mt-2">{submessage}</p>
    </>
  );
}
