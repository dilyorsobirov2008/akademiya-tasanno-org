import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Video, ListChecks, ClipboardCheck, Award, ArrowUpRight, Sparkles } from "lucide-react";

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
    {
      href: "/dashboard/guides",
      label: "Yo'riqnomalar",
      count: guidesCount,
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600 border-blue-200/50",
      accent: "from-blue-500/20 to-indigo-500/20",
    },
    {
      href: "/dashboard/videos",
      label: "Video darsliklar",
      count: videosCount,
      icon: Video,
      color: "bg-purple-500/10 text-purple-600 border-purple-200/50",
      accent: "from-purple-500/20 to-pink-500/20",
    },
    {
      href: "/dashboard/quizzes",
      label: "Testlar",
      count: quizzesCount,
      icon: ListChecks,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
      accent: "from-emerald-500/20 to-teal-500/20",
    },
    {
      href: "/dashboard/checklists",
      label: "Check-listlar",
      count: "—",
      icon: ClipboardCheck,
      color: "bg-amber-500/10 text-amber-600 border-amber-200/50",
      accent: "from-amber-500/20 to-orange-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
              <Sparkles className="h-3.5 w-3.5" />
              <span>O'quv Portali</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Salom, {user.name}! 👋
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-800">{user.positionName}</span>
              <span>·</span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {user.branchName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ href, label, count, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`inline-flex rounded-xl p-3 border ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <div className="mt-4 space-y-0.5">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{count}</p>
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Test Results Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">So'nggi test natijalari</h2>
          </div>
        </div>

        {recentResults.length === 0 ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Hali test topshirmagansiz.</p>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                Tasanno Jamoasi
              </span>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md transition-all duration-300 hover:shadow-lg">
              <img
                src="/tasanno.png"
                alt="Tasanno jamoasi"
                className="w-full h-auto max-h-[460px] object-cover rounded-2xl transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {recentResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-slate-50/50 px-2 rounded-lg">
                <span className="font-medium text-slate-800">{r.quiz.title}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                  r.passed ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-red-50 text-red-700 border border-red-200/60"
                }`}>
                  {r.score}% {r.passed ? "✓" : "×"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
