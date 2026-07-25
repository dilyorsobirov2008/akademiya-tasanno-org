"use client";

import React from "react";

export interface VideoPlayerProps {
  url: string;
  title: string;
  thumbnail?: string | null;
}

export function VideoPlayer({ url, title, thumbnail }: VideoPlayerProps) {
  if (!url) return null;

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
        className="aspect-video w-full rounded-t-xl bg-black shadow-inner"
      />
    );
  }

  // Native CDN / HTML5 Video player with controls & preloading
  return (
    <video
      controls
      preload="metadata"
      playsInline
      className="aspect-video w-full rounded-t-xl bg-black shadow-inner"
      poster={thumbnail ?? undefined}
    >
      <source src={url} />
      Sizning brauzeringiz video ijrosini qo'llab-quvvatlamaydi.
    </video>
  );
}
