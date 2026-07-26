import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FileText,
  Video,
  ListChecks,
  ClipboardCheck,
  Award,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";

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

  const passedCount = recentResults.filter((r) => r.passed).length;
  const avgScore =
    recentResults.length > 0
      ? Math.round(recentResults.reduce((s, r) => s + r.score, 0) / recentResults.length)
      : 0;

  const stats = [
    {
      href: "/dashboard/guides",
      label: "Yo'riqnomalar",
      count: guidesCount,
      icon: FileText,
      iconBg: "bg-blue-50 text-blue-600",
      border: "hover:border-blue-200",
      glow: "hover:shadow-blue-100/50",
    },
    {
      href: "/dashboard/videos",
      label: "Video darsliklar",
      count: videosCount,
      icon: Video,
      iconBg: "bg-purple-50 text-purple-600",
      border: "hover:border-purple-200",
      glow: "hover:shadow-purple-100/50",
    },
    {
      href: "/dashboard/quizzes",
      label: "Testlar",
      count: quizzesCount,
      icon: ListChecks,
      iconBg: "bg-emerald-50 text-emerald-600",
      border: "hover:border-emerald-200",
      glow: "hover:shadow-emerald-100/50",
    },
    {
      href: "/dashboard/checklists",
      label: "Check-listlar",
      count: "—",
      icon: ClipboardCheck,
      iconBg: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-200",
      glow: "hover:shadow-amber-100/50",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Welcome Hero ────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-purple-400/10 to-pink-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-blue-700">
              <Sparkles className="h-3 w-3" />
              Ichki Akademiya — O'quv Portali
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Salom, {user.name}! 👋
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-700">{user.positionName}</span>
              <span className="text-slate-400">·</span>
              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/60">
                {user.branchName}
              </span>
            </div>
          </div>

          {/* Mini progress summary */}
          {recentResults.length > 0 && (
            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200/60 bg-slate-50/80 px-4 py-3">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">O'rtacha ball</p>
                <p className="text-xl font-extrabold text-slate-900">{avgScore}%</p>
              </div>
              <div className="ml-3 h-10 w-px bg-slate-200" />
              <div>
                <p className="text-xs text-slate-500">O'tgan testlar</p>
                <p className="text-xl font-extrabold text-emerald-600">
                  {passedCount}/{recentResults.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ href, label, count, icon: Icon, iconBg, border, glow }) => (
          <Link
            key={href}
            href={href}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${border} ${glow}`}
          >
            {/* Background accent */}
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-slate-100 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className={`inline-flex rounded-xl p-2.5 ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 translate-x-1 -translate-y-1 text-slate-300 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:text-slate-500" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-slate-900">{count}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent Results ─────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="inline-flex rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">So'nggi test natijalari</h2>
            <p className="text-xs text-slate-500">
              {recentResults.length > 0
                ? `${recentResults.length} ta natija ko'rsatilmoqda`
                : "Hali hech qanday natija yo'q"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {recentResults.length === 0 ? (
            <div className="space-y-5">
              {/* Empty state message */}
              <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-sm text-slate-500">Hali test topshirmagansiz.</p>
                <Link
                  href="/dashboard/quizzes"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-200/60 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                >
                  Testlarga o'tish
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Team photo */}
              <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 shadow-md transition-all duration-300 hover:shadow-xl">
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent px-5 py-4">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Tasanno Guruhi</p>
                  <p className="text-base font-bold text-white">Bizning jamoa</p>
                </div>
                <img
                  src="/tasanno.png"
                  alt="Tasanno jamoasi"
                  className="h-auto max-h-[480px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentResults.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-slate-800">{r.quiz.title}</span>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      r.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {r.score}% {r.passed ? "✓" : "✗"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
