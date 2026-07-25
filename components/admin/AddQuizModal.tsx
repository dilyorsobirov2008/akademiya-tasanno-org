"use client";

import { useState } from "react";
import {
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveVideoQuizAction, QuestionInput } from "@/app/actions/admin-quiz";

interface AddQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  videoOrder: number;
  existingQuizId?: string | null;
  onSaved?: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

function makeEmptyQuestion(): { text: string; options: { text: string }[]; correctIndex: number } {
  return {
    text: "",
    options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
    correctIndex: 0,
  };
}

export default function AddQuizModal({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  videoOrder,
  existingQuizId,
  onSaved,
}: AddQuizModalProps) {
  const [passScore, setPassScore] = useState(80);
  const [questions, setQuestions] = useState(() =>
    Array.from({ length: 10 }, () => makeEmptyQuestion())
  );
  const [expandedIdx, setExpandedIdx] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // ─── Helpers ────────────────────────────────────────
  function setQuestionText(qIdx: number, text: string) {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], text };
      return next;
    });
  }

  function setOptionText(qIdx: number, optIdx: number, text: string) {
    setQuestions((prev) => {
      const next = [...prev];
      const newOpts = [...next[qIdx].options];
      newOpts[optIdx] = { text };
      next[qIdx] = { ...next[qIdx], options: newOpts };
      return next;
    });
  }

  function setCorrectIndex(qIdx: number, correctIndex: number) {
    setQuestions((prev) => {
      const next = [...prev];
      next[qIdx] = { ...next[qIdx], correctIndex };
      return next;
    });
  }

  function resetForm() {
    setQuestions(Array.from({ length: 10 }, () => makeEmptyQuestion()));
    setPassScore(80);
    setResult(null);
    setExpandedIdx(0);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, makeEmptyQuestion()]);
    setExpandedIdx(questions.length);
  }

  function removeQuestion(qIdx: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
    setExpandedIdx((prev) => Math.max(0, prev > qIdx ? prev - 1 : prev));
  }

  // ─── Submit ─────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setResult(null);

    const payload: QuestionInput[] = questions.map((q) => ({
      text: q.text,
      options: q.options.map((opt, optIdx) => ({
        text: opt.text,
        isCorrect: optIdx === q.correctIndex,
      })),
    }));

    const res = await saveVideoQuizAction({
      videoId,
      passScore,
      questions: payload,
    });

    setSaving(false);

    if (res.success) {
      setResult({ type: "success", message: "Test muvaffaqiyatli saqlandi! Video darslikka biriktirildi." });
      onSaved?.();
    } else {
      setResult({ type: "error", message: res.error ?? "Xatolik yuz berdi." });
    }
  }

  // ─── Check completeness ─────────────────────────────
  const filledCount = questions.filter(
    (q) => q.text.trim() && q.options.every((o) => o.text.trim())
  ).length;
  const isReady = filledCount === questions.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-6 flex flex-col max-h-[94vh]">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {existingQuizId ? "Testni Tahrirlash" : "Yangi Test Qo'shish"}
              </span>
            </div>
            <h2 className="font-bold text-lg leading-snug">
              {videoOrder}-Qism: {videoTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {questions.length} ta savol · Minimal o'tish bali:{" "}
              <strong className="text-amber-300">{passScore}%</strong> (
              {Math.ceil((passScore / 100) * questions.length)}/{questions.length})
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Settings Row ── */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
              O'tish Bali (%):
            </label>
            <input
              type="number"
              min={10}
              max={100}
              step={10}
              value={passScore}
              onChange={(e) => setPassScore(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400 flex-1">
            Xodim kamida {Math.ceil((passScore / 100) * questions.length)}/{questions.length} ta to'g'ri javob
            berishi kerak.
          </span>
          <button
            onClick={resetForm}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tozalash
          </button>
        </div>

        {/* ── Result Banner ── */}
        {result && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 text-sm shrink-0 ${
              result.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-rose-50 border-rose-300 text-rose-900"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="font-semibold leading-snug">{result.message}</p>
          </div>
        )}

        {/* ── Questions List (Accordion) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {questions.map((q, qIdx) => {
            const isOpen = expandedIdx === qIdx;
            const isFilled = q.text.trim() && q.options.every((o) => o.text.trim());

            return (
              <div
                key={qIdx}
                className={`border rounded-xl overflow-hidden transition ${
                  isFilled
                    ? "border-emerald-200 bg-emerald-50/40"
                    : isOpen
                    ? "border-indigo-300 bg-indigo-50/40"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedIdx(isOpen ? -1 : qIdx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        isFilled
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isFilled ? "✓" : qIdx + 1}
                    </span>
                    <p className={`text-sm font-semibold ${q.text ? "text-slate-900" : "text-slate-400 italic"}`}>
                      {q.text || `${qIdx + 1}-savol matnini kiriting...`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {questions.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(qIdx);
                        }}
                        className="text-xs text-slate-400 hover:text-rose-600 transition px-1"
                        title="Savolni o'chirish"
                      >
                        ✕
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
                    {/* Question Text */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        Savol Matni *
                      </label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => setQuestionText(qIdx, e.target.value)}
                        placeholder={`${qIdx + 1}-savol matnini kiriting...`}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Options 2×2 Grid */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-2">
                        Javob Variantlari (4 ta) — To'g'ri javobni radio orqali belgilang:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctIndex === optIdx;
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-400 shadow-sm"
                                  : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              {/* Radio: mark correct */}
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isCorrect}
                                onChange={() => setCorrectIndex(qIdx, optIdx)}
                                className="accent-emerald-600 h-4 w-4 shrink-0 cursor-pointer"
                                title="To'g'ri javob"
                              />
                              {/* Option letter badge */}
                              <span
                                className={`text-xs font-black w-6 shrink-0 ${
                                  isCorrect ? "text-emerald-700" : "text-slate-500"
                                }`}
                              >
                                {OPTION_LETTERS[optIdx]}:
                              </span>
                              {/* Option text input */}
                              <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => setOptionText(qIdx, optIdx, e.target.value)}
                                placeholder={`Variant ${OPTION_LETTERS[optIdx]}...`}
                                className={`flex-1 min-w-0 px-2 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white ${
                                  isCorrect
                                    ? "border-emerald-300 font-semibold text-emerald-900"
                                    : "border-slate-200 text-slate-700"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      {q.correctIndex !== undefined && (
                        <p className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          To'g'ri javob: {OPTION_LETTERS[q.correctIndex]} — variant
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add More Questions */}
          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-2.5 border-2 border-dashed border-indigo-200 text-indigo-500 text-xs font-semibold rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition"
          >
            + Yana savol qo'shish
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isReady ? "bg-emerald-400" : "bg-slate-300"
              }`}
              style={{ width: `${Math.round((filledCount / questions.length) * 80)}px` }}
            />
            <span className="text-xs text-slate-500 font-medium">
              {filledCount}/{questions.length} savol to'ldirilgan
            </span>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="text-xs">
              Bekor Qilish
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !isReady}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 gap-2 min-w-36"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {existingQuizId ? "Testni Yangilash" : "Testni Saqlash"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
