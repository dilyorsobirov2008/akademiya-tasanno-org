"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  HelpCircle,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Save,
  Loader2,
  FileQuestion,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Branch {
  id: string;
  name: string;
}

interface Position {
  id: string;
  name: string;
}

interface QuestionFormState {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export default function AdminCreateVideoPage() {
  const router = useRouter();

  // Step state: 1 = Video Form, 2 = 10-Question Quiz Builder
  const [step, setStep] = useState<1 | 2>(1);

  // Loading & Data states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video Form state
  const [title, setTitle] = useState("1-qism: Kompaniya qoidalari");
  const [order, setOrder] = useState<number>(1);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [thumbnail, setThumbnail] = useState("");
  const [description, setDescription] = useState("1-qism darsligi va unga biriktirilgan 10 talik test.");
  const [scope, setScope] = useState<"GLOBAL" | "BRANCH" | "POSITION">("GLOBAL");
  const [branchId, setBranchId] = useState("");
  const [positionId, setPositionId] = useState("");

  // Quiz Builder state (10 Questions default)
  const initialQuestions: QuestionFormState[] = Array.from({ length: 10 }, (_, i) => ({
    text: `${i + 1}-savol: ${i + 1}-qism darsligi bo'yicha asosiy tushunchani belgilang.`,
    options: [
      `To'g'ri javob varianti A (${i + 1}-savol)`,
      `Noto'g'ri javob varianti B (${i + 1}-savol)`,
      `Noto'g'ri javob varianti C (${i + 1}-savol)`,
      `Noto'g mezoniy javob varianti D (${i + 1}-savol)`,
    ],
    correctIndex: 0,
  }));

  const [questions, setQuestions] = useState<QuestionFormState[]>(initialQuestions);

  useEffect(() => {
    // Load branches & positions
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data.branches || []))
      .catch((err) => console.error(err));

    fetch("/api/positions")
      .then((res) => res.json())
      .then((data) => setPositions(data.positions || []))
      .catch((err) => console.error(err));
  }, []);

  function handleQuestionTextChange(qIndex: number, text: string) {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], text };
      return updated;
    });
  }

  function handleOptionTextChange(qIndex: number, optIndex: number, text: string) {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options] as [string, string, string, string];
      newOpts[optIndex] = text;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return updated;
    });
  }

  function handleCorrectIndexChange(qIndex: number, correctIndex: number) {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correctIndex };
      return updated;
    });
  }

  async function handleSubmitAll() {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formattedQuestions = questions.map((q) => ({
        text: q.text,
        options: q.options.map((optText, idx) => ({
          text: optText,
          isCorrect: idx === q.correctIndex,
        })),
      }));

      const payload = {
        title,
        order,
        videoUrl,
        thumbnail: thumbnail || null,
        description,
        scope,
        branchId: scope === "BRANCH" ? branchId : null,
        positionId: scope === "POSITION" ? positionId : null,
        quiz: {
          title: `${title} — 10 talik Test`,
          passScore: 80,
          questions: formattedQuestions,
        },
      };

      const res = await fetch("/api/admin/videos/create-with-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Video va test saqlashda xatolik yuz berdi");
      }

      router.push("/admin/videos");
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/videos">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" /> Orqaga
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">🎥 Yangi Video Darslik & Test Qo'shish</h1>
            <p className="text-xs text-slate-500">
              Video qismini yuklang va unga biriktiriladigan 10 talik testni shakllantiring.
            </p>
          </div>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 1 ? "bg-indigo-600 text-white" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            1. Video Ma'lumotlari
          </span>
          <span>→</span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            2. 10 talik Test Konstruktori
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: VIDEO LESSON DETAILS FORM */}
      {step === 1 && (
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-600" /> Video Qismi Parametrlari
            </h2>
            <span className="text-xs text-slate-400 font-medium">Bosqich 1 / 2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Video Darslik Nomi *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: 1-qism: Kompaniya ichki qoidalari"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Part Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Qism Tartibi (Part Number) *</label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Qamrov Doirasi (Scope) *</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="GLOBAL">🌐 Umumiy (Barchaga)</option>
                <option value="BRANCH">🏢 Aniq Filial Uchun</option>
                <option value="POSITION">💼 Aniq Lavozim Uchun</option>
              </select>
            </div>

            {/* Branch select if BRANCH */}
            {scope === "BRANCH" && (
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700">Filialni Tanlang *</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Filialni tanlang --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Position select if POSITION */}
            {scope === "POSITION" && (
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700">Lavozimni Tanlang *</label>
                <select
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Lavozimni tanlang --</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Video URL */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Video Link / Stream URL *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://... yoki Cloudflare Stream / YouTube link"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Qisqacha Izoh (Tavsif)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Darslik va test haqida qisqacha ma'lumot..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <Button
              type="button"
              onClick={() => {
                if (!title || !videoUrl) {
                  setErrorMessage("Iltimos, video nomi va linkini kiriting.");
                  return;
                }
                setErrorMessage(null);
                setStep(2);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 gap-2 rounded-xl shadow-md"
            >
              <FileQuestion className="h-4 w-4" /> 📝 Ushbu Video Uchun 10 talik Test Yaratish →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: 10-QUESTION QUIZ BUILDER */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-indigo-900 text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> 10 talik Test Konstruktori ({title})
              </h2>
              <p className="text-xs text-indigo-700 mt-1">
                Har bir savol uchun 4 ta variant va 1 ta to'g'ri javobni (Radio tugma) belgilang. Minimal o'tish balli: 80% (8/10).
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="text-xs border-indigo-300 text-indigo-800 hover:bg-indigo-100 shrink-0"
            >
              ← Video Ma'lumotlarini Tahrirlash
            </Button>
          </div>

          {/* Questions Accordion / List */}
          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold">
                    {qIdx + 1}-SAVOL (10 dan)
                  </span>
                  <span className="text-xs text-slate-400 font-medium">To'g'ri javob varianti radio orqali tanlanadi</span>
                </div>

                {/* Question Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Savol Matni *</label>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder={`${qIdx + 1}-savol matnini kiriting...`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Options 4 Grid */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-600 block">Javob Variantlari (4 ta):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((optText, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                            isCorrect
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-option-${qIdx}`}
                            checked={isCorrect}
                            onChange={() => handleCorrectIndexChange(qIdx, optIdx)}
                            className="accent-emerald-600 h-4 w-4 shrink-0 cursor-pointer"
                            title="To'g'ri javob sifatida belgilash"
                          />
                          <span className="text-xs font-bold w-6 text-slate-500">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Variant ${String.fromCharCode(65 + optIdx)}...`}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                            required
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Submit Buttons */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-xl border border-slate-700">
            <div>
              <p className="font-bold text-sm">Barcha 10 ta Savol Va Video Darslikni Saqlash</p>
              <p className="text-xs text-slate-400">
                1-qism saqlangach, xodimlar u bo'yicha test topshirib 2-qismni ochishlari mumkin bo'ladi.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleSubmitAll}
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs px-8 py-3 rounded-xl gap-2 shadow-lg w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> 💾 Video Darslik Va 10 talik Testni Saqlash
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
