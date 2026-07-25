"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Unlock,
  Award,
  AlertCircle,
  PlayCircle,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyVideoPlayer } from "@/components/dashboard/LazyComponents";
import StrictVideoPlayer from "@/components/StrictVideoPlayer";
import { submitQuizAction, QuizSubmitResult } from "@/app/actions/quiz";

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
  results?: { score: number; correct: number; total: number; passed: boolean }[];
}

interface VideoDetail {
  id: string;
  order: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnail: string | null;
  scope: string;
  isCompleted: boolean;
  isPassed: boolean;
  quizScore: number;
  isWatched: boolean;
  quiz?: Quiz | null;
}

interface NextVideoInfo {
  id: string;
  order: number;
  title: string;
  isUnlocked: boolean;
}

export default function SingleVideoLessonPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.id as string;

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [nextVideo, setNextVideo] = useState<NextVideoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingWatched, setMarkingWatched] = useState(false);

  // Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<QuizSubmitResult | null>(null);

  const loadData = useCallback(() => {
    if (!videoId) return;
    setLoading(true);
    fetch(`/api/videos/${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.video) {
          setVideo(data.video);
          setNextVideo(data.nextVideo);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function markAsWatched() {
    if (!videoId) return;
    setMarkingWatched(true);
    try {
      await fetch(`/api/videos/${videoId}/watched`, { method: "POST" });
      setVideo((prev) => (prev ? { ...prev, isWatched: true } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingWatched(false);
    }
  }

  async function handleQuizSubmit() {
    if (!video?.quiz) return;
    setSubmittingQuiz(true);
    setQuizFeedback(null);

    try {
      const res = await submitQuizAction({
        quizId: video.quiz.id,
        answers: userAnswers,
      });

      setQuizFeedback(res);

      if (res.success && res.passed) {
        // Dynamically update UI state to unlocked
        setVideo((prev) => (prev ? { ...prev, isPassed: true, quizScore: res.score ?? 80 } : prev));
        setNextVideo((prev) => (prev ? { ...prev, isUnlocked: true } : prev));
      }
    } catch (err) {
      console.error("Quiz submission error", err);
    } finally {
      setSubmittingQuiz(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Darslik yuklanmoqda...</div>;
  }

  if (!video) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-rose-600 font-bold">Darslik topilmadi yoki o'chirilgan.</p>
        <Link href="/dashboard/videos">
          <Button variant="outline" size="sm">
            ← Darsliklar ro'yxatiga qaytish
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/videos">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" /> Barcha Darsliklar
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{video.order}-Qism: {video.title}</h1>
            <p className="text-xs text-slate-500">
              Videoni tomosha qiling, 10 talik testdan kamida 80% to'plang va keyingi qismni oching.
            </p>
          </div>
        </div>

        {video.isPassed && (
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-emerald-300">
            <Award className="h-4 w-4 text-emerald-600" /> Test O'tilgan ({video.quizScore}%)
          </span>
        )}
      </div>

      {/* Main Video & Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Strict Video Player & Description (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <StrictVideoPlayer
            videoUrl={video.videoUrl}
            title={video.title}
            thumbnail={video.thumbnail}
            videoId={video.id}
            isWatchedInitially={video.isWatched}
            isPassedInitially={video.isPassed}
            quizAvailable={Boolean(video.quiz)}
            quizButtonLabel={`📝 ${video.order}-qism Testini Boshlash`}
            onVideoEnd={() => {
              setVideo((prev) => (prev ? { ...prev, isWatched: true } : prev));
            }}
            onStartQuiz={() => {
              setShowQuizModal(true);
              setQuizFeedback(null);
            }}
          />

          <div className="card p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Bosqich {video.order}
              </span>

              {video.isWatched || video.isPassed ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Video Ko'rilgan (100%)
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1">
                  🔒 Oxirigacha ko'rish majburiy
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">{video.title}</h2>
            {video.description && <p className="text-xs text-slate-600 leading-relaxed">{video.description}</p>}
          </div>
        </div>

        {/* Right Column: Quiz Gate & Next Video Lock Card (1 col) */}
        <div className="space-y-5">
          {/* Quiz Action Card */}
          <div className="card p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl space-y-4 shadow-lg border border-indigo-950">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Bosqich Testi
              </span>
              <HelpCircle className="h-5 w-5 text-indigo-400" />
            </div>

            <div>
              <h3 className="font-bold text-base">📝 {video.order}-Qism 10 talik Testi</h3>
              <p className="text-xs text-slate-300 mt-1">
                Keyingi qismga o'tish uchun kamida 80% (8/10 to'g'ri) ball to'plashingiz shart.
              </p>
            </div>

            {video.quiz ? (
              <Button
                disabled={!video.isWatched && !video.isPassed}
                onClick={() => {
                  setShowQuizModal(true);
                  setQuizFeedback(null);
                }}
                className={`w-full font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md ${
                  video.isPassed
                    ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    : video.isWatched
                    ? "bg-amber-400 hover:bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                {video.isPassed
                  ? "📝 Testni Qayta Topshirish"
                  : video.isWatched
                  ? `📝 ${video.order}-qism Testini Boshlash`
                  : "🔒 Test uchun videoni oxirigacha ko'ring"}
              </Button>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-2">
                Ushbu darslik uchun test biriktirilmagan
              </p>
            )}
          </div>

          {/* Next Video Part Locked/Unlocked Card */}
          {nextVideo && (
            <div
              className={`card p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                nextVideo.isUnlocked
                  ? "bg-white border-emerald-300 shadow-md"
                  : "bg-slate-100/90 border-slate-200 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Keyingi Qism</span>
                {nextVideo.isUnlocked ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                    <Unlock className="h-3.5 w-3.5 text-emerald-600" /> Ochilgan
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-slate-500" /> Qulflangan (🔒 Lock)
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {nextVideo.order}-qism: {nextVideo.title}
                </h4>
                {!nextVideo.isUnlocked && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    🔒 Ushbu 2-qism videoni ochish uchun {video.order}-qism testidan kamida 80% (8 ta to'g'ri) toping.
                  </p>
                )}
              </div>

              {nextVideo.isUnlocked ? (
                <Link href={`/dashboard/videos/${nextVideo.id}`}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl gap-2">
                    2-Qism Videoga O'tish <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline" className="w-full text-xs py-2.5 rounded-xl opacity-60">
                  🔒 Hozircha Qulflangan
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 10-QUESTION QUIZ MODAL DIALOG */}
      {showQuizModal && video.quiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{video.quiz.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {video.order}-Qism Testi · O'tish chegari: {video.quiz.passScore}% (Kamida 8/10 to'g'ri)
                </p>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Feedback Alert */}
              {quizFeedback && (
                <div
                  className={`p-4 rounded-xl border font-medium text-sm flex items-start gap-3 ${
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
                  <div>
                    <p className="font-bold text-base leading-snug">{quizFeedback.message}</p>
                    {quizFeedback.passed && nextVideo && (
                      <p className="text-xs font-semibold text-emerald-700 mt-2">
                        🔓 Keyingi {nextVideo.order}-qism video o'z-o mezoniy ochildi!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Questions 1 to 10 */}
              <div className="space-y-6 divide-y divide-slate-100">
                {video.quiz.questions.map((q, qIndex) => (
                  <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                    <p className="font-bold text-slate-900 text-sm">
                      {qIndex + 1}. {q.text}
                    </p>

                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = userAnswers[q.id] === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-600 font-semibold text-indigo-900"
                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={isSelected}
                              onChange={() => setUserAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                              className="accent-indigo-600 h-4 w-4"
                            />
                            <span className="font-bold text-slate-400 w-4">
                              {String.fromCharCode(65 + optIndex)}:
                            </span>
                            <span>{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowQuizModal(false)} className="text-xs">
                Yopish
              </Button>
              <Button
                onClick={handleQuizSubmit}
                disabled={submittingQuiz || Object.keys(userAnswers).length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 gap-2"
              >
                {submittingQuiz && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Testni Yakunlash Va Topshirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
