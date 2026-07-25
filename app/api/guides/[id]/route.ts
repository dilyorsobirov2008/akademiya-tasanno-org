import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { guideSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = guideSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validatsiya xatosi" }, { status: 400 });
    }

    const guide = await prisma.guide.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ message: "Yangilandi", guide });
  } catch (err) {
    console.error("GUIDE_PATCH_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    await prisma.guide.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "O'chirildi" });
  } catch (err) {
    console.error("GUIDE_DELETE_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
