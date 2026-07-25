import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { videoSchema } from "@/lib/validations";
import { getOptimizedMediaUrl } from "@/lib/cdn";
import { invalidateVideosCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const userId = session!.user.id as string;
    const branchId = session!.user.branchId as string | null;
    const positionId = session!.user.positionId as string | null;
    const role = session!.user.role as string;

    const rawVideos = await prisma.video.findMany({
      where:
        role === "admin"
          ? {}
          : {
              OR: [
                { scope: "GLOBAL" },
                { scope: "BRANCH", branchId: branchId ?? undefined },
                { scope: "POSITION", positionId: positionId ?? undefined },
              ],
            },
      select: {
        id: true,
        order: true,
        title: true,
        description: true,
        videoUrl: true,
        thumbnail: true,
        duration: true,
        scope: true,
        branchId: true,
        positionId: true,
        quizId: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        watchedBy: {
          where: { userId },
          select: { id: true, createdAt: true },
        },
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
                options: { select: { id: true, text: true, isCorrect: true } },
              },
              orderBy: { order: "asc" },
            },
            results: {
              where: { userId },
              select: { score: true, passed: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        courseProgress: {
          where: { userId },
          select: { isCompleted: true, quizScore: true, isPassed: true, unlockedAt: true },
        },
      },
      orderBy: { order: "asc" },
    });

    // Sequential Unlock Evaluation & CDN URL Optimization
    const videos = rawVideos.map((video, index) => {
      const progress = video.courseProgress[0];
      const quizResult = video.quiz?.results[0];
      const optimizedUrl = getOptimizedMediaUrl(video.videoUrl, "video");

      // Admin has full access to everything
      if (role === "admin") {
        return {
          ...video,
          videoUrl: optimizedUrl,
          isUnlocked: true,
          isCompleted: progress?.isCompleted ?? false,
          isPassed: progress?.isPassed ?? (quizResult?.passed ?? false),
          quizScore: progress?.quizScore ?? (quizResult?.score ?? 0),
        };
      }

      // First lesson (index 0) is always unlocked
      if (index === 0) {
        return {
          ...video,
          videoUrl: optimizedUrl,
          isUnlocked: true,
          isCompleted: progress?.isCompleted ?? false,
          isPassed: progress?.isPassed ?? (quizResult?.passed ?? false),
          quizScore: progress?.quizScore ?? (quizResult?.score ?? 0),
        };
      }

      // Subsequent lessons depend on previous lesson being PASSED
      const prevVideo = rawVideos[index - 1];
      const prevProgress = prevVideo.courseProgress[0];
      const prevQuizResult = prevVideo.quiz?.results[0];
      const prevPassed = prevProgress?.isPassed || (prevQuizResult?.passed ?? false);

      const isUnlocked = Boolean(progress?.unlockedAt || prevPassed);

      return {
        ...video,
        videoUrl: optimizedUrl,
        isUnlocked,
        isCompleted: progress?.isCompleted ?? false,
        isPassed: progress?.isPassed ?? (quizResult?.passed ?? false),
        quizScore: progress?.quizScore ?? (quizResult?.score ?? 0),
      };
    });

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("VIDEOS_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = videoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get max order using select projection
    const maxVideo = await prisma.video.findFirst({
      select: { order: true },
      orderBy: { order: "desc" },
    });
    const order = (maxVideo?.order ?? 0) + 1;

    const video = await prisma.video.create({
      data: {
        order,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        thumbnail: data.thumbnail,
        duration: data.duration,
        scope: data.scope,
        branchId: data.scope === "BRANCH" ? data.branchId : null,
        positionId: data.scope === "POSITION" ? data.positionId : null,
      },
    });

    invalidateVideosCache();

    return NextResponse.json({ message: "Video qo'shildi", video }, { status: 201 });
  } catch (err) {
    console.error("VIDEOS_POST_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
