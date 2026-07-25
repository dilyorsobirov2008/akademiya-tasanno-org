"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { invalidateVideosCache } from "@/lib/cache";

export interface SubmitQuizPayload {
  quizId: string;
  answers: Record<string, string>; // { questionId: selectedOptionId }
}

export interface QuizSubmitResult {
  success: boolean;
  error?: string;
  passed?: boolean;
  score?: number;
  correct?: number;
  total?: number;
  message?: string;
  nextVideoId?: string | null;
}

export async function submitQuizAction(payload: SubmitQuizPayload): Promise<QuizSubmitResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Tizimga kirish talab etiladi (Unauthorized)" };
    }

    const userId = session.user.id;
    const { quizId, answers } = payload;

    if (!quizId || !answers) {
      return { success: false, error: "Noto'g'ri ma'lumotlar uzatildi" };
    }

    // Fetch quiz questions with correct options using optimized select
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        passScore: true,
        questions: {
          select: {
            id: true,
            options: {
              select: {
                id: true,
                isCorrect: true,
              },
            },
          },
        },
        videos: {
          select: {
            id: true,
            order: true,
          },
          take: 1,
        },
      },
    });

    if (!quiz) {
      return { success: false, error: "Test topilmadi" };
    }

    let correctCount = 0;
    const totalCount = quiz.questions.length;

    for (const question of quiz.questions) {
      const selectedOptionId = answers[question.id];
      if (selectedOptionId) {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (correctOption && correctOption.id === selectedOptionId) {
          correctCount++;
        }
      }
    }

    const scorePercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const isPassed = scorePercentage >= quiz.passScore;

    // 1. Save QuizResult record
    await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        userId: userId,
        score: scorePercentage,
        correct: correctCount,
        total: totalCount,
        answers: JSON.stringify(answers),
        passed: isPassed,
      },
    });

    let nextVideoId: string | null = null;
    const currentVideo = quiz.videos[0];

    if (currentVideo) {
      // 2. Update UserCourseProgress for current video
      await prisma.userCourseProgress.upsert({
        where: {
          userId_videoId: {
            userId,
            videoId: currentVideo.id,
          },
        },
        update: {
          isCompleted: true,
          quizScore: scorePercentage,
          isPassed: isPassed,
        },
        create: {
          userId,
          videoId: currentVideo.id,
          isCompleted: true,
          quizScore: scorePercentage,
          isPassed: isPassed,
        },
      });

      // 3. If passed, unlock next video in sequence
      if (isPassed) {
        const nextVideo = await prisma.video.findFirst({
          where: {
            order: { gt: currentVideo.order },
          },
          select: { id: true },
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
            update: {
              unlockedAt: new Date(),
            },
            create: {
              userId,
              videoId: nextVideo.id,
              unlockedAt: new Date(),
            },
          });
        }
      }
    }

    // Invalidate caches & paths
    invalidateVideosCache();
    revalidatePath("/dashboard/videos");
    if (currentVideo) {
      revalidatePath(`/dashboard/videos/${currentVideo.id}`);
    }

    const message = isPassed
      ? `🎉 TABRIKLAYMIZ! Natijangiz: ${correctCount}/${totalCount} (${scorePercentage}%). Testdan muvaffaqiyatli o'tdingiz! Keyingi darslik o'z-o'zidan ochildi.`
      : `❌ Natijangiz: ${correctCount}/${totalCount} (${scorePercentage}%). Siz keyingi bosqichga o'ta olmaysiz. O'tish uchun kamida 80% (8 ta to'g'ri) to'plashingiz kerak. Qaytadan urinib ko'ring.`;

    return {
      success: true,
      passed: isPassed,
      score: scorePercentage,
      correct: correctCount,
      total: totalCount,
      message,
      nextVideoId,
    };
  } catch (err: any) {
    console.error("SUBMIT_QUIZ_ACTION_ERROR", err);
    return { success: false, error: err?.message || "Serverda kutilmagan xato yuz berdi" };
  }
}
