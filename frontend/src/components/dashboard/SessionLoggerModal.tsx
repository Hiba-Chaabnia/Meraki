"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { ActiveHobby, Challenge } from "@/lib/dashboardData";
import { uploadSessionImage } from "@/app/actions/sessions";

interface SessionLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SessionFormData) => void;
  hobbies: ActiveHobby[];
  activeChallenges?: Challenge[];
}

export interface SessionFormData {
  type: "practice" | "thought";
  hobbySlug: string;
  duration: number;
  notes: string;
  imageUrl?: string;
}

export function SessionLoggerModal({ isOpen, onClose, onSave, hobbies, activeChallenges }: SessionLoggerModalProps) {
  const [phase, setPhase] = useState<"form" | "saved">("form");
  const [sessionType, setSessionType] = useState<"practice" | "thought">("practice");
  const [hobbySlug, setHobbySlug] = useState(hobbies[0]?.slug ?? "");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChallenge = activeChallenges?.find((c) => c.status === "active");

  const reset = useCallback(() => {
    setPhase("form");
    setSessionType("practice");
    setHobbySlug(hobbies[0]?.slug ?? "");
    setDuration(30);
    setNotes("");
    setImageFile(null);
    setImagePreview(null);
    setSaving(false);
  }, [hobbies]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl: string | undefined;
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const res = await uploadSessionImage(fd);
      if (res.url) imageUrl = res.url;
    }
    onSave({ type: sessionType, hobbySlug, duration: sessionType === "thought" ? 0 : duration, notes, imageUrl });
    setPhase("saved");
  };

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Auto-close after 4s in saved phase
  useEffect(() => {
    if (phase !== "saved") return;
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, [phase, handleClose]);

  const selectedHobby = hobbies.find((h) => h.slug === hobbySlug);

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
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl border-2 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ borderColor: selectedHobby?.color ?? "var(--secondary)" }}
          >
            <AnimatePresence mode="wait">
              {phase === "saved" ? (
                /* ── Post-session confirmation ── */
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-[var(--green)] mx-auto mb-4 flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </motion.div>
                  <h2 className="!text-xl !font-bold !tracking-normal mb-2">
                    {sessionType === "thought" ? "Thought Logged!" : "Session Logged!"}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {sessionType === "thought"
                      ? "Showing up mentally counts. Your streak lives on!"
                      : "Keep up the great work!"}
                  </p>

                  {activeChallenge && sessionType === "practice" && (
                    <Link
                      href={`/dashboard/challenges/${activeChallenge.id}`}
                      onClick={handleClose}
                      className="inline-block mb-4 text-sm font-semibold text-[var(--secondary)] hover:underline"
                    >
                      Continue with &ldquo;{activeChallenge.title}&rdquo; &rarr;
                    </Link>
                  )}

                  <div>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ── Form phase ── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <h2 className="!text-xl !font-bold !tracking-normal">
                      {sessionType === "thought" ? "Log a Thought" : "Log Practice"}
                    </h2>
                    <button
                      onClick={handleClose}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="px-6 pb-6 space-y-5">
                    {/* Session type toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setSessionType("practice")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${sessionType === "practice"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        I practiced
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionType("thought")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${sessionType === "thought"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        I thought about it
                      </button>
                    </div>

                    {sessionType === "thought" && (
                      <p className="text-xs text-gray-400 text-center -mt-2">
                        Showing up mentally counts toward your streak!
                      </p>
                    )}

                    {/* Hobby selector */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                        Which hobby?
                      </label>
                      {hobbies.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {hobbies.map((h) => (
                            <button
                              key={h.slug}
                              type="button"
                              onClick={() => setHobbySlug(h.slug)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${hobbySlug === h.slug
                                  ? "text-white shadow-sm"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                }`}
                              style={
                                hobbySlug === h.slug
                                  ? { backgroundColor: h.color }
                                  : undefined
                              }
                            >
                              {h.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No active hobbies yet. Explore hobbies first!</p>
                      )}
                    </div>

                    {/* Practice-only fields */}
                    {sessionType === "practice" && (
                      <>
                        {/* Duration slider */}
                        <div>
                          <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                            Duration:{" "}
                            <span
                              className="font-bold"
                              style={{ color: selectedHobby?.color ?? "var(--secondary)" }}
                            >
                              {duration} min
                            </span>
                          </label>
                          <input
                            type="range"
                            min={5}
                            max={180}
                            step={5}
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full accent-[var(--secondary)]"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>5 min</span>
                            <span>3 hrs</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                        {sessionType === "thought" ? "What were you thinking about?" : "Notes"}{" "}
                        <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={
                          sessionType === "thought"
                            ? "A technique you want to try, something that inspired you\u2026"
                            : "What did you work on? How did it go?"
                        }
                        rows={sessionType === "thought" ? 2 : 3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Image upload (practice only) */}
                    {sessionType === "practice" && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                          Photo of your practice{" "}
                          <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        {imagePreview ? (
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs cursor-pointer hover:bg-black/70"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
                          >
                            Tap to add a photo
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Save button */}
                    <button
                      onClick={handleSave}
                      disabled={hobbies.length === 0 || saving}
                      className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: selectedHobby?.color ?? "var(--secondary)" }}
                    >
                      {saving ? "Saving..." : sessionType === "thought" ? "Log Thought" : "Save Session"}
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
