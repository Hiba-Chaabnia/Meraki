"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springModal } from "./animations";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind max-width class — defaults to max-w-lg */
  maxWidth?: string;
  /** CSS color value applied as border — e.g. "var(--secondary)". Omit for no border. */
  borderColor?: string;
  /**
   * CSS color value for the panel background — e.g. "var(--background)".
   * Omit to keep the default `bg-white`. Applied as an inline style (like
   * `borderColor` below) rather than a `bg-*` class passed through
   * `className`: the base panel already carries `bg-white` as a class, and
   * two competing `bg-*` utility classes on the same element resolve by
   * whichever Tailwind happens to emit later in the compiled stylesheet —
   * not something worth depending on. Inline style always wins over a class,
   * regardless of source order.
   */
  backgroundColor?: string;
  /** Adds max-h-[90vh] overflow-y-auto for long content */
  scrollable?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-lg",
  borderColor,
  backgroundColor,
  scrollable = false,
  className = "",
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={springModal}
            style={{
              ...(borderColor && { borderColor }),
              ...(backgroundColor && { backgroundColor }),
            }}
            className={[
              "relative bg-white rounded-2xl shadow-xl w-full",
              borderColor ? "border-2" : "",
              /* Non-scrollable panels get `overflow-hidden` so the rounded
                 corners actually clip their content — `overflow: hidden` on a
                 non-scrolling element is a code path Chromium handles
                 correctly. Deliberately NOT added alongside `overflow-y-auto`
                 below: a panel that owns its own scrollbar has a separate,
                 unreliable clipping bug (confirmed — computed border-radius
                 was correct, corners still rendered square), and stacking
                 `overflow-hidden` with `overflow-y-auto` on the same element
                 doesn't fix that; it just adds an unpredictable cascade
                 between two conflicting overflow declarations. Consumers that
                 need scrollable content should build their own two-layer
                 split instead — see components/legal/LegalModal.tsx. */
              scrollable ? "max-h-[90vh] overflow-y-auto" : "overflow-hidden",
              maxWidth,
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
