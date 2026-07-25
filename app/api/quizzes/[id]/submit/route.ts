import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { quizSubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// POST /api/quizzes/:id/submit
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(false);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validatsiya xatosi" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: { include: { options: true } },
        videos: true,
      },
    });
    if (!quiz) return NextResponse.json({ error: "Test topilmadi" }, { status: 404 });

    let correct = 0;
    const total = quiz.questions.length;

    for (const question of quiz.questions) {
      const selectedOptionId = parsed.data.answers[question.id];
      const correctOption = question.options.find((o) => o.isCorrect);
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        correct += 1;
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passThreshold = quiz.passScore ?? 80;
    const passed = score >= passThreshold;

    const userId = session!.user.id;

    // Save quiz result
    const result = await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        userId,
        score,
        correct,
        total,
        answers: JSON.stringify(parsed.data.answers),
        passed,
      },
    });

    let nextVideoId: string | null = null;
    const associatedVideo = quiz.videos[0] || (await prisma.video.findFirst({ where: { quizId: quiz.id } }));

    if (associatedVideo) {
      // Upsert current course progress
      await prisma.userCourseProgress.upsert({
        where: {
          userId_videoId: {
            userId,
            videoId: associatedVideo.id,
          },
        },
        update: {
          isCompleted: passed,
          isPassed: passed,
          quizScore: score,
        },
        create: {
          userId,
          videoId: associatedVideo.id,
          isCompleted: passed,
          isPassed: passed,
          quizScore: score,
        },
      });

      // If passed, unlock next video in sequence
      if (passed) {
        const nextVideo = await prisma.video.findFirst({
          where: {
            order: { gt: associatedVideo.order },
          },
          orderBy: { order: "asc" },
        });

        if (nextVideo) {
          nextVideoId = nextVideo.id;
          await prisma.userCourseProgress.upsert({
            where: {
              userId_videoId: {
                userId,
                videoId: nextVideo.id,
              },
            },
            update: { unlockedAt: new Date() },
            create: {
              userId,
              videoId: nextVideo.id,
              isCompleted: false,
              isPassed: false,
              quizScore: 0,
              unlockedAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({
      passed,
      score,
      correct,
      total,
      nextVideoId,
      message: passed
        ? `🎉 Tabriklaymiz! Siz testdan o'tdingiz (${correct}/${total}). Keyingi darslik ochildi!`
        : `❌ Natijangiz: ${correct}/${total}. Siz yetarli ball (kamida ${passThreshold}%) to'play olmadingiz. Qaytadan urinib ko'ring.`,
      result,
    });
  } catch (err) {
    console.error("QUIZ_SUBMIT_GATEKEEPER_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
