"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Video as VideoIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Pencil,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

// Lazy load the heavy quiz modal
const AddQuizModal = dynamic(() => import("@/components/admin/AddQuizModal"), {
  ssr: false,
  loading: () => null,
});

const formSchema = z.object({
  title: z.string().min(2, "Sarlavha kiritilishi shart"),
  description: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL kiritilishi shart"),
  thumbnail: z.string().optional(),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});
type FormValues = z.infer<typeof formSchema>;

interface VideoItem {
  id: string;
  order: number;
  title: string;
  description?: string | null;
  videoUrl: string;
  scope: "GLOBAL" | "BRANCH" | "POSITION";
  quizId?: string | null;
  quiz?: {
    id: string;
    title: string;
    passScore: number;
    _count?: { questions: number };
  } | null;
  branch?: { name: string } | null;
  position?: { name: string } | null;
  createdAt: string;
}

interface Item {
  id: string;
  name: string;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [branches, setBranches] = useState<Item[]>([]);
  const [positions, setPositions] = useState<Item[]>([]);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quiz modal state
  const [quizModal, setQuizModal] = useState<{
    videoId: string;
    videoTitle: string;
    videoOrder: number;
    existingQuizId?: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { scope: "GLOBAL", videoUrl: "" },
  });

  const scope = watch("scope");
  const currentVideoUrl = watch("videoUrl");

  const loadVideos = useCallback(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((d) => setVideos(d.videos ?? []));
  }, []);

  useEffect(() => {
    loadVideos();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches ?? []));
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => setPositions(d.positions ?? []));
  }, [loadVideos]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Video yuklashda xatolik");
      setValue("videoUrl", json.fileUrl, { shouldValidate: true });
      setMessage({ type: "success", text: "Video muvaffaqiyatli yuklandi!" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Xatolik yuz berdi" });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setMessage(null);
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage({ type: "error", text: json.error ?? "Xatolik yuz berdi" });
      return;
    }
    setMessage({ type: "success", text: "Video muvaffaqiyatli qo'shildi! Endi videoga test biriktiring." });
    reset({ scope: "GLOBAL", videoUrl: "", title: "", description: "" });
    loadVideos();
  }

  async function handleDelete(id: string) {
    if (!confirm("Haqiqatan ham ushbu videoni (va unga biriktirilgan testni) o'chirmoqchimisiz?")) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setMessage({ type: "success", text: "Video va test o'chirildi." });
    }
  }

  const withoutQuiz = videos.filter((v) => !v.quizId);
  const withQuiz = videos.filter((v) => !!v.quizId);

  return (
    <div className="space-y-6">
      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <VideoIcon className="h-6 w-6 text-purple-600" />
            Video Darsliklar Boshqaruvi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Videolarni qo'shing, so'ngra har biriga 10 talik test biriktiring.
          </p>
        </div>
        {withoutQuiz.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            {withoutQuiz.length} ta videoda test yo'q
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── Add Video Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6 lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-800">Yangi Video Qo'shish</h2>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Video sarlavhasi</label>
            <Input {...register("title")} placeholder="Masalan: 1-qism: Kompaniya qoidalari" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Qisqacha tavsif (ixtiyoriy)</label>
            <Input {...register("description")} placeholder="Darslik mazmuni" />
          </div>

          {/* Upload Mode toggle */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Video manbasi</label>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`rounded-md px-2.5 py-1 ${uploadMode === "url" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  <LinkIcon className="inline-block mr-1 h-3 w-3" /> URL / YouTube
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`rounded-md px-2.5 py-1 ${uploadMode === "file" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
                >
                  <Upload className="inline-block mr-1 h-3 w-3" /> Fayl yuklash
                </button>
              </div>
            </div>

            {uploadMode === "file" ? (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl p-4 text-center transition">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <VideoIcon className="mx-auto h-8 w-8 text-purple-500 mb-1" />
                <p className="text-xs font-medium text-slate-700">
                  {uploading ? "Yuklanmoqda..." : currentVideoUrl ? "Video biriktirildi ✓" : "Kompyuterdan video tanlang"}
                </p>
                {currentVideoUrl && <p className="mt-1 text-[11px] text-emerald-600 truncate">{currentVideoUrl}</p>}
              </div>
            ) : (
              <Input {...register("videoUrl")} placeholder="https://www.youtube.com/watch?v=... yoki MP4 URL" />
            )}
            {errors.videoUrl && <p className="mt-1 text-xs text-red-600">{errors.videoUrl.message}</p>}
          </div>

          {/* Scope */}
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
                {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          )}

          {scope === "POSITION" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lavozimni tanlang</label>
              <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" {...register("positionId")}>
                <option value="">Lavozimni tanlang</option>
                {positions.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
          )}

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <Button type="submit" disabled={isSubmitting || uploading} className="w-full bg-purple-600 hover:bg-purple-700">
            {isSubmitting ? "Saqlanmoqda..." : "Videoni Qo'shish"}
          </Button>
        </form>

        {/* ── Video List ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Videos WITHOUT quiz — highlighted warning */}
          {withoutQuiz.length > 0 && (
            <div className="card border-2 border-amber-200 bg-amber-50/50 overflow-hidden">
              <div className="px-4 py-3 bg-amber-100/80 border-b border-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <h2 className="font-bold text-amber-900 text-sm">⚠️ Test Biriktirilmagan Videolar ({withoutQuiz.length})</h2>
              </div>
              <div className="divide-y divide-amber-100">
                {withoutQuiz.map((v) => (
                  <VideoRow
                    key={v.id}
                    video={v}
                    onDelete={handleDelete}
                    onAddQuiz={() =>
                      setQuizModal({
                        videoId: v.id,
                        videoTitle: v.title,
                        videoOrder: v.order,
                        existingQuizId: null,
                      })
                    }
                    onEditQuiz={() =>
                      setQuizModal({
                        videoId: v.id,
                        videoTitle: v.title,
                        videoOrder: v.order,
                        existingQuizId: v.quizId,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos WITH quiz ✅ */}
          {withQuiz.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <h2 className="font-semibold text-slate-800 text-sm">✅ Test Biriktirilgan Videolar ({withQuiz.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {withQuiz.map((v) => (
                  <VideoRow
                    key={v.id}
                    video={v}
                    onDelete={handleDelete}
                    onAddQuiz={() =>
                      setQuizModal({
                        videoId: v.id,
                        videoTitle: v.title,
                        videoOrder: v.order,
                        existingQuizId: null,
                      })
                    }
                    onEditQuiz={() =>
                      setQuizModal({
                        videoId: v.id,
                        videoTitle: v.title,
                        videoOrder: v.order,
                        existingQuizId: v.quizId,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && (
            <div className="card p-12 text-center text-slate-400">
              <VideoIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>Hali hech qanday video qo'shilmagan.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Quiz Modal ── */}
      {quizModal && (
        <AddQuizModal
          isOpen={!!quizModal}
          onClose={() => setQuizModal(null)}
          videoId={quizModal.videoId}
          videoTitle={quizModal.videoTitle}
          videoOrder={quizModal.videoOrder}
          existingQuizId={quizModal.existingQuizId}
          onSaved={() => {
            loadVideos();
            setTimeout(() => setQuizModal(null), 1800);
          }}
        />
      )}
    </div>
  );
}

// ─── VideoRow Sub-Component ─────────────────────────────────────────────────
function VideoRow({
  video,
  onDelete,
  onAddQuiz,
  onEditQuiz,
}: {
  video: VideoItem;
  onDelete: (id: string) => void;
  onAddQuiz: () => void;
  onEditQuiz: () => void;
}) {
  const hasQuiz = !!video.quizId;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition gap-3">
      {/* Left: icon + info */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-2.5 rounded-xl shrink-0 ${hasQuiz ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          <VideoIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate">{video.order}-qism: {video.title}</p>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
              {video.scope === "GLOBAL" ? "🌐 Global" : video.scope === "BRANCH" ? `🏢 ${video.branch?.name}` : `💼 ${video.position?.name}`}
            </span>
          </div>

          {/* Quiz Status Badge */}
          <div className="mt-1">
            {hasQuiz ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> ✅ 10 ta test biriktirilgan · {video.quiz?.passScore ?? 80}% ball
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <HelpCircle className="h-3 w-3" /> ⚠️ Test yo'q
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {hasQuiz ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onEditQuiz}
            className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" /> Testni Tahrirlash
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onAddQuiz}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold gap-1.5 shadow-md shadow-amber-200"
          >
            <PlusCircle className="h-3.5 w-3.5" /> 📝 Test Qo'shish
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(video.id)}
          className="text-red-600 hover:bg-red-50 border-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
