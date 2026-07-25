"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowLeft, AlertCircle } from "lucide-react";

interface Item {
  id: string;
  name: string;
}

export default function NewChecklistPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY">("DAILY");
  const [scope, setScope] = useState<"GLOBAL" | "BRANCH" | "POSITION">("GLOBAL");
  const [branchId, setBranchId] = useState("");
  const [positionId, setPositionId] = useState("");

  const [branches, setBranches] = useState<Item[]>([]);
  const [positions, setPositions] = useState<Item[]>([]);

  const [tasks, setTasks] = useState<{ label: string; order: number }[]>([
    { label: "", order: 0 },
    { label: "", order: 1 },
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

  function addTask() {
    setTasks((prev) => [...prev, { label: "", order: prev.length }]);
  }

  function removeTask(idx: number) {
    if (tasks.length <= 1) return;
    setTasks((prev) => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, order: i })));
  }

  function updateTask(idx: number, label: string) {
    setTasks((prev) => {
      const copy = [...prev];
      copy[idx].label = label;
      return copy;
    });
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Check-list nomini kiriting");
      return;
    }
    if (tasks.some((t) => !t.label.trim())) {
      setError("Barcha vazifalar matnini to'ldiring");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          frequency,
          scope,
          branchId: scope === "BRANCH" ? branchId : null,
          positionId: scope === "POSITION" ? positionId : null,
          tasks,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Check-list saqlashda xatolik");

      router.push("/admin/content/checklists");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Server xatosi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">✅ Checklist Builder (Konstruktor)</h1>
          <p className="text-sm text-slate-500">Filial yoki lavozim uchun kunlik/haftalik topshiriqlar ro'yxatini yarating.</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">1. Umumiy Sozlamalar</h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Check-list Nomi</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Kassirning kunlik ochilish vazifalari" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Davriyligi (Frequency)</label>
            <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
              <option value="DAILY">📅 Kunlik vazifalar</option>
              <option value="WEEKLY">📆 Haftalik vazifalar</option>
            </select>
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

      <div className="card p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-slate-800">2. Vazifalar Ro'yxati ({tasks.length} ta)</h2>
          <Button type="button" variant="outline" size="sm" onClick={addTask} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <Plus className="h-4 w-4 mr-1" /> Vazifa Qo'shish
          </Button>
        </div>

        <div className="space-y-3">
          {tasks.map((t, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400 w-6 text-right">#{idx + 1}</span>
              <Input
                value={t.label}
                onChange={(e) => updateTask(idx, e.target.value)}
                placeholder={`Vazifa #${idx + 1} tavsifi...`}
                className="text-sm"
              />
              {tasks.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeTask(idx)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
          {submitting ? "Saqlanmoqda..." : "Check-listni Saqlash"}
        </Button>
      </div>
    </div>
  );
}
