"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  label: string;
}
interface Entry {
  id: string;
  completed: boolean;
  items: { taskId: string; done: boolean }[];
}
interface ChecklistItem {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  tasks: Task[];
  entries: Entry[];
}

const today = new Date().toISOString().slice(0, 10);

export default function ChecklistsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/checklists?periodDate=${today}`)
      .then((r) => r.json())
      .then((data) => {
        const list: ChecklistItem[] = data.checklists ?? [];
        setChecklists(list);
        const initial: Record<string, Record<string, boolean>> = {};
        for (const c of list) {
          const entry = c.entries?.[0];
          initial[c.id] = {};
          for (const t of c.tasks) {
            initial[c.id][t.id] = entry?.items.find((i) => i.taskId === t.id)?.done ?? false;
          }
        }
        setChecked(initial);
      });
  }, []);

  function toggle(checklistId: string, taskId: string) {
    setChecked((prev) => ({
      ...prev,
      [checklistId]: { ...prev[checklistId], [taskId]: !prev[checklistId]?.[taskId] },
    }));
  }

  async function save(checklistId: string) {
    setSaving(checklistId);
    setSavedMsg(null);
    const items = Object.entries(checked[checklistId] ?? {}).map(([taskId, done]) => ({ taskId, done }));

    const res = await fetch(`/api/checklists/${checklistId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodDate: today, items }),
    });
    setSaving(null);
    if (res.ok) setSavedMsg(checklistId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">✅ Check-listlar</h1>
          <p className="mt-1 text-sm text-slate-500">Bugungi ({today}) bajarilishi lozim bo'lgan kunlik vazifalaringiz.</p>
        </div>

        {isAdmin && (
          <Link href="/admin/checklists/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-md">
              <PlusCircle className="h-4 w-4" /> ✅ Yangi Check-list Qo'shish
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {checklists.length === 0 && <p className="text-sm text-slate-500">Hozircha check-listlar mavjud emas.</p>}
        {checklists.map((c) => (
          <div key={c.id} className="card p-5 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{c.title}</p>
              <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100">
                {c.frequency === "DAILY" ? "Kunlik" : "Haftalik"}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {c.tasks.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 transition"
                >
                  <input
                    type="checkbox"
                    className="accent-indigo-600 h-4 w-4 rounded cursor-pointer"
                    checked={checked[c.id]?.[t.id] ?? false}
                    onChange={() => toggle(c.id, t.id)}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" onClick={() => save(c.id)} disabled={saving === c.id} className="bg-indigo-600 hover:bg-indigo-700">
                {saving === c.id ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
              {savedMsg === c.id && <span className="text-sm font-medium text-emerald-600">Saqlandi ✓</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
