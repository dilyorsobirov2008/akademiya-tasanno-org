"use client";

import { useRef, useState, useEffect } from "react";
import { markVideoAsWatched } from "@/app/actions/video-progress";
import { Lock, HelpCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  videoId: number | string;
  videoUrl: string;
  userId: string;
  initialIsWatched: boolean;
  onStartQuiz: () => void;
  poster?: string;
  partOrder?: number;
}

export default function DynamicVideoPlayer({
  videoId,
  videoUrl,
  userId,
  initialIsWatched,
  onStartQuiz,
  poster,
  partOrder,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedTime = useRef<number>(0);
  const [isWatched, setIsWatched] = useState<boolean>(initialIsWatched);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSeekAlert, setShowSeekAlert] = useState<boolean>(false);

  useEffect(() => {
    maxWatchedTime.current = 0;
    setIsWatched(initialIsWatched);
  }, [videoUrl, initialIsWatched]);

  // Faqat birinchi marta ko'rilayotganda vaqtni kuzatib boramiz
  const handleTimeUpdate = () => {
    if (isWatched) return; // Allaqachon ko'rilgan bo'lsa cheklov ishlamaydi
    const video = videoRef.current;
    if (!video || video.seeking) return;

    if (video.currentTime > maxWatchedTime.current) {
      maxWatchedTime.current = video.currentTime;
    }
  };

  // Faqat birinchi marta ko'rilayotganda oldinga o'tkazishni to'xtatamiz
  const handleSeeking = () => {
    if (isWatched) return; // Allaqachon ko'rilgan bo'lsa o'tkazishga erkin ruxsat!
    const video = videoRef.current;
    if (!video) return;

    if (video.currentTime > maxWatchedTime.current + 0.3) {
      video.currentTime = maxWatchedTime.current; // Orqaga qaytarish
      setShowSeekAlert(true);
      setTimeout(() => setShowSeekAlert(false), 2500);
    }
  };

  // Video 100% tugaganda avtomatik saqlash
  const handleEnded = async () => {
    if (!isWatched) {
      setIsSaving(true);
      try {
        await markVideoAsWatched(userId, videoId);
        setIsWatched(true); // Endi ushbu video uchun o'tkazish cheklovi olib tashlandi
      } catch (err) {
        console.error("Video progress auto save error:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Player Container */}
      <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeking}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />

        {/* Seeking Blocked Toast Alert (Faqat birinchi marta ko'rilganda chiqadi) */}
        {!isWatched && showSeekAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-600/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border border-rose-400 flex items-center gap-2 animate-bounce">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>⚠️ Birinchi martada videoni oldinga o'tkaza olmaysiz! Oxirigacha tomosha qiling.</span>
          </div>
        )}
      </div>

      {/* Dynamic Status Indicator */}
      <div className="flex items-center justify-between px-1 text-xs">
        {isWatched ? (
          <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> ✓ Video Ko'rilgan (Erkin o'tkazish rejimi ochiq)
          </span>
        ) : (
          <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-amber-600" /> 🔒 Birinchi marta ko'rilmoqda (O'tkazish taqiqlangan)
          </span>
        )}
      </div>

      {/* Faqat Test Tugmasi */}
      <div>
        {isSaving ? (
          <div className="w-full py-3.5 bg-slate-100 text-slate-500 font-medium rounded-xl text-center animate-pulse flex items-center justify-center gap-2 text-sm border border-slate-200">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>⏳ Progress avtomatik saqlanmoqda...</span>
          </div>
        ) : (
          <button
            disabled={!isWatched}
            onClick={onStartQuiz}
            className={`w-full py-3.5 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-md ${
              isWatched
                ? "bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-slate-950 cursor-pointer"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed text-sm"
            }`}
          >
            {isWatched ? (
              <>
                <HelpCircle className="w-4 h-4" />
                <span>📝 {partOrder ? `${partOrder}-qism ` : ""}Testini Boshlash</span>
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
