"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";

interface UserChipProps {
  displayName: string;
  displayInitial: string;
  expanded: boolean;
  onSignOut: () => void;
}

export function UserChip({ displayName, displayInitial, expanded, onSignOut }: UserChipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      {/* Dropdown menu — anchored above the chip */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--white-muted)] py-1.5 z-50"
          >
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 mx-1 px-3 py-2 text-sm text-gray-600 hover:bg-[var(--white-muted)] hover:text-gray-900 rounded-lg transition-colors"
            >
              <User className="w-4 h-4 flex-shrink-0" /> Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 mx-1 px-3 py-2 text-sm text-gray-600 hover:bg-[var(--white-muted)] hover:text-gray-900 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 flex-shrink-0" /> Settings
            </Link>
            <div className="my-1.5 mx-3 border-t border-[var(--white-muted)]" />
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chip button — two layouts based on expanded prop */}
      {expanded ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className={`w-full h-8 flex items-center gap-2.5 px-2 rounded-lg transition-colors cursor-pointer ${
            open ? "bg-[var(--white-muted)]" : "hover:bg-[var(--white-muted)]"
          }`}
        >
          <div className="h-full aspect-square rounded-full bg-[var(--primary)] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-[var(--white)]">{displayInitial}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 truncate">{displayName}</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          title="Account"
          className={`h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
            open ? "bg-[var(--white-muted)]" : "hover:bg-[var(--white-muted)]"
          }`}
        >
          <div
            className={`w-full h-full rounded-full bg-[var(--primary)] flex items-center justify-center transition-all ${
              open ? "ring-2 ring-offset-1 ring-[var(--secondary)]" : ""
            }`}
          >
            <span className="text-sm font-semibold text-[var(--white)]">{displayInitial}</span>
          </div>
        </button>
      )}
    </div>
  );
}
