"use client";

import { PenLine } from "lucide-react";

interface LogPracticeFABProps {
  onClick: () => void;
}

export function LogPracticeFAB({ onClick }: LogPracticeFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Log practice"
      className="fixed bottom-24 right-5 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-[var(--secondary)] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
    >
      <PenLine className="w-5 h-5 text-[#1a1a1a]" />
    </button>
  );
}
