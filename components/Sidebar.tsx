"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { Session } from "next-auth";
import {
  LayoutDashboard,
  FileText,
  Video,
  ListChecks,
  ClipboardCheck,
  LogOut,
  Users,
  BarChart3,
  PlusCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  user?: Session["user"];
}

const employeeLinks = [
  { href: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/dashboard/guides", label: "Yo'riqnomalar", icon: FileText },
  { href: "/dashboard/videos", label: "Video darsliklar", icon: Video },
  { href: "/dashboard/quizzes", label: "Testlar", icon: ListChecks },
  { href: "/dashboard/checklists", label: "Check-listlar", icon: ClipboardCheck },
];

const adminLinks = [
  { href: "/admin/stats", label: "📊 Statistika", icon: BarChart3 },
  { href: "/admin/users", label: "👥 Xodimlarni tasdiqlash", icon: Users, isUsers: true },
  { href: "/admin/guides", label: "📄 PDF Yo'riqnomalar", icon: FileText },
  { href: "/admin/videos", label: "🎥 Video Darsliklar", icon: Video },
  { href: "/admin/quizzes", label: "📝 Testlar (Quiz)", icon: ListChecks },
  { href: "/admin/checklists", label: "✅ Check-listlar", icon: ClipboardCheck },
];

export function Sidebar({ user: propUser }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = propUser || session?.user;
  const isAdmin = user?.role === "admin";
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/admin/users?status=pending")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.users)) {
            setPendingCount(data.users.length);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin, pathname]);

  if (!user) return null;

  return (
    <aside className="flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 shrink-0 min-h-screen">
      <div>
        {/* Header Branding */}
        <div className="mb-6 px-2">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-slate-900">Ichki Akademiya</p>
            {isAdmin && (
              <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                <Sparkles className="h-3 w-3" /> ADMIN
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">
            {isAdmin ? "Bosh Administrator" : user.branchName ?? "Filial belgilanmagan"}
          </p>
        </div>

        {/* 👑 ADMIN PANEL MENU (Only for Admin) */}
        {isAdmin && (
          <div className="mb-6 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 rounded-md mb-2 flex items-center justify-between">
              <span>👑 Admin Boshqaruvi</span>
            </div>

            {adminLinks.map(({ href, label, icon: Icon, isUsers }) => {
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>

                  {isUsers && pendingCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-bold",
                        active ? "bg-white text-indigo-700" : "bg-amber-500 text-white"
                      )}
                    >
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* XODIMLAR MENU (Employee / General Views) */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isAdmin ? "👁️ Xodim Ko'rinishi" : "📌 Asosiy Menyular"}
          </div>

          {employeeLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer User Info & Logout */}
      <div className="border-t border-slate-200 pt-4">
        <div className="px-2 mb-2">
          <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
          <p className="text-xs text-slate-500 truncate">{user.positionName || (isAdmin ? "Administrator" : "Xodim")}</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="h-4 w-4" /> Chiqish
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
