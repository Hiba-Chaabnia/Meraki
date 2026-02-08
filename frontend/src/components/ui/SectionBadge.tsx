"use client";

import { FlowerShape } from "@/components/ui/FlowerShape";

interface SectionBadgeProps {
    /** The label text to display */
    label: string;
    /** Background color (default: var(--secondary-light)) */
    bgColor?: string;
    /** Foreground color for flower and text (default: var(--secondary)) */
    color?: string;
    /** Flower size (default: 20) */
    flowerSize?: number;
    /** Spin duration in seconds (default: 4) */
    spinDuration?: number;
    /** Custom classes for the text span (overrides default) */
    textClassName?: string;
}

export default function SectionBadge({
    label,
    bgColor = "var(--secondary-lighter)",
    color = "var(--secondary)",
    flowerSize = 20,
    spinDuration = 4,
    textClassName = "text-sm font-bold italic tracking-widest",
    className = "",
}: SectionBadgeProps & { className?: string }) {
    return (
        <div
            className={`inline-flex items-center gap-3 px-5 py-2 rounded-full ${className}`}
            style={{ background: bgColor }}
        >
            <FlowerShape
                size={flowerSize}
                color={color}
                spin
                spinDuration={spinDuration}
                spinDirection="counterclockwise"
            />
            <span
                className={textClassName}
                style={{ color: color }}
            >
                {label}
            </span>
            <FlowerShape
                size={flowerSize}
                color={color}
                spin
                spinDuration={spinDuration}
                spinDirection="clockwise"
            />
        </div>
    );
}
