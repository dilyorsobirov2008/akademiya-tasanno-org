import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { videoSchema } from "@/lib/validations";
import { getOptimizedMediaUrl } from "@/lib/cdn";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const userId = session!.user.id as string;
    const role = session!.user.role as string;

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        order: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnail: true,
        duration: true,
        scope: true,
        quizId: true,
        quiz: {
          select: {
            id: true,
            title: true,
            passScore: true,
            questions: {
              select: {
                id: true,
                text: true,
                order: true,
                options: {
                  select: { id: true, text: true },
                },
              },
              orderBy: { order: "asc" },
            },
            results: {
              where: { userId },
              select: { score: true, correct: true, total: true, passed: true, createdAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        courseProgress: {
          where: { userId },
          select: { isCompleted: true, quizScore: true, isPassed: true, unlockedAt: true },
        },
        watchedBy: {
          where: { userId },
          select: { createdAt: true },
        },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video topilmadi" }, { status: 404 });
    }

    // Find next video in sequence
    const nextVideo = await prisma.video.findFirst({
      where: { order: { gt: video.order } },
      select: {
        id: true,
        order: true,
        title: true,
        courseProgress: {
          where: { userId },
          select: { unlockedAt: true, isPassed: true },
        },
      },
      orderBy: { order: "asc" },
    });

    const progress = video.courseProgress[0];
    const quizResult = video.quiz?.results[0];
    const isPassed = progress?.isPassed || (quizResult?.passed ?? false);
    const isNextUnlocked = role === "admin" || isPassed || Boolean(nextVideo?.courseProgress[0]?.unlockedAt);

    return NextResponse.json({
      video: {
        ...video,
        videoUrl: getOptimizedMediaUrl(video.videoUrl, "video"),
        isCompleted: progress?.isCompleted ?? false,
        isPassed,
        quizScore: progress?.quizScore ?? (quizResult?.score ?? 0),
        isWatched: video.watchedBy.length > 0,
      },
      nextVideo: nextVideo
        ? {
            id: nextVideo.id,
            order: nextVideo.order,
            title: nextVideo.title,
            isUnlocked: isNextUnlocked,
          }
        : null,
    });
  } catch (err) {
    console.error("VIDEO_GET_ID_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = videoSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Validatsiya xatosi" }, { status: 400 });

    const video = await prisma.video.update({ where: { id: params.id }, data: parsed.data });
    return NextResponse.json({ message: "Yangilandi", video });
  } catch (err) {
    console.error("VIDEO_PATCH_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    await prisma.video.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "O'chirildi" });
  } catch (err) {
    console.error("VIDEO_DELETE_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
