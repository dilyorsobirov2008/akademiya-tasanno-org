"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckSquare, Plus, Trash2 } from "lucide-react";

interface Checklist {
  id: string;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  scope: "GLOBAL" | "BRANCH" | "POSITION";
  branch?: { name: string } | null;
  position?: { name: string } | null;
  tasks: { id: string; label: string }[];
  createdAt: string;
}

export default function AdminChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);

  function loadChecklists() {
    fetch("/api/checklists")
      .then((r) => r.json())
      .then((d) => setChecklists(d.checklists ?? []));
  }

  useEffect(() => {
    loadChecklists();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Haqiqatan ham ushbu check-listni o'chirmoqchimisiz?")) return;
    const res = await fetch(`/api/checklists/${id}`, { method: "DELETE" });
    if (res.ok) {
      setChecklists((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">✅ Check-listlar Boshqaruvi (Checklist Manager)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Filiallar va lavozimlar uchun kunlik va haftalik vazifalar ro'yxatini shakllantiring.
          </p>
        </div>
        <Link href="/admin/content/checklists/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Yangi Check-list Yaratish
          </Button>
        </Link>
      </div>

      <div className="card divide-y divide-slate-100 p-0">
        <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Mavjud Check-listlar ({checklists.length})</h2>
        </div>
        {checklists.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {c.frequency === "DAILY" ? "Kunlik" : "Haftalik"}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {c.scope === "GLOBAL" ? "🌐 Global" : c.scope === "BRANCH" ? `🏢 ${c.branch?.name}` : `💼 ${c.position?.name}`}
                  </span>
                  <span>Vazifalar soni: <strong>{c.tasks?.length ?? 0} ta</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {checklists.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">Hali hech qanday check-list yaratilmagan.</div>
        )}
      </div>
    </div>
  );
}
