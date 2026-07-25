import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";

// GET /api/quizzes/:id -> testni topshirish uchun (to'g'ri javob yashirilgan)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const role = session!.user.role as string;

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { select: { id: true, text: true, isCorrect: role === "admin" } } },
        },
      },
    });

    if (!quiz) return NextResponse.json({ error: "Test topilmadi" }, { status: 404 });

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error("QUIZ_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;
  try {
    await prisma.quiz.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "O'chirildi" });
  } catch (err) {
    console.error("QUIZ_DELETE_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
