"use client";

import { useEffect, useRef } from "react";

/**
 * Close-on-outside-click and close-on-Escape for a popover.
 *
 * Returns the ref to put on the element that counts as "inside" — the trigger
 * and its panel together, so pressing the trigger again toggles rather than
 * being read as an outside click and immediately reopening.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onDismiss: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onDismiss]);

  return ref;
}
