"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus, Trash2 } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  passScore: number;
  scope: "GLOBAL" | "BRANCH" | "POSITION";
  branch?: { name: string } | null;
  position?: { name: string } | null;
  _count?: { questions: number };
  createdAt: string;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  function loadQuizzes() {
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((d) => setQuizzes(d.quizzes ?? []));
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Haqiqatan ham ushbu testni o'chirmoqchimisiz?")) return;
    const res = await fetch(`/api/quizzes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📝 Testlar va Savollar (Quiz Builder)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Xodimlarning bilimini baholash uchun dinamik test va savollarni yaratish.
          </p>
        </div>
        <Link href="/admin/content/quizzes/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Yangi Test Yaratish
          </Button>
        </Link>
      </div>

      <div className="card divide-y divide-slate-100 p-0">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Barcha Test To'plamlari ({quizzes.length})</h2>
        </div>
        {quizzes.map((q) => (
          <div key={q.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{q.title}</p>
                {q.description && <p className="text-xs text-slate-500 line-clamp-1">{q.description}</p>}
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {q.scope === "GLOBAL" ? "🌐 Global" : q.scope === "BRANCH" ? `🏢 ${q.branch?.name}` : `💼 ${q.position?.name}`}
                  </span>
                  <span>O'tish bali: <strong className="text-amber-600">{q.passScore}%</strong></span>
                  <span>Savollar soni: <strong>{q._count?.questions ?? 0} ta</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDelete(q.id)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">Hali hech qanday test to'plami yaratilmagan.</div>
        )}
      </div>
    </div>
  );
}
