"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RenameHobbyModal } from "./RenameHobbyModal";
import { deleteUserHobby, renameUserHobby, updateHobbyStatus } from "@/app/actions/hobbies";

interface HobbyDangerZoneProps {
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
 * Kept at the foot of the hobby page, not on the dashboard card: pausing and
 * deleting are considered decisions, and the card's single action slot belongs
 * to logging a session. Resume stays on the card, because resuming *should* be
 * one tap.
 */
export function HobbyDangerZone({
  userHobbyId,
  name,
  defaultName,
  status,
  sessionCount,
  onRenamed,
  onStatusChanged,
  onDeleted,
}: HobbyDangerZoneProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<"rename" | "status" | "delete" | null>(null);
  const [renameError, setRenameError] = useState<string>();
  const [error, setError] = useState<string>();

  const paused = status === "paused";

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
    // than assuming it worked.
    if (res.error) {
      setError(res.error);
      return;
    }
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

  return (
    <div className="rounded-2xl border border-[var(--white-muted)] bg-white p-5">
      <h2 className="card-heading mb-1">Manage this hobby</h2>
      <p className="mb-4 text-[12.5px] leading-relaxed text-gray-500">
        {paused
          ? "Paused hobbies stay on your dashboard in grey, with everything you'd done kept."
          : "Pausing keeps everything and takes it off your active list. Nothing here is a rush."}
      </p>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" size="sm" onClick={() => setRenameOpen(true)}>
          Rename
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={busy === "status"}
          onClick={handleToggleStatus}
        >
          {busy === "status" ? "Saving…" : paused ? "Resume hobby" : "Pause hobby"}
        </Button>
        <Button
          variant="destructive-soft"
          size="sm"
          disabled={busy === "delete"}
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-yellow-300 bg-yellow-50 p-2 text-[12px] leading-relaxed text-yellow-800">
          {error}
        </p>
      )}

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
