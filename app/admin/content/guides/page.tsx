"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Link as LinkIcon, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(2, "Sarlavha kiritilishi shart"),
  description: z.string().optional(),
  fileUrl: z.string().min(1, "PDF manbali yoki fayl URL kiritilishi shart"),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof formSchema>;

interface Guide {
  id: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  scope: "GLOBAL" | "BRANCH" | "POSITION";
  branch?: { name: string } | null;
  position?: { name: string } | null;
  createdAt: string;
}

interface Item {
  id: string;
  name: string;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [branches, setBranches] = useState<Item[]>([]);
  const [positions, setPositions] = useState<Item[]>([]);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { scope: "GLOBAL", fileUrl: "" },
  });

  const scope = watch("scope");
  const currentFileUrl = watch("fileUrl");

  function loadGuides() {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((data) => setGuides(data.guides ?? []));
  }

  useEffect(() => {
    loadGuides();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches ?? []));
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => setPositions(d.positions ?? []));
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage({ type: "error", text: "Faqat PDF formatdagi fayllarni yuklash mumkin!" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fayl yuklashda xatolik");

      setValue("fileUrl", json.fileUrl, { shouldValidate: true });
      setMessage({ type: "success", text: "Fayl muvaffaqiyatli yuklandi!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Xatolik yuz berdi" });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setMessage(null);
    const res = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: json.error ?? "Xatolik yuz berdi" });
      return;
    }
    setMessage({ type: "success", text: "PDF Yo'riqnoma muvaffaqiyatli yaratildi!" });
    reset({ scope: "GLOBAL", fileUrl: "", title: "", description: "" });
    loadGuides();
  }

  async function handleDelete(id: string) {
    if (!confirm("Haqiqatan ham bu yo'riqnomani o'chirmoqchimisiz?")) return;
    const res = await fetch(`/api/guides/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGuides((prev) => prev.filter((g) => g.id !== id));
      setMessage({ type: "success", text: "Yo'riqnoma o'chirildi" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📄 Yo'riqnomalarni boshqarish (PDF Guides)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Xodimlar uchun PDF yo'riqnomalar yuklang yoki havola kiriting, filial hamda lavozimlarga biriktiring.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Yaratish formasi */}
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-800">Yangi PDF qo'shish</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Yo'riqnoma sarlavhasi</label>
            <Input {...register("title")} placeholder="Masalan: Kassirning kunlik amaliyot qo'llanmasi" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Qisqacha tavsif (ixtiyoriy)</label>
            <Input {...register("description")} placeholder="Qoidalar va talablar haqida qisqacha" />
          </div>

          {/* Fayl yuklash yoki URL rejimi */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">PDF fayli</label>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`rounded-md px-2.5 py-1 ${uploadMode === "file" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  <Upload className="inline-block mr-1 h-3 w-3" /> Fayl yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`rounded-md px-2.5 py-1 ${uploadMode === "url" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  <LinkIcon className="inline-block mr-1 h-3 w-3" /> URL kiritish
                </button>
              </div>
            </div>

            {uploadMode === "file" ? (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center transition">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileText className="mx-auto h-8 w-8 text-indigo-500 mb-1" />
                <p className="text-xs font-medium text-slate-700">
                  {uploading ? "Yuklanmoqda..." : currentFileUrl ? "Fayl biriktirildi ✓" : "Kompyuterdan PDF tanlang"}
                </p>
                {currentFileUrl && <p className="mt-1 text-[11px] text-emerald-600 truncate">{currentFileUrl}</p>}
              </div>
            ) : (
              <div>
                <Input {...register("fileUrl")} placeholder="https://domain.uz/guide.pdf" />
              </div>
            )}
            {errors.fileUrl && <p className="mt-1 text-xs text-red-600">{errors.fileUrl.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ko'lam (Scope)</label>
            <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" {...register("scope")}>
              <option value="GLOBAL">🌐 Barcha filial va lavozimlar (Global)</option>
              <option value="BRANCH">🏢 Faqat ma'lum bir filial uchun</option>
              <option value="POSITION">💼 Faqat ma'lum bir lavozim uchun</option>
            </select>
          </div>

          {scope === "BRANCH" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Filialni tanlang</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" {...register("branchId")}>
                <option value="">Filialni tanlang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === "POSITION" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lavozimni tanlang</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" {...register("positionId")}>
                <option value="">Lavozimni tanlang</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || uploading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? "Saqlanmoqda..." : "Yo'riqnomani Qo'shish"}
          </Button>
        </form>

        {/* Mavjud yo'riqnomalar ro'yxati */}
        <div className="card divide-y divide-slate-100 p-0 lg:col-span-7">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Mavjud yo'riqnomalar ({guides.length})</h2>
          </div>
          {guides.map((g) => (
            <div key={g.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <a href={g.fileUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-900 hover:underline">
                    {g.title}
                  </a>
                  {g.description && <p className="text-xs text-slate-500 line-clamp-1">{g.description}</p>}
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {g.scope === "GLOBAL" ? "🌐 Global" : g.scope === "BRANCH" ? `🏢 ${g.branch?.name}` : `💼 ${g.position?.name}`}
                    </span>
                    <span>• {new Date(g.createdAt).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDelete(g.id)} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {guides.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">Hali hech qanday PDF yo'riqnoma qo'shilmagan.</div>
          )}
        </div>
      </div>
    </div>
  );
}
