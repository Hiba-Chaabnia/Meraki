"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { addCustomHobby } from "@/app/actions/hobbies";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { FormInput } from "@/components/ui/FormInput";
import { scaleIn } from "@/components/ui/animations";

export function AddHobbyModal({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
      setSuccess(false);
      setAdding(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const canSubmit = name.trim().length >= 2;

  const handleAdd = async () => {
    if (!canSubmit || adding) return;
    setError(null);
    setAdding(true);
    const res = await addCustomHobby(name.trim());
    setAdding(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onClose();
      onAdded();
    }, 1200);
  };

  const handleSample = async () => {
    if (!canSubmit || adding) return;
    setError(null);
    setAdding(true);
    const res = await addCustomHobby(name.trim());
    setAdding(false);
    if (res.error || !res.slug) {
      setError(res.error ?? "Failed to add hobby");
      return;
    }
    onClose();
    router.push(`/discover/sampling/${res.slug}?from=dashboard`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" borderColor="var(--secondary)">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {name.trim()} added!
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Add a Hobby</h2>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                shape="pill"
                iconOnly
              >
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </div>

            <div className="mb-5">
              <FormInput
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="Type a hobby name..."
                error={error ?? undefined}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                disabled={!canSubmit || adding}
                variant="secondary"
                size="md"
                fullWidth
                className="!text-white"
              >
                {adding ? <Spinner size="sm" variant="white" /> : "Add Hobby"}
              </Button>
              <Button
                onClick={handleSample}
                disabled={!canSubmit || adding}
                variant="outline"
                size="md"
                fullWidth
                outlineColor="#e5e7eb"
                outlineHoverColor="#9ca3af"
              >
                Sample Hobby
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
