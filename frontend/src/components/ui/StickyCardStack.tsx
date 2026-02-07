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
  return (
    <>
      {steps.map((step, index) => {
        // Adjusted timing for smoother, more noticeable animation
        // duration: length of scroll proportional to animation (0.25 = 25% of total scroll)
        // stagger: distance between card starts
        const duration = 0.25;
        const stagger = 0.15;
        const start = duration + (index * stagger);

        const y = useSpring(
          useTransform(
            scrollYProgress,
            [start - duration, start],
            [800, 0] // Increased start distance to ensuring it enters from further down
          ),
          { stiffness: 60, damping: 20 } // Slightly softer spring
        );
        const opacity = useTransform(
          scrollYProgress,
          [start - duration, start - duration + 0.1], // Fade in quickly in first 40% of motion
          [0, 1]
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
          { stiffness: 60, damping: 20 }
        );

        const stackTop = index * 25;

        return (
          <motion.div
            key={step.id}
            style={{
              y,
              rotate,
              opacity,
              scale,
              zIndex: index + 10,
              top: `${stackTop + 60}px`,
            }}
            className="absolute w-[90%] md:w-[85%] max-w-md bg-white rounded-[40px] shadow-2xl border border-black/5 p-8 md:p-12 text-center"
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
    </>
  );
}
