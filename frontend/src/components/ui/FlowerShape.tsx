'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FlowerShapeProps {
    color?: string;
    size?: number;
    spin?: boolean;
    spinDuration?: number;
    spinDirection?: 'clockwise' | 'counterclockwise';
    className?: string;
    useGradient?: boolean;
    gradientColors?: [string, string];
    gradientId?: string;
}

export const FlowerShape: React.FC<FlowerShapeProps> = ({
    color = 'currentColor',
    size = 100,
    spin = false,
    spinDuration = 2,
    spinDirection = 'clockwise',
    className = '',
    useGradient = false,
    gradientColors = ['#5396F4', '#CFE251'],
    gradientId = 'flowerGradient'
}) => {
    const lobeCount = 8;
    const viewBoxSize = 100;
    const center = viewBoxSize / 2;
    const lobeRadius = 18;
    const lobeOffset = 26;

    const lobes = Array.from({ length: lobeCount }, (_, i) => {
        const angle = (i * 360) / lobeCount;
        const radians = (angle * Math.PI) / 180;
        const cx = center + lobeOffset * Math.cos(radians);
        const cy = center + lobeOffset * Math.sin(radians);
        return { cx, cy, key: i };
    });

    const clipId = `${gradientId}-clip`;

    const svgContent = (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                {useGradient && (
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradientColors[0]} />
                        <stop offset="100%" stopColor={gradientColors[1]} />
                    </linearGradient>
                )}
                <clipPath id={clipId}>
                    {lobes.map((lobe) => (
                        <circle
                            key={lobe.key}
                            cx={lobe.cx}
                            cy={lobe.cy}
                            r={lobeRadius}
                        />
                    ))}
                    <circle cx={center} cy={center} r={14} />
                </clipPath>
            </defs>
            <rect
                x="0"
                y="0"
                width={viewBoxSize}
                height={viewBoxSize}
                fill={useGradient ? `url(#${gradientId})` : color}
                clipPath={`url(#${clipId})`}
            />
        </svg>
    );

    if (spin) {
        const rotateValue = spinDirection === 'clockwise' ? 360 : -360;
        return (
            <motion.div
                animate={{ rotate: rotateValue }}
                transition={{
                    duration: spinDuration,
                    repeat: Infinity,
                    ease: 'linear'
                }}
                style={{ display: 'inline-block', width: size, height: size }}
            >
                {svgContent}
            </motion.div>
        );
    }

    return svgContent;
};
