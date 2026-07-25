import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { checklistSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const branchId = session!.user.branchId as string | null;
    const positionId = session!.user.positionId as string | null;
    const role = session!.user.role as string;
    const userId = session!.user.id as string;

    const { searchParams } = new URL(req.url);
    const periodDate = searchParams.get("periodDate") ?? new Date().toISOString().slice(0, 10);

    const checklists = await prisma.checklist.findMany({
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
      include: {
        branch: true,
        position: true,
        tasks: { orderBy: { order: "asc" } },
        entries:
          role === "admin"
            ? false
            : {
                where: { userId, periodDate: new Date(periodDate) },
                include: { items: true },
              },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ checklists });
  } catch (err) {
    console.error("CHECKLISTS_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = checklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tasks, ...data } = parsed.data;

    const checklist = await prisma.checklist.create({
      data: {
        title: data.title,
        frequency: data.frequency,
        scope: data.scope,
        branchId: data.scope === "BRANCH" ? data.branchId : null,
        positionId: data.scope === "POSITION" ? data.positionId : null,
        tasks: { create: tasks.map((t, idx) => ({ label: t.label, order: t.order ?? idx })) },
      },
      include: { tasks: true },
    });

    return NextResponse.json({ message: "Check-list yaratildi", checklist }, { status: 201 });
  } catch (err) {
    console.error("CHECKLISTS_POST_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
