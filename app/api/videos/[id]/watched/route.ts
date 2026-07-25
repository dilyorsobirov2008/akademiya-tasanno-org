import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

// POST /api/videos/:id/watched -> video tomosha qilingan deb belgilash
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const userId = session!.user.id as string;

    const watched = await prisma.videoWatched.upsert({
      where: {
        videoId_userId: {
          videoId: params.id,
          userId,
        },
      },
      create: {
        videoId: params.id,
        userId,
      },
      update: {},
    });

    return NextResponse.json({ message: "Video ko'rib bo'lingan deb belgilandi", watched });
  } catch (err) {
    console.error("VIDEO_WATCHED_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
