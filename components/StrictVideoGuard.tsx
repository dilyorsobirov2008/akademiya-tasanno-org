"use client";

import { useRef, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  videoUrl: string;
  onVideoEnd: () => void;
  poster?: string;
}

export default function StrictVideoGuard({ videoUrl, onVideoEnd, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedTime = useRef<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [showSeekAlert, setShowSeekAlert] = useState<boolean>(false);

  // 1. Continuous 100ms Interval Guard (Forward Seeking leak tugatish)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (!video || isEnded) return;

      // Agar foydalanuvchi ruxsat etilgan chegaradan (+0.3s) o'tib ketishga urinsa
      if (video.currentTime > maxWatchedTime.current + 0.3) {
        video.currentTime = maxWatchedTime.current;
        triggerSeekAlert();
      } else if (!video.seeking && video.currentTime > maxWatchedTime.current) {
        // Oddiy ijro etilayotgan bo'lsa, eng yuqori ko'rilgan vaqtni saqlash
        maxWatchedTime.current = video.currentTime;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isEnded]);

  // Alert tostdan foydalanuvchini ogohlantirish
  const triggerSeekAlert = () => {
    setShowSeekAlert(true);
    setTimeout(() => setShowSeekAlert(false), 2500);
  };

  // 2. Timeupdate hodisasi - eng uzoq ko'rilgan vaqtni saqlash
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isEnded) return;

    if (!video.seeking && video.currentTime > maxWatchedTime.current) {
      maxWatchedTime.current = video.currentTime;
    }
  };

  // 3. Strict Seeking hodisasi - oldinga o'tkazishni darhol to'xtatib orqaga qaytarish
  const handleSeeking = () => {
    const video = videoRef.current;
    if (!video || isEnded) return;

    if (video.currentTime > maxWatchedTime.current + 0.3) {
      // 0.3 soniyadan ko'p oldinga o'tib ketganda orqaga tiklash
      video.currentTime = maxWatchedTime.current;
      video.pause();
      setTimeout(() => {
        video.play().catch(() => {});
      }, 50);
      triggerSeekAlert();
    }
  };

  // 4. Video 100% tugaganda
  const handleEnded = () => {
    setIsEnded(true);
    onVideoEnd();
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
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

      {/* Seeking Blocked Toast Alert */}
      {showSeekAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-600/95 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg backdrop-blur-md border border-rose-400 flex items-center gap-2 animate-bounce">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>⚠️ Videoni oldinga o'tkaza olmaysiz! Faqat o'tilgan qismlarni ko'rishingiz mumkin.</span>
        </div>
      )}
    </div>
  );
}
