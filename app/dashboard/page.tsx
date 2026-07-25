import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Video, ListChecks, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

  const [guidesCount, videosCount, quizzesCount, recentResults] = await Promise.all([
    prisma.guide.count({
      where: { OR: [{ scope: "GLOBAL" }, { scope: "BRANCH", branchId: user.branchId ?? undefined }] },
    }),
    prisma.video.count({
      where: { OR: [{ scope: "GLOBAL" }, { scope: "BRANCH", branchId: user.branchId ?? undefined }] },
    }),
    prisma.quiz.count({
      where: { OR: [{ scope: "GLOBAL" }, { scope: "BRANCH", branchId: user.branchId ?? undefined }] },
    }),
    prisma.quizResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { quiz: { select: { title: true } } },
    }),
  ]);

  const cards = [
    { href: "/dashboard/guides", label: "Yo'riqnomalar", count: guidesCount, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { href: "/dashboard/videos", label: "Video darsliklar", count: videosCount, icon: Video, color: "bg-purple-50 text-purple-600" },
    { href: "/dashboard/quizzes", label: "Testlar", count: quizzesCount, icon: ListChecks, color: "bg-emerald-50 text-emerald-600" },
    { href: "/dashboard/checklists", label: "Check-listlar", count: "—", icon: ClipboardCheck, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-900">Salom, {user.name}! 👋</h1>
        <p className="mt-1 text-sm text-slate-500">
          {user.positionName} · {user.branchName}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ href, label, count, icon: Icon, color }) => (
          <Link key={href} href={href} className="card p-5 transition hover:shadow-md">
            <div className={`inline-flex rounded-lg p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-slate-900">So'nggi test natijalari</h2>
        {recentResults.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Hali test topshirmagansiz.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recentResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-700">{r.quiz.title}</span>
                <span className={r.passed ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                  {r.score}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
