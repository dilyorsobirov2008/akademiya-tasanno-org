"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface MarkWatchedResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Video 100% ko'rib bo'linganda avtomatik chaqiriladi.
 * Bazada VideoWatched va UserCourseProgress jadvallarini yangilaydi.
 */
export async function markVideoAsWatchedAction(videoId: string): Promise<MarkWatchedResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Tizimga kirish talab etiladi." };
    }

    const userId = session.user.id;

    if (!videoId) {
      return { success: false, error: "videoId talab etiladi." };
    }

    // 1. Record in VideoWatched relation (ignore duplicate unique constraint if already exists)
    await prisma.videoWatched.upsert({
      where: {
        videoId_userId: {
          videoId,
          userId,
        },
      },
      update: {},
      create: {
        videoId,
        userId,
      },
    });

    // 2. Mark progress as completed in UserCourseProgress
    await prisma.userCourseProgress.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        isCompleted: true,
      },
      create: {
        userId,
        videoId,
        isCompleted: true,
      },
    });

    revalidatePath("/dashboard/videos");
    revalidatePath(`/dashboard/videos/${videoId}`);

    return { success: true };
  } catch (error: any) {
    console.error("MARK_VIDEO_WATCHED_ACTION_ERROR:", error);
    return { success: false, error: error?.message || "Server xatosi" };
  }
}

export async function markVideoAsWatched(userId: string, videoId: number | string): Promise<MarkWatchedResult> {
  return markVideoAsWatchedAction(String(videoId));
}

