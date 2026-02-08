"use client";

import { motion, useTransform, useSpring, MotionValue } from "framer-motion";
import StepCard from "@/components/ui/StepCard";

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
        // Removed Math.max clamping so it can reach negative values (above center)

        const opacity = useTransform(
          scrollYProgress,
          [
            start - duration,
            start - duration + 0.1,
            start + stagger, // Stay fully opaque until the next card arrives
            start + stagger + 0.1, // Then fade out
          ],
          [initialOpacity, 1, 1, index === steps.length - 1 ? 1 : 0.75]
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
              y: ySpring, // Apply the spring-animated Y value directly
              rotate,
              opacity,
              scale,
              zIndex: index + 10,
              // Removed fixed 'top' so flex-center handles the static position
            }}
            className="absolute w-[90%] md:w-[85%] max-w-md bg-[var(--background)] rounded-2xl p-4 md:p-8 text-center pointer-events-auto border border-blue-500"
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
