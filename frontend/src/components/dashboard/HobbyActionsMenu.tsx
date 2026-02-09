"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, Pencil, Pause, Play, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RenameHobbyModal } from "./RenameHobbyModal";
import { deleteUserHobby, renameUserHobby, updateHobbyStatus } from "@/app/actions/hobbies";

interface HobbyActionsMenuProps {
  userHobbyId: string;
  /** Current display name — what the rename modal opens on. */
  name: string;
  /** The slug-derived name, restored when the override is cleared. */
  defaultName: string;
  status: "active" | "paused";
  sessionCount: number;
  onRenamed: (name: string) => void;
  onStatusChanged: (status: "active" | "paused") => void;
  onDeleted: () => void;
}

/**
 * The three things you can do to a hobby that are not practising it.
 *
 * Was "Manage this hobby", a bordered card at the foot of the page. It read as
 * a fourth section under three that are all about *doing* the hobby, and it was
 * the only one of them that was not content — a settings panel wearing the same
 * heading as the roadmap.
 *
 * It now hangs off the banner, opposite the status chip, because that is where
 * its effects are visible: rename changes the `h1` two lines below it, pause
 * flips the chip it faces. Delete keeps its confirm dialog and is the only red
 * item; the menu being one click from the top of the page is the trade for
 * putting the other two where they belong.
 */
export function HobbyActionsMenu({
  userHobbyId,
  name,
  defaultName,
  status,
  sessionCount,
  onRenamed,
  onStatusChanged,
  onDeleted,
}: HobbyActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<"rename" | "status" | "delete" | null>(null);
  const [renameError, setRenameError] = useState<string>();
  const [error, setError] = useState<string>();
  const ref = useRef<HTMLDivElement>(null);

  const paused = status === "paused";

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleRename(next: string) {
    setBusy("rename");
    setRenameError(undefined);
    const res = await renameUserHobby(userHobbyId, next);
    setBusy(null);
    if (res.error) {
      setRenameError(res.error);
      return;
    }
    setRenameOpen(false);
    onRenamed(next || defaultName);
  }

  async function handleToggleStatus() {
    setBusy("status");
    setError(undefined);
    const next = paused ? "active" : "paused";
    const res = await updateHobbyStatus(userHobbyId, next);
    setBusy(null);
    // Resuming can be refused by the active-hobby cap, so this reports rather
    // than assuming it worked. The menu stays open to show it.
    if (res.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    onStatusChanged(next);
  }

  async function handleDelete() {
    setBusy("delete");
    setError(undefined);
    const res = await deleteUserHobby(userHobbyId);
    setBusy(null);
    setConfirmOpen(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onDeleted();
  }

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-[var(--white-muted)] hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Manage this hobby"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-200/50 bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900 active:scale-95"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-[var(--white-muted)] bg-white py-1.5 shadow-lg"
          >
            <button type="button" role="menuitem" className={`${item} mx-1`} onClick={() => { setOpen(false); setRenameOpen(true); }}>
              <Pencil className="h-4 w-4 flex-shrink-0" /> Rename
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={busy === "status"}
              onClick={handleToggleStatus}
              className={`${item} mx-1`}
            >
              {paused ? (
                <Play className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Pause className="h-4 w-4 flex-shrink-0" />
              )}
              {busy === "status" ? "Saving…" : paused ? "Resume hobby" : "Pause hobby"}
            </button>

            <div className="my-1 border-t border-[var(--white-muted)]" />

            <button
              type="button"
              role="menuitem"
              disabled={busy === "delete"}
              onClick={() => { setOpen(false); setConfirmOpen(true); }}
              className={`${item} mx-1 text-red-600 hover:bg-red-50 hover:text-red-700`}
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" /> Delete
            </button>

            {error && (
              <p className="mx-2 mt-1 rounded-lg border border-yellow-300 bg-yellow-50 p-2 text-[11.5px] leading-relaxed text-yellow-800">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <RenameHobbyModal
        isOpen={renameOpen}
        currentName={name}
        defaultName={defaultName}
        saving={busy === "rename"}
        error={renameError}
        onSave={handleRename}
        onClose={() => setRenameOpen(false)}
      />

      {/* Says what actually goes, and counts it. "This cannot be undone" on its
          own does not tell someone whether they are losing two sessions or
          two hundred. */}
      <ConfirmDialog
        isOpen={confirmOpen}
        destructive
        title={`Delete ${name}?`}
        message={
          sessionCount > 0
            ? `This removes the hobby, its roadmap, its challenges and all ${sessionCount} logged session${
                sessionCount === 1 ? "" : "s"
              }. It can't be undone — pausing keeps everything instead.`
            : "This removes the hobby and its roadmap. It can't be undone — pausing keeps everything instead."
        }
        confirmLabel={busy === "delete" ? "Deleting…" : "Delete for good"}
        cancelLabel="Keep it"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
