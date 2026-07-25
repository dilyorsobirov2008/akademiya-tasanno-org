import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { quizSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const branchId = session!.user.branchId as string | null;
    const positionId = session!.user.positionId as string | null;
    const role = session!.user.role as string;
    const userId = session!.user.id as string;

    const quizzes = await prisma.quiz.findMany({
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
        _count: { select: { questions: true } },
        results: role === "admin" ? false : { where: { userId }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quizzes });
  } catch (err) {
    console.error("QUIZZES_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { questions, ...quizData } = parsed.data;

    for (const q of questions) {
      if (!q.options.some((o) => o.isCorrect)) {
        return NextResponse.json(
          { error: `"${q.text}" savolida to'g'ri javob belgilanmagan` },
          { status: 400 }
        );
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        scope: quizData.scope,
        passScore: quizData.passScore,
        branchId: quizData.scope === "BRANCH" ? quizData.branchId : null,
        positionId: quizData.scope === "POSITION" ? quizData.positionId : null,
        questions: {
          create: questions.map((q, idx) => ({
            text: q.text,
            order: q.order ?? idx,
            options: { create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) },
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });

    return NextResponse.json({ message: "Test yaratildi", quiz }, { status: 201 });
  } catch (err) {
    console.error("QUIZZES_POST_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
