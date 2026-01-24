"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { questions, sections } from "@/lib/quizData";

export type Answers = Record<number, string | string[]>;

export function useQuiz() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActionRef = useRef<"answer" | "navigate" | null>(null);

  /* Questions grouped by section */
  const sectionQuestions = useMemo(
    () => sections.map((s) => questions.filter((q) => q.sectionId === s.id)),
    [],
  );

  /* Does section contain multi or text questions? */
  const hasMultiOrText = useCallback(
    (idx: number) =>
      sectionQuestions[idx].some(
        (q) => q.type === "text" || q.type === "multi",
      ),
    [sectionQuestions],
  );

  /* Is every required question in the section answered? */
  const isSectionComplete = useCallback(
    (idx: number) =>
      sectionQuestions[idx].every((q) => {
        if (q.optional) return true;
        const a = answers[q.id];
        if (!a) return false;
        if (q.type === "multi") return (a as string[]).length > 0;
        if (q.type === "text") return (a as string).trim().length > 0;
        return true;
      }),
    [sectionQuestions, answers],
  );

  const completedSections = useMemo(
    () => sections.map((_, i) => isSectionComplete(i)),
    [isSectionComplete],
  );

  const allComplete = useMemo(
    () => completedSections.every(Boolean),
    [completedSections],
  );

  /* ─── Auto-advance timer helpers ─── */
  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearAutoAdvance(), [clearAutoAdvance]);

  /* Auto-advance when a section is completed via answering */
  useEffect(() => {
    clearAutoAdvance();
    if (isSubmitted) return;
    if (lastActionRef.current !== "answer") return;
    if (!isSectionComplete(activeIndex)) return;
    if (activeIndex >= sections.length - 1) return;

    const delay = hasMultiOrText(activeIndex) ? 1500 : 500;

    autoAdvanceTimer.current = setTimeout(() => {
      lastActionRef.current = null;
      const next = activeIndex + 1;
      setActiveIndex(next);
      setMaxReachedIndex((prev) => Math.max(prev, next));
    }, delay);
  }, [answers, activeIndex, isSubmitted, hasMultiOrText, isSectionComplete, clearAutoAdvance]);

  /* ─── Answer handlers ─── */
  const selectSingle = useCallback((questionId: number, option: string) => {
    lastActionRef.current = "answer";
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }, []);

  const toggleMulti = useCallback((questionId: number, option: string) => {
    lastActionRef.current = "answer";
    setAnswers((prev) => {
      const q = questions.find((qq) => qq.id === questionId)!;
      const current = (prev[questionId] as string[]) || [];
      const max = q.maxSelections;

      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
      if (max && current.length >= max) return prev;
      return { ...prev, [questionId]: [...current, option] };
    });
  }, []);

  const setText = useCallback((questionId: number, value: string) => {
    lastActionRef.current = "answer";
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  /* ─── Navigation ─── */
  const navigateTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx <= maxReachedIndex) {
        lastActionRef.current = "navigate";
        clearAutoAdvance();
        setActiveIndex(idx);
      }
    },
    [maxReachedIndex, clearAutoAdvance],
  );

  /* ─── Submit / Restart ─── */
  const handleSubmit = useCallback(() => setIsSubmitted(true), []);

  const handleRestart = useCallback(() => {
    clearAutoAdvance();
    lastActionRef.current = null;
    setIsSubmitted(false);
    setAnswers({});
    setActiveIndex(0);
    setMaxReachedIndex(0);
  }, [clearAutoAdvance]);

  return {
    activeIndex,
    maxReachedIndex,
    answers,
    isSubmitted,
    sections,
    sectionQuestions,
    completedSections,
    allComplete,
    isSectionComplete,
    selectSingle,
    toggleMulti,
    setText,
    navigateTo,
    handleSubmit,
    handleRestart,
  };
}
