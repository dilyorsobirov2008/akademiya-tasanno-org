"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface BranchStat {
  branch: string;
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  avgQuizScore: number;
  quizAttempts: number;
  completedChecklists: number;
}

export default function AdminStatsPage() {
  const [branchStats, setBranchStats] = useState<BranchStat[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setBranchStats(data.branchStats ?? []);
        setTotals(data.totals ?? {});
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Yuklanmoqda...</p>;

  const summaryCards = [
    { label: "Jami xodimlar", value: totals.totalUsers ?? 0, color: "text-blue-600" },
    { label: "Tasdiq kutmoqda", value: totals.pendingApprovals ?? 0, color: "text-amber-600" },
    { label: "Yo'riqnomalar", value: totals.totalGuides ?? 0, color: "text-red-600" },
    { label: "Videolar", value: totals.totalVideos ?? 0, color: "text-purple-600" },
    { label: "Testlar", value: totals.totalQuizzes ?? 0, color: "text-indigo-600" },
    { label: "Check-listlar", value: totals.totalChecklists ?? 0, color: "text-emerald-600" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Statistik Panel</h1>
      <p className="mt-1 text-sm text-slate-500">Filiallar kesimida umumiy ko'rsatkichlar</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Filiallar bo'yicha xodimlar soni</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="approvedUsers" name="Tasdiqlangan" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pendingUsers" name="Kutilmoqda" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Filiallar bo'yicha o'rtacha test natijasi (%)</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="avgQuizScore" name="O'rtacha ball" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
