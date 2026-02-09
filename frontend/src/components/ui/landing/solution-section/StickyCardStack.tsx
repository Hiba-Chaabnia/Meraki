"use client";

import { motion, useTransform, useSpring, MotionValue } from "framer-motion";
import StepCard from "@/components/ui/landing/solution-section/StepCard";

interface Step {
  id: string;
  color: string;
  icon: string | React.ReactNode;
  title: string;
  description: string;
  isCTA?: boolean;
}

interface StickyCardStackProps {
  steps: Step[];
  scrollYProgress: MotionValue<number>;
}

export default function StickyCardStack({
  steps,
  scrollYProgress,
}: StickyCardStackProps) {
  const cardHeightOffset = 25;
  const totalStackHeight = (steps.length - 1) * cardHeightOffset;
  const centerOffset = totalStackHeight / 2;

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {steps.map((step, index) => {
        // Adjusted timing for smoother, more noticeable animation
        // duration: length of scroll proportional to animation (0.25 = 25% of total scroll)
        // stagger: distance between card starts
        const duration = 0.25;
        const stagger = 0.15;
        const start = duration + index * stagger;

        const isFirst = index === 0;
        // initialY relative to center. 800 is far enough down.
        const initialY = isFirst ? 150 : 800;
        // Entry opacity only determines the fade-in from bottom
        const initialOpacity = isFirst ? 0.8 : 0;

        // Calculate final position to center the stack
        // (index * 25) - (totalStackHeight / 2)
        const finalY = index * cardHeightOffset - centerOffset;

        const ySpring = useSpring(
          useTransform(
            scrollYProgress,
            [start - duration, start],
            [initialY, finalY] // Move from bottom to calculated stack position
          ),
          { stiffness: 50, damping: 20 }
        );

        // --- NEW LOGIC: Glassmorphism Stacking ---

        // 1. Entry Opacity (Only controls the initial fade-in)
        // Once active, it stays at 1. The "fading" is now handled by transparency/blur.
        const opacity = useTransform(
          scrollYProgress,
          [start - duration, start - duration + 0.1],
          [initialOpacity, 1]
        );

        // 2. Backdrop Blur & Background Color
        // Timeline:
        // [start]: Card is Active (Top). Solid, No Blur.
        // [start + stagger]: Next card arrives. transition starts.
        // [start + stagger + 0.1]: Behind 1. Mild Blur, Translucent.
        // [start + 2*stagger + 0.1]: Behind 2. Strong Blur, More Transparent.

        const blurString = useTransform(
          scrollYProgress,
          [
            start,                      // Active
            start + stagger,            // Still Active (just before next covers)
            start + stagger + 0.1,      // Behind 1 (Covered by next)
            start + 2 * stagger,        // Still Behind 1
            start + 2 * stagger + 0.1,  // Behind 2 (Covered by next next)
          ],
          [
            "blur(0px)",
            "blur(0px)",
            "blur(4px)",
            "blur(4px)",
            "blur(8px)",
          ]
        );

        // Matching background color transitions
        // We use rgba(255, 249, 245, alpha) to match --background (#FFF9F5)
        const backgroundColor = useTransform(
          scrollYProgress,
          [
            start,
            start + stagger,
            start + stagger + 0.1,
            start + 2 * stagger,
            start + 2 * stagger + 0.1,
          ],
          [
            "rgba(255, 249, 245, 1)",   // Solid
            "rgba(255, 249, 245, 1)",   // Solid
            "rgba(255, 249, 245, 0.85)", // Translucent (Behind 1)
            "rgba(255, 249, 245, 0.85)", // Translucent
            "rgba(255, 249, 245, 0.6)",  // More Transparent (Behind 2)
          ]
        );

        const scale = useTransform(
          scrollYProgress,
          [start - duration, start],
          [0.8, 1] // Start slightly smaller for dramatic effect
        );

        const rotate = useSpring(
          useTransform(
            scrollYProgress,
            [start - duration, start],
            [index % 2 === 0 ? -10 : 10, 0] // Slight increase in rotation
          ),
          { stiffness: 50, damping: 20 }
        );

        return (
          <motion.div
            key={step.id}
            style={{
              y: ySpring,
              rotate,
              opacity,
              scale,
              zIndex: index + 10,
              backdropFilter: blurString,
              backgroundColor, // Animated background color
            }}
            className="absolute w-[90%] md:w-[85%] max-w-md rounded-2xl p-4 md:p-8 text-center pointer-events-auto shadow-sm"
          >
            <StepCard
              icon={step.icon}
              color={step.color}
              title={step.title}
              description={step.description}
              isCTA={step.isCTA}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
