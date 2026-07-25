"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
}
interface Question {
  id: string;
  text: string;
  options: Option[];
}
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  passScore: number;
  questions: Question[];
}

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then((r) => r.json())
      .then((data) => setQuiz(data.quiz));
  }, [id]);

  async function handleSubmit() {
    if (!quiz) return;
    if (Object.keys(answers).length < quiz.questions.length) {
      setError("Iltimos barcha savollarga javob bering");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/quizzes/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(json.error ?? "Xatolik yuz berdi");
      return;
    }
    setResult(json.result);
  }

  if (!quiz) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;

  if (result) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-4xl font-bold" style={{ color: result.passed ? "#059669" : "#dc2626" }}>
          {result.score}%
        </p>
        <p className="mt-2 text-slate-600">
          {result.correct} / {result.total} savolga to'g'ri javob berdingiz
        </p>
        <p className="mt-1 font-medium">{result.passed ? "✅ Testdan o'tdingiz!" : "❌ O'ta olmadingiz"}</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard/quizzes")}>
          Testlar ro'yxatiga qaytish
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
      {quiz.description && <p className="mt-1 text-sm text-slate-500">{quiz.description}</p>}

      <div className="mt-6 space-y-5">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="card p-5">
            <p className="font-medium text-slate-900">
              {idx + 1}. {q.text}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    answers[q.id] === o.id ? "border-blue-500 bg-blue-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="accent-blue-600"
                    checked={answers[q.id] === o.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                  />
                  {o.text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Button className="mt-6 w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Yuborilmoqda..." : "Testni yakunlash"}
      </Button>
    </div>
  );
}
