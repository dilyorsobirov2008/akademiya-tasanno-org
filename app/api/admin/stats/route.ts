import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";

// Vercel build vaqtida static generation'ni taqiqlash uchun
export const dynamic = "force-dynamic";

// GET /api/admin/stats -> Filiallar kesimida xodimlar soni, test natijalari, faollik
export async function GET() {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const branches = await prisma.branch.findMany({
      include: {
        users: { select: { id: true, status: true } },
      },
    });

    const branchStats = await Promise.all(
      branches.map(async (branch: { id: string; name: string; users: { id: string; status: string }[] }) => {
        const approvedUserIds = branch.users.filter((u: { id: string; status: string }) => u.status === "approved").map((u: { id: string; status: string }) => u.id);

        const avgResult = await prisma.quizResult.aggregate({
          where: { userId: { in: approvedUserIds } },
          _avg: { score: true },
          _count: { id: true },
        });

        const checklistCompletion = await prisma.checklistEntry.count({
          where: { branchId: branch.id, completed: true },
        });

        return {
          branch: branch.name,
          totalUsers: branch.users.length,
          approvedUsers: approvedUserIds.length,
          pendingUsers: branch.users.filter((u: { id: string; status: string }) => u.status === "pending").length,
          avgQuizScore: Math.round(avgResult._avg.score ?? 0),
          quizAttempts: avgResult._count.id,
          completedChecklists: checklistCompletion,
        };
      })
    );

    const totals = {
      totalUsers: branchStats.reduce((s, b) => s + b.totalUsers, 0),
      pendingApprovals: branchStats.reduce((s, b) => s + b.pendingUsers, 0),
      totalGuides: await prisma.guide.count(),
      totalVideos: await prisma.video.count(),
      totalQuizzes: await prisma.quiz.count(),
      totalChecklists: await prisma.checklist.count(),
    };

    return NextResponse.json({ branchStats, totals });
  } catch (err) {
    console.error("ADMIN_STATS_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
