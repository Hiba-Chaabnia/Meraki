"use client";

import { FlowerShape } from "@/components/ui/FlowerShape";

interface SectionBadgeProps {
    /** The label text to display */
    label: string;
    /** Background color (default: var(--secondary-lighter)) */
    bgColor?: string;
    /** Flower color (default: var(--secondary)) */
    flowerColor?: string;
    /** Text color (default: var(--secondary)) */
    textColor?: string;
    /** Flower size (default: 20) */
    flowerSize?: number;
    /** Spin duration in seconds (default: 4) */
    spinDuration?: number;
}

export default function SectionBadge({
    label,
    bgColor = "var(--secondary-lighter)",
    flowerColor = "var(--secondary)",
    textColor = "var(--secondary)",
    flowerSize = 20,
    spinDuration = 4,
}: SectionBadgeProps) {
    return (
        <div
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full"
            style={{ backgroundColor: bgColor }}
        >
            <FlowerShape
                size={flowerSize}
                color={flowerColor}
                spin
                spinDuration={spinDuration}
                spinDirection="counterclockwise"
            />
            <span
                className="text-sm font-bold italic tracking-widest"
                style={{ color: textColor }}
            >
                {label}
            </span>
            <FlowerShape
                size={flowerSize}
                color={flowerColor}
                spin
                spinDuration={spinDuration}
                spinDirection="clockwise"
            />
        </div>
    );
}
