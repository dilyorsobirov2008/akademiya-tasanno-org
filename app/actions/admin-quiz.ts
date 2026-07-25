"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface QuestionInput {
  text: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface AdminQuizSavePayload {
  videoId: string;
  passScore?: number; // default 80 (%)
  title?: string;
  questions: QuestionInput[];
}

export interface AdminQuizSaveResult {
  success: boolean;
  error?: string;
  quizId?: string;
}

/**
 * Server Action: Videoga 10 ta savoldan iborat test biriktiradi yoki mavjudini to'liq almashtiradi.
 * Prisma $transaction orqali quiz + savol + variantlar atomik saqlanadi.
 */
export async function saveVideoQuizAction(
  payload: AdminQuizSavePayload
): Promise<AdminQuizSaveResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return { success: false, error: "Ruxsat yo'q: faqat admin test qo'sha oladi." };
    }

    const { videoId, passScore = 80, title, questions } = payload;

    if (!videoId) {
      return { success: false, error: "videoId talab etiladi." };
    }
    if (!questions || questions.length === 0) {
      return { success: false, error: "Kamida 1 ta savol kiritilishi shart." };
    }

    // Validate all questions have exactly 1 correct answer
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text?.trim()) {
        return { success: false, error: `${i + 1}-savol matni kiritilmagan.` };
      }
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        return {
          success: false,
          error: `${i + 1}-savol uchun aynan 1 ta to'g'ri javob belgilanishi kerak.`,
        };
      }
    }

    // Fetch video to build default quiz title
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, title: true, order: true, quizId: true },
    });

    if (!video) {
      return { success: false, error: "Video topilmadi." };
    }

    const quizTitle =
      title?.trim() || `${video.order}-qism: ${video.title} — 10 talik Test`;

    let quizId: string;

    await prisma.$transaction(async (tx) => {
      // If video already has a quiz, delete it (cascade deletes questions & options)
      if (video.quizId) {
        await tx.quiz.delete({ where: { id: video.quizId } });
      }

      // Create brand-new Quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title: quizTitle,
          passScore,
          scope: "GLOBAL",
          questions: {
            create: questions.map((q, idx) => ({
              text: q.text.trim(),
              order: idx + 1,
              options: {
                create: q.options.map((opt) => ({
                  text: opt.text.trim(),
                  isCorrect: opt.isCorrect,
                })),
              },
            })),
          },
        },
      });

      quizId = newQuiz.id;

      // Link quiz to video
      await tx.video.update({
        where: { id: videoId },
        data: { quizId: newQuiz.id },
      });
    });

    revalidatePath("/admin/videos");
    revalidatePath("/admin/content/videos");
    revalidatePath("/dashboard/videos");

    return { success: true, quizId: quizId! };
  } catch (err: any) {
    console.error("SAVE_VIDEO_QUIZ_ACTION_ERROR", err);
    return { success: false, error: err?.message || "Serverda kutilmagan xato yuz berdi." };
  }
}
