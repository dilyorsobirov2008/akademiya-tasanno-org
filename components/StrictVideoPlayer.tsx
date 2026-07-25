"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Lock, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markVideoAsWatchedAction } from "@/app/actions/video-progress";

interface StrictVideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnail?: string | null;
  videoId?: string;
  isWatchedInitially?: boolean;
  isPassedInitially?: boolean;
  quizAvailable?: boolean;
  quizButtonLabel?: string;
  onVideoEnd?: () => void;
  onStartQuiz?: () => void;
}

export default function StrictVideoPlayer({
  videoUrl,
  title = "Video Darslik",
  thumbnail,
  videoId,
  isWatchedInitially = false,
  isPassedInitially = false,
  quizAvailable = true,
  quizButtonLabel = "📝 Testni Boshlash",
  onVideoEnd,
  onStartQuiz,
}: StrictVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxTimeWatched = useRef<number>(0);

  const [isEnded, setIsEnded] = useState<boolean>(isWatchedInitially || isPassedInitially);
  const [progressPercent, setProgressPercent] = useState<number>(
    isWatchedInitially || isPassedInitially ? 100 : 0
  );
  const [isSeekingBlockedAlert, setIsSeekingBlockedAlert] = useState<boolean>(false);
  const [markingWatched, setMarkingWatched] = useState<boolean>(false);
  const [autoSavedBadge, setAutoSavedBadge] = useState<boolean>(isWatchedInitially || isPassedInitially);

  // Allow full seeking if video was already completed
  const allowFullSeeking = isWatchedInitially || isPassedInitially;

  useEffect(() => {
    maxTimeWatched.current = 0;
    if (isWatchedInitially || isPassedInitially) {
      setIsEnded(true);
      setProgressPercent(100);
      setAutoSavedBadge(true);
    } else {
      setIsEnded(false);
      setProgressPercent(0);
      setAutoSavedBadge(false);
    }
  }, [videoUrl, isWatchedInitially, isPassedInitially]);

  // 1. Track Time & Restrict Forward Seeking
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!allowFullSeeking && video.currentTime > maxTimeWatched.current) {
      if (video.currentTime - maxTimeWatched.current > 1.5) {
        video.currentTime = maxTimeWatched.current;
        triggerSeekingAlert();
        return;
      }
      maxTimeWatched.current = video.currentTime;
    }

    if (video.duration > 0) {
      const currentProgress = Math.min(
        100,
        Math.round((allowFullSeeking ? video.currentTime : maxTimeWatched.current) / video.duration * 100)
      );
      setProgressPercent(currentProgress);
    }
  };

  // 2. Prevent Seeking Past Max Watched Point
  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video || allowFullSeeking) return;

    if (video.currentTime > maxTimeWatched.current + 0.5) {
      video.currentTime = maxTimeWatched.current;
      triggerSeekingAlert();
    }
  };

  function triggerSeekingAlert() {
    setIsSeekingBlockedAlert(true);
    setTimeout(() => setIsSeekingBlockedAlert(false), 3000);
  }

  // 3. AUTOMATIC TRIGGER ON VIDEO ENDED
  const handleEnded = async () => {
    setIsEnded(true);
    setProgressPercent(100);
    setAutoSavedBadge(true);

    if (onVideoEnd) {
      onVideoEnd();
    }

    // Invoke Server Action automatically when video hits 100%
    if (videoId && !isWatchedInitially) {
      setMarkingWatched(true);
      try {
        await markVideoAsWatchedAction(videoId);
      } catch (err) {
        console.error("Auto mark watched error:", err);
      } finally {
        setMarkingWatched(false);
      }
    }
  };

  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

  function getYouTubeEmbedUrl(url: string) {
    if (url.includes("watch?v=")) {
      const id = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`;
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&modestbranding=1`;
    }
    return url;
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 group">
        {isYouTube ? (
          <iframe
            src={getYouTubeEmbedUrl(videoUrl)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onTimeUpdate={handleTimeUpdate}
            onSeeking={handleSeeking}
            onEnded={handleEnded}
            poster={thumbnail ?? undefined}
            className="w-full h-full object-contain"
          />
        )}

        {/* Seeking Blocked Toast Alert */}
        {isSeekingBlockedAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-600/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border border-rose-400 flex items-center gap-2 animate-bounce">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>⚠️ Videoni o'tkazib ko'rish taqiqlangan! Faqat o'tilgan qismlarni qayta ko'ra olasiz.</span>
          </div>
        )}

        {/* Progress Bar */}
        {!isYouTube && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Real-time Status Badge */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          {autoSavedBadge ? (
            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> ✓ Video Ko'rilgan (Avto-saqlandi)
            </span>
          ) : (
            <span className="font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-indigo-600" /> Progress: {progressPercent}%
            </span>
          )}
        </div>

        {!allowFullSeeking && !isEnded && (
          <span className="text-slate-400 italic">
            🔒 Videoni oxirigacha ko'rish shart
          </span>
        )}
      </div>

      {/* Automatic Action & Quiz Launch Button */}
      {quizAvailable && (
        <div className="pt-1">
          <Button
            disabled={!isEnded || markingWatched}
            onClick={onStartQuiz}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isEnded
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer hover:scale-[1.01]"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-80"
            }`}
          >
            {markingWatched ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Avto-saqlanmoqda...
              </>
            ) : isEnded ? (
              <>
                <HelpCircle className="h-4 w-4" /> {quizButtonLabel}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-slate-400" /> 🔒 Videoni oxirigacha tomosha qiling ({progressPercent}%)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
