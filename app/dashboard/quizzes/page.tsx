"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuizListItem {
  id: string;
  title: string;
  description: string | null;
  passScore: number;
  _count: { questions: number };
  results: { score: number; passed: boolean }[];
}

export default function QuizzesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((data) => setQuizzes(data.quizzes ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">📝 Testlar</h1>
          <p className="mt-1 text-sm text-slate-500">Bilimingizni sinab ko'ring va natijalaringizni ko'ring.</p>
        </div>

        {isAdmin && (
          <Link href="/admin/quizzes/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-md">
              <PlusCircle className="h-4 w-4" /> 📝 Yangi Test / Savol Yaratish
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quizzes.length === 0 && <p className="text-sm text-slate-500 col-span-2">Hozircha testlar mavjud emas.</p>}
        {quizzes.map((q) => {
          const lastResult = q.results?.[0];
          return (
            <Link key={q.id} href={`/dashboard/quizzes/${q.id}`} className="card p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{q.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{q._count.questions} ta savol · O'tish balli {q.passScore}%</p>
                </div>
                {lastResult && <Badge status={lastResult.passed ? "approved" : "rejected"}>{lastResult.score}%</Badge>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
