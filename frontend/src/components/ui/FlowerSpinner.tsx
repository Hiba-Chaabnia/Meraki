"use client";

import { motion } from "framer-motion";
import { FlowerShape } from "./FlowerShape";

interface FlowerSpinnerProps {
  /** Overall size in px (default: 48) */
  size?: number;
  /** Primary color (default: var(--primary)) */
  color?: string;
  /** Optional secondary color for the inner layer (default: same as color at lower opacity) */
  innerColor?: string;
  /** Additional class names on the wrapper */
  className?: string;
}

export function FlowerSpinner({
  size = 48,
  color = "var(--primary)",
  innerColor,
  className = "",
}: FlowerSpinnerProps) {
  const outerSize = size;
  const innerSize = size * 0.55;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: outerSize, height: outerSize }}
    >
      {/* Outer flower — spins clockwise, pulses */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <FlowerShape
          size={outerSize}
          color={color}
          spin
          spinDuration={3}
          spinDirection="clockwise"
        />
      </motion.div>

      {/* Inner flower — spins counter-clockwise, opposite pulse */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.9, 0.5, 0.9] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <FlowerShape
          size={innerSize}
          color={innerColor ?? color}
          spin
          spinDuration={2}
          spinDirection="counterclockwise"
        />
      </motion.div>
    </div>
  );
}
