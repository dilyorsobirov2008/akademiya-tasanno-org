/**
 * ICHKI AKADEMIYA — CDN & Media Streaming Utility
 * Optimizes PDF documents and Video assets delivery via CDN (Cloudflare Stream, Bunny CDN, AWS S3, Supabase)
 */

export interface CDNConfig {
  provider: "cloudflare" | "bunny" | "supabase" | "s3" | "local";
  baseUrl?: string;
}

const DEFAULT_CDN_PROVIDER = (process.env.NEXT_PUBLIC_CDN_PROVIDER as CDNConfig["provider"]) || "local";
const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_BASE_URL || "";

/**
 * Transforms standard media URLs into optimized CDN streaming links.
 * Handles HLS / DASH adaptive bitrate video streaming & CDN PDF caching headers.
 */
export function getOptimizedMediaUrl(
  url: string,
  type: "video" | "pdf" | "image" = "video"
): string {
  if (!url) return "";

  // External URLs (YouTube, Vimeo, Cloudflare Stream direct embeds) pass through directly
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) {
      return url;
    }
  }

  const provider = DEFAULT_CDN_PROVIDER;

  switch (provider) {
    case "cloudflare":
      // Cloudflare Stream HLS pattern: https://customer-code.cloudflarestream.com/VIDEO_ID/manifest/video.m3u8
      if (type === "video" && !url.includes(".m3u8")) {
        return `${CDN_BASE_URL}/${url}/manifest/video.m3u8`;
      }
      return `${CDN_BASE_URL}/${url}`;

    case "bunny":
      // Bunny CDN Direct Pull Stream: https://cdn.ichki-akademiya.b-cdn.net/videos/...
      return `${CDN_BASE_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

    case "supabase":
      // Supabase Storage CDN: https://[project].supabase.co/storage/v1/object/public/media/...
      return `${CDN_BASE_URL.replace(/\/$/, "")}/storage/v1/object/public/media/${url.replace(/^\//, "")}`;

    case "s3":
      // AWS CloudFront S3 CDN
      return `${CDN_BASE_URL.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;

    case "local":
    default:
      return url.startsWith("/") ? url : `/${url}`;
  }
}

/**
 * Returns HTTP cache headers suitable for static media delivery
 */
export function getMediaCacheHeaders(maxAgeSeconds = 31536000) {
  return {
    "Cache-Control": `public, max-age=${maxAgeSeconds}, immutable`,
    "Accept-Ranges": "bytes",
  };
}
