import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { guideSchema } from "@/lib/validations";
import { getOptimizedMediaUrl } from "@/lib/cdn";
import { invalidateGuidesCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const branchId = session!.user.branchId as string | null;
    const positionId = session!.user.positionId as string | null;
    const role = session!.user.role as string;

    const rawGuides = await prisma.guide.findMany({
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
        title: true,
        description: true,
        fileUrl: true,
        fileSize: true,
        scope: true,
        branchId: true,
        positionId: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const guides = rawGuides.map((guide) => ({
      ...guide,
      fileUrl: getOptimizedMediaUrl(guide.fileUrl, "pdf"),
    }));

    return NextResponse.json({ guides });
  } catch (err) {
    console.error("GUIDES_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = guideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const guide = await prisma.guide.create({
      data: {
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        scope: data.scope,
        branchId: data.scope === "BRANCH" ? data.branchId : null,
        positionId: data.scope === "POSITION" ? data.positionId : null,
      },
    });

    invalidateGuidesCache();

    return NextResponse.json({ message: "Yo'riqnoma qo'shildi", guide }, { status: 201 });
  } catch (err) {
    console.error("GUIDES_POST_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
