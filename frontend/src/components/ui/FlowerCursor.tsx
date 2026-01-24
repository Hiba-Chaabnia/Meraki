'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CURSOR_SIZE = 28;

// Color definitions matching globals.css
const PRIMARY_COLORS = ['#5396F4', '#65A1F5', '#BAD5FB'];
const SECONDARY_COLORS = ['#CFE251', '#DDEB85', '#ECF3B9'];
const BACKGROUND_COLOR = '#FFF9F5';
const FOREGROUND_COLOR = '#292929';

// RGB versions for comparison
const PRIMARY_SECONDARY_RGBS = [
    { r: 83, g: 150, b: 244 },   // --primary
    { r: 101, g: 161, b: 245 },  // --primary-medium
    { r: 186, g: 213, b: 251 },  // --primary-mediumer
    { r: 207, g: 226, b: 81 },   // --secondary
    { r: 221, g: 235, b: 133 },  // --secondary-light
    { r: 236, g: 243, b: 185 },  // --secondary-lighter
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

function parseRgb(color: string): { r: number; g: number; b: number } | null {
    // Handle hex
    if (color.startsWith('#')) {
        return hexToRgb(color);
    }
    // Handle rgb/rgba
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
        };
    }
    return null;
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) +
        Math.pow(c1.g - c2.g, 2) +
        Math.pow(c1.b - c2.b, 2)
    );
}

function isPrimaryOrSecondary(rgb: { r: number; g: number; b: number }): boolean {
    const threshold = 50;
    return PRIMARY_SECONDARY_RGBS.some(c => colorDistance(rgb, c) < threshold);
}

function isBackgroundOrForeground(rgb: { r: number; g: number; b: number }): boolean {
    const bgRgb = hexToRgb(BACKGROUND_COLOR);
    const fgRgb = hexToRgb(FOREGROUND_COLOR);
    const threshold = 50;

    if (bgRgb && colorDistance(rgb, bgRgb) < threshold) return true;
    if (fgRgb && colorDistance(rgb, fgRgb) < threshold) return true;
    return false;
}

export const FlowerCursor: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
    const [useGradient, setUseGradient] = useState(true);
    const [solidColor, setSolidColor] = useState(BACKGROUND_COLOR);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const rotation = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 400 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    const lastScrollY = useRef(0);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const rafId = useRef<number | null>(null);

    const detectBackgroundColor = useCallback((x: number, y: number) => {
        const element = document.elementFromPoint(x, y);
        if (!element) return;

        let currentElement: Element | null = element;
        while (currentElement) {
            const computedStyle = window.getComputedStyle(currentElement);
            const bgColor = computedStyle.backgroundColor;

            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const rgb = parseRgb(bgColor);
                if (rgb) {
                    if (isPrimaryOrSecondary(rgb)) {
                        setUseGradient(false);
                        setSolidColor(BACKGROUND_COLOR);
                        return;
                    } else if (isBackgroundOrForeground(rgb)) {
                        setUseGradient(true);
                        return;
                    }
                }
            }
            currentElement = currentElement.parentElement;
        }

        // Default to gradient if no specific background found
        setUseGradient(true);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setIsVisible(true);
            cursorX.set(e.clientX - CURSOR_SIZE / 2);
            cursorY.set(e.clientY - CURSOR_SIZE / 2);

            // Throttle background detection
            if (rafId.current) cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                detectBackgroundColor(e.clientX, e.clientY);
            });
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY.current) {
                setScrollDirection('down');
            } else if (currentScrollY < lastScrollY.current) {
                setScrollDirection('up');
            }

            lastScrollY.current = currentScrollY;

            // Clear previous timeout
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }

            // Stop spinning after scrolling stops
            scrollTimeout.current = setTimeout(() => {
                setScrollDirection(null);
            }, 150);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, [cursorX, cursorY, detectBackgroundColor]);

    // Handle rotation animation
    useEffect(() => {
        let animationFrame: number;
        let startTime: number | null = null;
        const spinSpeed = 360; // degrees per second

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;

            if (scrollDirection) {
                const elapsed = timestamp - startTime;
                const direction = scrollDirection === 'down' ? 1 : -1;
                rotation.set((elapsed / 1000) * spinSpeed * direction);
            }

            animationFrame = requestAnimationFrame(animate);
        };

        if (scrollDirection) {
            animationFrame = requestAnimationFrame(animate);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [scrollDirection, rotation]);

    // SVG configuration
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

    const gradientId = 'flowerCursorGradient';
    const clipId = 'flowerCursorClip';

    return (
        <>
            <style jsx global>{`
                * {
                    cursor: none !important;
                }
            `}</style>
            <motion.div
                style={{
                    position: 'fixed',
                    left: cursorXSpring,
                    top: cursorYSpring,
                    width: CURSOR_SIZE,
                    height: CURSOR_SIZE,
                    pointerEvents: 'none',
                    zIndex: 9999,
                    opacity: isVisible ? 1 : 0,
                }}
            >
                <motion.svg
                    width={CURSOR_SIZE}
                    height={CURSOR_SIZE}
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ rotate: rotation }}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#5396F4" />
                            <stop offset="100%" stopColor="#CFE251" />
                        </linearGradient>
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
                        fill={useGradient ? `url(#${gradientId})` : solidColor}
                        clipPath={`url(#${clipId})`}
                    />
                </motion.svg>
            </motion.div>
        </>
    );
};
