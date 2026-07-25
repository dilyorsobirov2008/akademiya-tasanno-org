"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";

interface OptionInput {
  text: string;
  isCorrect: boolean;
}

interface QuestionInput {
  text: string;
  options: OptionInput[];
}

interface Item {
  id: string;
  name: string;
}

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passScore, setPassScore] = useState<number>(70);
  const [scope, setScope] = useState<"GLOBAL" | "BRANCH" | "POSITION">("GLOBAL");
  const [branchId, setBranchId] = useState("");
  const [positionId, setPositionId] = useState("");

  const [branches, setBranches] = useState<Item[]>([]);
  const [positions, setPositions] = useState<Item[]>([]);

  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      text: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches ?? []));
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => setPositions(d.positions ?? []));
  }, []);

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  }

  function removeQuestion(qIdx: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  }

  function updateQuestionText(qIdx: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].text = text;
      return copy;
    });
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options.push({ text: "", isCorrect: false });
      return copy;
    });
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIdx].options.length <= 2) return copy;
      copy[qIdx].options = copy[qIdx].options.filter((_, idx) => idx !== oIdx);
      return copy;
    });
  }

  function updateOptionText(qIdx: number, oIdx: number, text: string) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[oIdx].text = text;
      return copy;
    });
  }

  function setCorrectOption(qIdx: number, oIdx: number) {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options = copy[qIdx].options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === oIdx,
      }));
      return copy;
    });
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Test sarlavhasini kiriting");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`${i + 1}-savol matni bo'sh!`);
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        setError(`${i + 1}-savoldagi variant matni bo'sh!`);
        return;
      }
      if (!q.options.some((o) => o.isCorrect)) {
        setError(`${i + 1}-savol uchun to'g'ri javobni belgilang!`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          passScore: Number(passScore),
          scope,
          branchId: scope === "BRANCH" ? branchId : null,
          positionId: scope === "POSITION" ? positionId : null,
          questions: questions.map((q, idx) => ({
            text: q.text,
            order: idx,
            options: q.options,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Testni saqlashda xatolik");

      router.push("/admin/content/quizzes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Server xatosi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🧩 Quiz Builder (Test Konstruktori)</h1>
          <p className="text-sm text-slate-500">Test sarlavhasi, o'tish bali, savollar va to'g'ri javob variantlarini kiriting.</p>
        </div>
      </div>

      {/* Asosiy sozlamalar */}
      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">1. Test Sozlamalari</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Test Sarlavhasi</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Kassirlik ko'nikmalari bo'yicha yakuniy test" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Qisqacha Izoh (ixtiyoriy)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Test nima haqida va ko'rsatmalar" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">O'tish Balli (Pass Score %)</label>
            <Input type="number" min={10} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ko'lam (Scope)</label>
            <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="GLOBAL">🌐 Barcha filial va lavozimlar (Global)</option>
              <option value="BRANCH">🏢 Faqat ma'lum bir filial uchun</option>
              <option value="POSITION">💼 Faqat ma'lum bir lavozim uchun</option>
            </select>
          </div>

          {scope === "BRANCH" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Filial</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Filialni tanlang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          {scope === "POSITION" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lavozim</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" value={positionId} onChange={(e) => setPositionId(e.target.value)}>
                <option value="">Lavozimni tanlang</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Savollar va Variantlar */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">2. Savollar va Variantlar ({questions.length} ta)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            <Plus className="h-4 w-4 mr-1" /> Savol Qo'shish
          </Button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="card p-6 space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-indigo-600">Savol #{qIdx + 1}</span>
              {questions.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Input
                value={q.text}
                onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                placeholder="Savol matnini kiriting..."
                className="font-medium"
              />
            </div>

            {/* Variantlar */}
            <div className="space-y-2 pl-4 border-l-2 border-slate-100">
              <p className="text-xs font-medium text-slate-500 uppercase">Javob Variantlari (To'g'risini radio orqali tanlang)</p>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={opt.isCorrect}
                    onChange={() => setCorrectOption(qIdx, oIdx)}
                    className="h-4 w-4 text-indigo-600 cursor-pointer"
                  />
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                    placeholder={`Variant ${oIdx + 1}`}
                    className={`text-sm ${opt.isCorrect ? "border-emerald-500 bg-emerald-50/30" : ""}`}
                  />
                  {q.options.length > 2 && (
                    <Button variant="ghost" size="sm" onClick={() => removeOption(qIdx, oIdx)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}

              <Button type="button" variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="text-xs text-indigo-600 mt-1">
                + Variant qo'shish
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 min-w-[140px]">
          {submitting ? "Saqlanmoqda..." : "Testni Saqlash"}
        </Button>
      </div>
    </div>
  );
}
