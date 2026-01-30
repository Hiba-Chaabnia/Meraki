import React from "react";

interface SamplingErrorStateProps {
  message?: string;
  children?: React.ReactNode;
}

export function SamplingErrorState({
  message = "Something went wrong. Please try again.",
  children,
}: SamplingErrorStateProps) {
  return (
    <div>
      <p className="text-gray-500 mb-3">{message}</p>
      {children}
    </div>
  );
}
