"use client";

import { useRef, useState } from "react";
import { markVideoAsWatched } from "@/app/actions/video-progress";
import { CheckCircle2, Lock, HelpCircle, Loader2 } from "lucide-react";

export interface Lesson {
  id: number | string;
  title: string;
  videoUrl: string;
  partOrder?: number;
  isWatched?: boolean;
  posterUrl?: string;
}

interface LessonCardProps {
  lesson: Lesson;
  userId: string;
  onStartQuiz: (lessonId: number | string) => void;
}

export default function LessonCard({ lesson, userId, onStartQuiz }: LessonCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxTimeWatched = useRef<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(lesson.isWatched || false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 1. Videoni oldinga o'tkazishni taqiqlash (Prevent Forward Seeking)
  const handleTimeUpdate = () => {
    if (!videoRef.current || videoRef.current.seeking || isEnded) return;
    if (videoRef.current.currentTime > maxTimeWatched.current) {
      maxTimeWatched.current = videoRef.current.currentTime;
    }
  };

  const handleSeeking = () => {
    if (!videoRef.current || isEnded) return;
    if (videoRef.current.currentTime > maxTimeWatched.current + 0.5) {
      videoRef.current.currentTime = maxTimeWatched.current;
    }
  };

  // 2. Video 100% tugaganda avtomatik saqlash (onEnded)
  const handleEnded = async () => {
    setIsEnded(true);
    if (!lesson.isWatched) {
      setIsSaving(true);
      try {
        await markVideoAsWatched(userId, lesson.id);
      } catch (err) {
        console.error("Video progress auto-save error:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition space-y-4">
      {/* Video Player Container */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          poster={lesson.posterUrl}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Sarlavha va Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{lesson.title}</h3>
        {isEnded && (
          <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Ko'rilgan
          </span>
        )}
      </div>

      {/* FAQAT TEST TUGMASI (Ortiqcha 'Ko'rib bo'lindi' binafsha tugmasi BUTUNLAY YO'Q QILINGAN) */}
      <div>
        {isSaving ? (
          <div className="w-full py-3.5 bg-slate-100 text-slate-500 font-medium rounded-xl text-center animate-pulse flex items-center justify-center gap-2 text-sm border border-slate-200">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>⏳ Progress saqlanmoqda...</span>
          </div>
        ) : (
          <button
            disabled={!isEnded}
            onClick={() => onStartQuiz(lesson.id)}
            className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
              isEnded
                ? "bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 cursor-pointer shadow-md"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-sm"
            }`}
          >
            {isEnded ? (
              <>
                <HelpCircle className="w-4 h-4" />
                <span>📝 {lesson.partOrder ? `${lesson.partOrder}-qism ` : ""}Testini Boshlash</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400" />
                <span>🔒 Testni boshlash uchun videoni oxirigacha tomosha qiling</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
