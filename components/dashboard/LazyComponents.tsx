"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { VideoPlayerProps } from "./VideoPlayerModal";
import type { PdfViewerModalProps } from "./PdfViewerModal";

/**
 * Skeleton Loader for heavy Video Player Component
 */
export const VideoPlayerSkeleton = () => (
  <div className="aspect-video w-full rounded-t-xl bg-slate-900 flex flex-col items-center justify-center gap-2 text-slate-400 animate-pulse">
    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
    <span className="text-xs font-medium">Video Player yuklanmoqda...</span>
  </div>
);

/**
 * Skeleton Loader for heavy PDF Viewer Modal Component
 */
export const PdfViewerSkeleton = () => (
  <div className="w-full h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-500 animate-pulse border border-slate-200">
    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
    <span className="text-sm font-semibold">PDF Hujjat O'quvchi tayyorlanmoqda...</span>
  </div>
);

/**
 * Lazy Loaded Video Player Component (CSR only, loaded on demand)
 */
export const LazyVideoPlayer = dynamic<VideoPlayerProps>(
  () => import("./VideoPlayerModal").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <VideoPlayerSkeleton />,
  }
);

/**
 * Lazy Loaded PDF Viewer Modal Component (CSR only, loaded on demand)
 */
export const LazyPdfViewerModal = dynamic<PdfViewerModalProps>(
  () => import("./PdfViewerModal").then((mod) => mod.PdfViewerModal),
  {
    ssr: false,
    loading: () => <PdfViewerSkeleton />,
  }
);
