"use client";

import { useState } from "react";
import {
  HelpCircle,
  Award,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface QuizType {
  id: string;
  title: string;
  passScore: number;
  questions: Question[];
}

interface VideoPlayerWithQuizProps {
  videoUrl: string;
  videoTitle: string;
  videoPart: number;
  thumbnail?: string | null;
  quiz?: QuizType | null;
  isWatched?: boolean;
  isPassed?: boolean;
  quizScore?: number;
  onWatched?: () => void;
  onPassed?: (score: number) => void;
}

/** Render embedded YouTube or native HTML5 video player */
function renderVideoPlayer(url: string, title: string, thumbnail?: string | null) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let embedUrl = url;
    if (url.includes("watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      embedUrl = `https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
    }
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    );
  }

  return (
    <video
      controls
      preload="metadata"
      playsInline
      className="aspect-video w-full bg-black"
      poster={thumbnail ?? undefined}
    >
      <source src={url} />
      Sizning brauzeringiz video ijrosini qo'llab-quvvatlamaydi.
    </video>
  );
}

export default function VideoPlayerWithQuiz({
  videoUrl,
  videoTitle,
  videoPart,
  thumbnail,
  quiz,
  isWatched = false,
  isPassed = false,
  quizScore = 0,
  onWatched,
  onPassed,
}: VideoPlayerWithQuizProps) {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<QuizSubmitResult | null>(null);

  async function handleSubmitQuiz() {
    if (!quiz) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await submitQuizAction({
        quizId: quiz.id,
        answers: userAnswers,
      });
      setFeedback(res);

      if (res.success && res.passed) {
        onPassed?.(res.score ?? 80);
      }
    } catch (err) {
      console.error("Quiz submission error", err);
      setFeedback({ success: false, error: "Serverda kutilmagan xato. Qaytadan urinib ko'ring." });
    } finally {
      setSubmitting(false);
    }
  }

  function openQuiz() {
    setShowQuizModal(true);
    setFeedback(null);
    setUserAnswers({});
  }

  function closeQuiz() {
    setShowQuizModal(false);
  }

  return (
    <>
      {/* ====== VIDEO PLAYER ====== */}
      <div className="overflow-hidden rounded-2xl bg-black shadow-2xl border border-slate-800">
        {renderVideoPlayer(videoUrl, videoTitle, thumbnail)}
      </div>

      {/* ====== VIDEO STATUS & ACTIONS ====== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        {/* Watched status badge */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-bold text-slate-900 text-base leading-snug">
              {videoPart}-Qism: {videoTitle}
            </h2>
            <p className="text-xs text-slate-500">
              Videoni tomosha qiling va 10 talik testdan kamida 80% bali to'plang.
            </p>
          </div>

          {isWatched && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" /> Video Ko'rilgan
            </span>
          )}
        </div>

        {/* Quiz-based Pass status */}
        {isPassed && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
            <Award className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              🎉 {videoPart}-qism testi muvaffaqiyatli o'tildi! Natijangiz: {quizScore}% ({" "}
              {Math.round((quizScore / 100) * (quiz?.questions?.length ?? 10))}/
              {quiz?.questions?.length ?? 10} to'g'ri)
            </span>
          </div>
        )}

        {/* Open Quiz Button */}
        {isWatched && quiz && (
          <Button
            onClick={openQuiz}
            className={`w-full font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-md ${
              isPassed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-400 hover:bg-amber-500 text-slate-900"
            }`}
          >
            <HelpCircle className="h-5 w-5" />
            {isPassed
              ? "📝 Testni Qayta Topshirish"
              : `📝 ${videoPart}-qism Testini Boshlash (10 ta savol)`}
          </Button>
        )}
      </div>

      {/* ====== 10-QUESTION QUIZ MODAL ====== */}
      {showQuizModal && quiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
                    {videoPart}-Qism Bosqich Testi
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white">{quiz.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  O'tish chegari: {quiz.passScore}% · Kamida{" "}
                  {Math.ceil((quiz.passScore / 100) * quiz.questions.length)}/{quiz.questions.length} to'g'ri javob
                </p>
              </div>
              <button
                onClick={closeQuiz}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`mx-4 mt-4 p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
                  feedback.passed
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : feedback.success === false
                    ? "bg-rose-50 border-rose-300 text-rose-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                {feedback.passed ? (
                  <Award className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold leading-snug">{feedback.message || feedback.error}</p>
                  {!feedback.passed && feedback.success && (
                    <p className="text-xs opacity-80">
                      O'tish uchun kamida {Math.ceil((quiz.passScore / 100) * quiz.questions.length)} ta to'g'ri javob
                      kerak. Qaytadan urinib ko'ring!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Questions List 1–10 */}
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {quiz.questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <p className="font-bold text-slate-900 text-sm leading-snug">
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
                            name={`q-${q.id}`}
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
                {Object.keys(userAnswers).length}/{quiz.questions.length} savol javoblandi
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeQuiz} className="text-xs">
                  Yopish
                </Button>
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={submitting || Object.keys(userAnswers).length < quiz.questions.length}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 gap-2"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? "Tekshirilmoqda..." : "Testni Topshirish →"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
