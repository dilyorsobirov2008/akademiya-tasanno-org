import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { checklistSubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// POST /api/checklists/:id/submit  { periodDate, items: [{taskId, done}], note? }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = checklistSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validatsiya xatosi" }, { status: 400 });
    }

    const userId = session!.user.id as string;
    const branchId = session!.user.branchId as string | null;

    const { periodDate, items, note } = parsed.data;
    const allDone = items.every((i) => i.done);

    const entry = await prisma.checklistEntry.upsert({
      where: {
        checklistId_userId_periodDate: {
          checklistId: params.id,
          userId,
          periodDate: new Date(periodDate),
        },
      },
      create: {
        checklistId: params.id,
        userId,
        branchId,
        periodDate: new Date(periodDate),
        completed: allDone,
        note,
        items: { create: items.map((i) => ({ taskId: i.taskId, done: i.done })) },
      },
      update: {
        completed: allDone,
        note,
        items: {
          deleteMany: {},
          create: items.map((i) => ({ taskId: i.taskId, done: i.done })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ message: "Hisobot saqlandi", entry });
  } catch (err) {
    console.error("CHECKLIST_SUBMIT_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
