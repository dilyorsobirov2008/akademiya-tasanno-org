"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  PlayCircle,
  Lock,
  PlusCircle,
  HelpCircle,
  Award,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
  Unlock,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitQuizAction } from "@/app/actions/quiz";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  passScore: number;
  questions: Question[];
  results?: { score: number; passed: boolean }[];
}

interface VideoItem {
  id: string;
  order: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnail: string | null;
  scope: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  isPassed: boolean;
  quizScore: number;
  isWatched?: boolean;
  quiz?: Quiz | null;
  branch?: { name: string } | null;
  position?: { name: string } | null;
}

export default function VideosListPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Active Quiz Modal state
  const [activeQuizVideo, setActiveQuizVideo] = useState<VideoItem | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    passed: boolean;
    score: number;
    correct: number;
    total: number;
    message: string;
  } | null>(null);

  const loadVideos = useCallback(() => {
    setLoading(true);
    fetch("/api/videos")
      .then((r) => r.json())
      .then((data) => setVideos(data.videos ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function markAsWatched(id: string) {
    setMarkingId(id);
    try {
      await fetch(`/api/videos/${id}/watched`, { method: "POST" });
      loadVideos();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  }

  function openQuiz(v: VideoItem) {
    if (!v.quiz) return;
    setActiveQuizVideo(v);
    setUserAnswers({});
    setQuizFeedback(null);
  }

  async function handleQuizSubmit() {
    if (!activeQuizVideo?.quiz) return;
    setSubmittingQuiz(true);
    setQuizFeedback(null);

    try {
      const res = await submitQuizAction({
        quizId: activeQuizVideo.quiz.id,
        answers: userAnswers,
      });

      if (res.success) {
        setQuizFeedback({
          passed: res.passed ?? false,
          score: res.score ?? 0,
          correct: res.correct ?? 0,
          total: res.total ?? 0,
          message: res.message ?? "",
        });
        // Refresh to show next video unlocked
        loadVideos();
      } else {
        setQuizFeedback({
          passed: false,
          score: 0,
          correct: 0,
          total: activeQuizVideo.quiz.questions.length,
          message: res.error ?? "Xato yuz berdi.",
        });
      }
    } catch (err) {
      console.error("Quiz submit error:", err);
    } finally {
      setSubmittingQuiz(false);
    }
  }

  // ─── Loading Skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Darsliklar Zanjiri
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Videolarni ketma-ket tomosha qiling va 10 talik testdan ≥ 80% (8/10) ball to'plab keyingi qismni oching.
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/admin/videos/create">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-2 shadow-md text-xs">
                <PlusCircle className="h-4 w-4" /> Yangi Darslik Qo'shish
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ─── Progress Summary Bar ─────────────────────────────────────── */}
      {videos.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
              <span className="font-semibold">Umumiy Progress</span>
              <span className="font-bold text-indigo-700">
                {videos.filter((v) => v.isPassed).length} / {videos.length} ta bosqich o'tilgan
              </span>
            </div>
            <div className="h-2 bg-indigo-100 rounded-full overflow-hidden border border-indigo-200">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round(
                    (videos.filter((v) => v.isPassed).length / videos.length) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 shrink-0">
            {Math.round((videos.filter((v) => v.isPassed).length / videos.length) * 100)}%
          </div>
        </div>
      )}

      {/* ─── Video Cards Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {videos.length === 0 && (
          <div className="col-span-2 p-14 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500">Hozircha darsliklar mavjud emas.</p>
          </div>
        )}

        {videos.map((v, index) => {
          const isWatched = (v as any).watchedBy?.length > 0 || v.isWatched;

          // ─── 🔒 LOCKED CARD ───────────────────────────────
          if (!v.isUnlocked) {
            return (
              <div
                key={v.id}
                className="bg-slate-100/95 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden opacity-80"
              >
                {/* Locked badge */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    🔒 Qulflangan · {v.order}-Qism
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Bosqich {index + 1}</span>
                </div>

                {/* Lock Illustration */}
                <div className="p-8 text-center bg-slate-200/60 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-slate-300/80 flex items-center justify-center">
                    <Lock className="h-7 w-7 text-slate-500" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-base">{v.title}</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    🔒 Bu darslikni ochish uchun {v.order - 1}-qism testidan kamida{" "}
                    <strong>80% (8 ta to'g'ri)</strong> ball to'plashingiz kerak.
                  </p>
                </div>

                {/* Decorative lock overlay */}
                <div className="absolute top-3 right-3 opacity-5">
                  <Lock className="h-24 w-24 text-slate-900" />
                </div>
              </div>
            );
          }

          // ─── 🟢 UNLOCKED / ACTIVE CARD ────────────────────
          return (
            <div
              key={v.id}
              className={`bg-white rounded-2xl overflow-hidden flex flex-col border transition hover:shadow-xl ${
                v.isPassed ? "border-emerald-200 shadow-emerald-50" : "border-indigo-100"
              }`}
            >
              {/* Status top bar */}
              <div
                className={`h-1 w-full ${
                  v.isPassed
                    ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                    : "bg-gradient-to-r from-indigo-400 to-purple-400"
                }`}
              />

              {/* Video thumbnail / player strip */}
              <Link href={`/dashboard/videos/${v.id}`} className="block group">
                <div className="aspect-video w-full bg-slate-900 relative overflow-hidden">
                  {v.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-gradient-to-br from-slate-800 to-indigo-950">
                      <PlayCircle className="h-14 w-14 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}

                  {/* Overlay play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <PlayCircle className="h-8 w-8 text-indigo-700" />
                    </div>
                  </div>

                  {/* Part badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-bold backdrop-blur-sm">
                      {v.order}-Qism
                    </span>
                  </div>
                </div>
              </Link>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1 gap-3">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/dashboard/videos/${v.id}`}>
                    <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-indigo-700 transition">
                      {v.title}
                    </h3>
                  </Link>

                  {v.isPassed ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <Award className="h-3.5 w-3.5" /> {v.quizScore}%
                    </span>
                  ) : isWatched ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Ko'rilgan
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                      <PlayCircle className="h-3.5 w-3.5" /> Yangi
                    </span>
                  )}
                </div>

                {v.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{v.description}</p>
                )}

                {/* Scope badge */}
                {v.branch && (
                  <span className="text-xs text-slate-400">🏢 {v.branch.name}</span>
                )}
                {v.position && (
                  <span className="text-xs text-slate-400">💼 {v.position.name}</span>
                )}

                {/* ─── ACTION FOOTER ─── */}
                <div className="mt-auto pt-3 border-t border-slate-100 space-y-2">
                  {v.quiz && (
                    <Button
                      disabled={!isWatched}
                      onClick={() => isWatched && openQuiz(v)}
                      className={`w-full font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 ${
                        v.isPassed
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isWatched
                          ? "bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-md shadow-amber-300/30 cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      <HelpCircle className="h-4 w-4" />
                      {v.isPassed
                        ? "📝 Testni Qayta Topshirish"
                        : isWatched
                        ? `📝 ${v.order}-qism Testini Boshlash`
                        : "🔒 Test uchun videoni oxirigacha ko'ring"}
                    </Button>
                  )}

                  <Link href={`/dashboard/videos/${v.id}`} className="block">
                    <Button
                      className={`w-full text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold ${
                        !isWatched
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                          : "variant-outline text-indigo-700 border border-indigo-200 hover:bg-indigo-50"
                      }`}
                    >
                      {!isWatched ? "Darslikni Tomosha Qilish →" : "Darslikni Qayta Ko'rish →"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 10-QUESTION QUIZ MODAL ───────────────────────────────────── */}
      {activeQuizVideo && activeQuizVideo.quiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    {activeQuizVideo.order}-Qism Bosqich Testi
                  </span>
                </div>
                <h3 className="font-bold text-lg">{activeQuizVideo.quiz.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  O'tish chegari: {activeQuizVideo.quiz.passScore}% · Kamida{" "}
                  {Math.ceil(
                    (activeQuizVideo.quiz.passScore / 100) * activeQuizVideo.quiz.questions.length
                  )}
                  /{activeQuizVideo.quiz.questions.length} to'g'ri javob
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveQuizVideo(null);
                  setQuizFeedback(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Feedback Banner */}
            {quizFeedback && (
              <div
                className={`mx-4 mt-4 p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
                  quizFeedback.passed
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                {quizFeedback.passed ? (
                  <Award className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold text-base leading-snug">{quizFeedback.message}</p>
                  {quizFeedback.passed && (
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Unlock className="h-3.5 w-3.5" />
                      Keyingi {activeQuizVideo.order + 1}-qism video ochildi! Ro'yxatni yangilab ko'ring.
                    </p>
                  )}
                  {!quizFeedback.passed && (
                    <p className="text-xs opacity-80">
                      ❌ Natijangiz: {quizFeedback.correct}/{quizFeedback.total}. Siz keyingi bosqichga o'ta olmaysiz.
                      Keyingi darsni ochish uchun kamida 8 ta to'g'ri topishingiz kerak. Qaytadan urinib ko'ring.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {activeQuizVideo.quiz.questions.map((q, qIdx) => (
                <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="font-bold text-slate-900 text-sm">
                    <span className="text-indigo-600 mr-1">{qIdx + 1}.</span>
                    {q.text}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition select-none ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-500 font-semibold text-indigo-900 shadow-sm"
                              : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.id}`}
                            checked={isSelected}
                            onChange={() =>
                              setUserAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                            }
                            className="accent-indigo-600 h-4 w-4 shrink-0"
                          />
                          <span className="font-bold text-slate-400 w-5 shrink-0">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {Object.keys(userAnswers).length}/{activeQuizVideo.quiz.questions.length} savol javoblandi
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveQuizVideo(null);
                    setQuizFeedback(null);
                  }}
                  className="text-xs"
                >
                  Yopish
                </Button>
                <Button
                  onClick={handleQuizSubmit}
                  disabled={
                    submittingQuiz ||
                    Object.keys(userAnswers).length < activeQuizVideo.quiz.questions.length
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 gap-2"
                >
                  {submittingQuiz && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submittingQuiz ? "Tekshirilmoqda..." : "Testni Topshirish →"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
