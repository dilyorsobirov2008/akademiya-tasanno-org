"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, Download, ExternalLink, ShieldCheck, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Guide {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  scope: string;
  branch?: { name: string } | null;
  position?: { name: string } | null;
}

export default function GuidesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [guides, setGuides] = useState<Guide[]>([]);
  const [active, setActive] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((data) => {
        setGuides(data.guides ?? []);
        setActive(data.guides?.[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Admin Creation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📄 Yo'riqnomalar (PDF Guides)</h1>
          <p className="mt-1 text-sm text-slate-500">Lavozimingiz va filialingiz bo'yicha tasdiqlangan yo'riqnomalar ro'yxati</p>
        </div>

        {isAdmin && (
          <Link href="/admin/guides">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 shadow-md">
              <PlusCircle className="h-4 w-4" /> 📄 Yangi PDF Yo'riqnoma Qo'shish
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chap panel: Yo'riqnomalar ro'yxati */}
        <div className="card divide-y divide-slate-100 p-0 lg:col-span-4">
          <div className="p-4 bg-slate-50/50 border-b flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 text-sm">Mavjud Hujjatlar ({guides.length})</h2>
          </div>
          {guides.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">Sizga biriktirilgan yo'riqnomalar yo'q</div>
          )}
          {guides.map((g) => (
            <button
              key={g.id}
              onClick={() => setActive(g)}
              className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50 ${
                active?.id === g.id ? "bg-indigo-50/80 border-l-4 border-l-indigo-600" : ""
              }`}
            >
              <div className={`p-2 rounded-lg ${active?.id === g.id ? "bg-indigo-600 text-white" : "bg-red-50 text-red-600"}`}>
                <FileText className="h-5 w-5 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">{g.title}</p>
                {g.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{g.description}</p>}
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                  {g.scope === "GLOBAL" ? "🌐 Global" : g.scope === "BRANCH" ? `🏢 ${g.branch?.name}` : `💼 ${g.position?.name}`}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* O'ng panel: Embedded PDF Viewer */}
        <div className="card lg:col-span-8 p-0 overflow-hidden flex flex-col min-h-[650px]">
          {active ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 p-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">{active.title}</h3>
                  {active.description && <p className="text-xs text-slate-500 mt-0.5">{active.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <a href={active.fileUrl} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="gap-1 text-slate-700">
                      <ExternalLink className="h-4 w-4" /> Ochish
                    </Button>
                  </a>
                  <a href={active.fileUrl} download>
                    <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                      <Download className="h-4 w-4" /> Yuklab olish
                    </Button>
                  </a>
                </div>
              </div>

              {/* PDF Preview container */}
              <div className="flex-1 bg-slate-900/5 min-h-[550px] relative">
                <iframe
                  src={active.fileUrl}
                  className="w-full h-full min-h-[550px] border-0"
                  title={active.title}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-400">
              <ShieldCheck className="h-12 w-12 text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">Ko'rish uchun yo'riqnomani tanlang</p>
              <p className="text-xs text-slate-400 mt-1">Chap tarafdagi ro'yxatdan kerakli PDF faylni bosing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
