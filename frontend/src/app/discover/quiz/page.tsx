"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { saveQuizResponses } from "@/app/actions/quiz";
import { QuizFlow } from "@/components/discover/quiz/QuizFlow";
import type { Answers } from "@/lib/hooks/useQuiz";

export default function QuizPage() {
  const router = useRouter();

  const handleComplete = useCallback(
    async (answers: Answers) => {
      const responses = Object.entries(answers)
        .map(([qId, answer]) => ({
          questionId: Number(qId),
          answer: Array.isArray(answer)
            ? answer.filter((v) => v.trim().length > 0)
            : [answer],
        }))
        .filter((r) => r.answer.length > 0);

      try {
        const result = await saveQuizResponses(responses);
        if (result?.error) {
          console.error("Quiz save error:", result.error);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          // Server action aborted — retry once without abort risk
          try {
            await saveQuizResponses(responses);
          } catch {
            // best-effort, navigate regardless
          }
        } else {
          console.error("Failed to save quiz data:", e);
        }
      }

      router.push("/discover/quiz/analyzing");
    },
    [router],
  );

  return <QuizFlow onComplete={handleComplete} />;
}
