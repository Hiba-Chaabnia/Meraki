"use client";

import { FlowerShape } from "@/components/ui/FlowerShape";
import { ReactNode } from "react";

interface StepCardProps {
  /** The icon to display inside the flower */
  icon: ReactNode;
  /** The color theme for the flower */
  color: string;
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Whether this is a Call to Action card */
  isCTA?: boolean;
}

export default function StepCard({
  icon,
  color,
  title,
  description,
  isCTA = false,
}: StepCardProps) {
  // We use index-based gradients in the original snippet, or we can just generate a unique-ish ID or pass it in.
  // For simplicity, we'll generate a gradient ID based on the title or random.
  // Ideally, the parent should pass a unique ID, but we can rely on standard SVG behavior or just random strings if needed.
  // Let's assume the parent might pass it, or we generate one.
  const gradientId = `grad-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex flex-col items-center text-center h-full justify-start border border-red-500">
      {/* Flower + Icon Wrapper */}
      <div className="relative flex items-center justify-center mb-6">
        <FlowerShape color={color} gradientId={gradientId} size={120} />
        {/* Icon positioned absolutely over the flower */}
        <div className="absolute inset-0 flex items-center justify-center text-white text-4xl drop-shadow-md z-10">
          {icon}
        </div>
      </div>

      <p
        className={`text-xl font-semibold leading-snug mb-4 text-gray-900 font-mulish ${isCTA ? "mt-4" : ""
          }`}
      >
        {title}
      </p>

      <p className="text-base font-medium leading-snug mb-8 text-gray-700">
        {description}
      </p>

      {isCTA && (
        <a
          href="/signin"
          className="inline-block px-10 py-4 bg-[var(--primary)] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 font-mulish"
        >
          Begin your journey
        </a>
      )}
    </div>
  );
}
