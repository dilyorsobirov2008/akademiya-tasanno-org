"use client";

import { useRef, useState, useEffect } from "react";
import { markVideoAsWatched } from "@/app/actions/video-progress";
import { Lock, HelpCircle, Loader2, AlertCircle } from "lucide-react";

interface Props {
  videoId: number | string;
  videoUrl: string;
  userId: string;
  initialIsWatched: boolean;
  onQuizStart: () => void;
  title?: string;
  poster?: string;
}

export default function StrictAutoVideoPlayer({
  videoId,
  videoUrl,
  userId,
  initialIsWatched,
  onQuizStart,
  title,
  poster,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxTimeWatched = useRef<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(initialIsWatched);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSeekAlert, setShowSeekAlert] = useState<boolean>(false);

  useEffect(() => {
    maxTimeWatched.current = 0;
    setIsEnded(initialIsWatched);
  }, [videoUrl, initialIsWatched]);

  // Har bir soniyada ko'rilgan eng yuqori vaqtni saqlab borish
  const handleTimeUpdate = () => {
    if (!videoRef.current || isEnded) return;
    if (!videoRef.current.seeking) {
      if (videoRef.current.currentTime > maxTimeWatched.current) {
        maxTimeWatched.current = videoRef.current.currentTime;
      }
    }
  };

  // Oldinga o'tkazishga urinish bo'lsa, orqaga qaytarish (Prevent Forward Seeking)
  const handleSeeking = () => {
    if (!videoRef.current || isEnded) return;
    if (videoRef.current.currentTime > maxTimeWatched.current + 0.5) {
      videoRef.current.currentTime = maxTimeWatched.current;
      setShowSeekAlert(true);
      setTimeout(() => setShowSeekAlert(false), 3000);
    }
  };

  // Video 100% tugaganda avtomatik bajariladigan amallar (onEnded)
  const handleEnded = async () => {
    setIsEnded(true);
    if (!initialIsWatched) {
      setIsSaving(true);
      try {
        await markVideoAsWatched(userId, videoId);
      } catch (err) {
        console.error("Video progress auto save error:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Pleyer Container */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onEnded={handleEnded}
          className="w-full h-full object-contain"
        />

        {/* Seeking Blocked Alert */}
        {showSeekAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-600/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border border-rose-400 flex items-center gap-2 animate-bounce">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>⚠️ Videoni o'tkazib ko'rish taqiqlangan! Faqat o'tilgan qismlarni qayta ko'ra olasiz.</span>
          </div>
        )}
      </div>

      {/* Dynamic Test Button Section */}
      <div>
        {isSaving ? (
          <div className="w-full py-4 bg-slate-100 text-slate-600 font-semibold rounded-xl text-center border border-slate-200 flex items-center justify-center gap-2 animate-pulse text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>⏳ Progress avtomatik saqlanmoqda...</span>
          </div>
        ) : (
          <button
            disabled={!isEnded}
            onClick={onQuizStart}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
              isEnded
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer hover:scale-[1.01] shadow-amber-500/20"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-80"
            }`}
          >
            {isEnded ? (
              <>
                <HelpCircle className="h-4 w-4" />
                <span>📝 Testni Boshlash (10 ta savol)</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-slate-400" />
                <span>🔒 Testni boshlash uchun videoni oxirigacha tomosha qiling</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
