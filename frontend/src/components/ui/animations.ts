/**
 * Shared Framer Motion variants and transitions.
 * Import from here instead of re-defining inline.
 */

// Simple fade + slide up — use on individual items
export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// Wrapper for staggered child animations
export const staggerContainer = (staggerChildren = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren } },
});

// Spring transition for modals and dialogs
export const springModal = {
  type: "spring" as const,
  damping: 25,
  stiffness: 300,
};

// Scale in from slightly smaller — use for success/confirmation states
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 },
};
