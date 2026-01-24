"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { addCustomHobby } from "@/app/actions/hobbies";

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl border-2 border-[var(--secondary)] shadow-xl w-full max-w-md"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
                    <h2 className="text-lg font-semibold text-gray-800 text-center">Add a Hobby</h2>
                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="Type a hobby name..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[var(--secondary)] focus:ring-1 focus:ring-[var(--secondary)] transition-colors mb-5"
                  />

                  {error && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleAdd}
                      disabled={!canSubmit || adding}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold bg-[var(--secondary)] transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {adding ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        "Add Hobby"
                      )}
                    </button>
                    <button
                      onClick={handleSample}
                      disabled={!canSubmit || adding}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Sample Hobby
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
