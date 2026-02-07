"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";

interface RenameHobbyModalProps {
  isOpen: boolean;
  /** What the hobby is called now — the seed, and what Reset restores. */
  currentName: string;
  /** The name derived from the slug, shown as the fallback when cleared. */
  defaultName: string;
  saving?: boolean;
  error?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

/**
 * Renaming changes the display name only. The slug stays put, which is what
 * keeps the hobby attached to its roadmap, challenges and sessions — so this
 * is safe in a way that "rename" often is not, and the copy says so.
 */
export function RenameHobbyModal({
  isOpen,
  currentName,
  defaultName,
  saving = false,
  error,
  onSave,
  onClose,
}: RenameHobbyModalProps) {
  const [name, setName] = useState(currentName);
  const [wasOpen, setWasOpen] = useState(isOpen);

  /* Reseed on each open: the modal stays mounted so `Modal` can play its exit
     animation, so a cancelled edit would otherwise still be in the field next
     time. Adjusted during render rather than in an effect — React's documented
     way to reset state on a prop change, and it avoids the extra pass an
     effect would cost. */
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setName(currentName);
  }

  const trimmed = name.trim();
  const changed = trimmed !== currentName.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="p-6">
        <h3 className="card-heading mb-1.5">Rename this hobby</h3>
        <p className="mb-4 text-[12.5px] leading-relaxed text-gray-500">
          Only what it&apos;s called changes. Your roadmap, challenges and every logged session stay
          exactly where they are.
        </p>

        <FormInput
          label="Name"
          value={name}
          maxLength={100}
          placeholder={defaultName}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />

        {trimmed === "" && (
          <p className="mt-1.5 text-[11.5px] text-gray-500">
            Left empty, it goes back to <strong>{defaultName}</strong>.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving || !changed} onClick={() => onSave(trimmed)}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
