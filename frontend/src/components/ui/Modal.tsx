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
            style={borderColor ? { borderColor } : undefined}
            className={[
              "relative bg-white rounded-2xl shadow-xl w-full",
              borderColor ? "border-2" : "",
              scrollable ? "max-h-[90vh] overflow-y-auto" : "",
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
