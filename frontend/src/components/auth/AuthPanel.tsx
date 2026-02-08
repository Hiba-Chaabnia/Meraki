"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** The centred white card used by the forgot- and reset-password pages. */
export function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-[450px]"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
      {message}
    </div>
  );
}

/** Circular tinted badge holding the panel's lead icon. */
export function AuthPanelIcon({
  icon: Icon,
  tone = "brand",
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone?: "brand" | "success";
}) {
  const wrapper =
    tone === "success"
      ? "bg-green-100 mx-auto"
      : "bg-[var(--secondary-light)]";
  const color = tone === "success" ? "text-green-600" : "text-[var(--secondary)]";

  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${wrapper}`}>
      <Icon className={`w-7 h-7 ${color}`} />
    </div>
  );
}
