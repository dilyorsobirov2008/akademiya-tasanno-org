import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { invalidateVideosCache } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, order, videoUrl, thumbnail, scope, branchId, positionId, quiz } = body;

    if (!title || !videoUrl || !order) {
      return NextResponse.json({ error: "Video nomi, URL va qism tartibi kiritilishi shart" }, { status: 400 });
    }

    // Start Prisma transaction to create Quiz, Questions, Options, and Video
    const result = await prisma.$transaction(async (tx) => {
      let createdQuizId: string | null = null;

      if (quiz && quiz.questions && quiz.questions.length > 0) {
        // 1. Create Quiz
        const newQuiz = await tx.quiz.create({
          data: {
            title: quiz.title || `${title} — Test`,
            description: `${order}-qism video darslik testi`,
            passScore: quiz.passScore ?? 80,
            scope: scope || "GLOBAL",
            branchId: scope === "BRANCH" ? branchId : null,
            positionId: scope === "POSITION" ? positionId : null,
          },
        });
        createdQuizId = newQuiz.id;

        // 2. Create Questions & Options
        for (let i = 0; i < quiz.questions.length; i++) {
          const q = quiz.questions[i];
          if (q.text && q.options && q.options.length > 0) {
            await tx.question.create({
              data: {
                quizId: createdQuizId,
                text: q.text,
                order: i + 1,
                options: {
                  create: q.options.map((opt: { text: string; isCorrect: boolean }) => ({
                    text: opt.text,
                    isCorrect: Boolean(opt.isCorrect),
                  })),
                },
              },
            });
          }
        }
      }

      // 3. Create Video Lesson attached to Quiz
      const video = await tx.video.create({
        data: {
          order: Number(order),
          title,
          description: body.description || `${order}-qism o'quv videosi`,
          videoUrl,
          thumbnail: thumbnail || null,
          scope: scope || "GLOBAL",
          branchId: scope === "BRANCH" ? branchId : null,
          positionId: scope === "POSITION" ? positionId : null,
          quizId: createdQuizId,
        },
      });

      return { video, quizId: createdQuizId };
    });

    invalidateVideosCache();

    return NextResponse.json(
      {
        message: "Video darslik va 10 talik test muvaffaqiyatli saqlandi!",
        video: result.video,
        quizId: result.quizId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("CREATE_VIDEO_WITH_QUIZ_ERROR", err);
    return NextResponse.json({ error: err?.message || "Server xatosi" }, { status: 500 });
  }
}
