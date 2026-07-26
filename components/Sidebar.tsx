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
  ShieldCheck,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  user?: Session["user"];
}

const employeeLinks = [
  { href: "/dashboard",            label: "Bosh sahifa",     icon: LayoutDashboard },
  { href: "/dashboard/guides",     label: "Yo'riqnomalar",   icon: FileText },
  { href: "/dashboard/videos",     label: "Video darsliklar", icon: Video },
  { href: "/dashboard/quizzes",    label: "Testlar",          icon: ListChecks },
  { href: "/dashboard/checklists", label: "Check-listlar",   icon: ClipboardCheck },
];

const adminLinks = [
  { href: "/admin/stats",      label: "Statistika",           icon: BarChart3 },
  { href: "/admin/users",      label: "Xodimlar",             icon: Users, isUsers: true },
  { href: "/admin/guides",     label: "PDF Yo'riqnomalar",    icon: FileText },
  { href: "/admin/videos",     label: "Video Darsliklar",     icon: Video },
  { href: "/admin/quizzes",    label: "Testlar (Quiz)",       icon: ListChecks },
  { href: "/admin/checklists", label: "Check-listlar",        icon: ClipboardCheck },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  variant = "default",
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge?: number;
  variant?: "default" | "admin";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? variant === "admin"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50"
            : "bg-blue-600 text-white shadow-md shadow-blue-200/50"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-white" : "text-slate-500 group-hover:text-slate-700"
          )}
        />
        <span className="truncate">{label}</span>
      </div>

      {badge && badge > 0 ? (
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-bold",
            active ? "bg-white/20 text-white" : "bg-amber-500 text-white"
          )}
        >
          {badge}
        </span>
      ) : active ? (
        <ChevronRight className="h-3.5 w-3.5 text-white/70" />
      ) : null}
    </Link>
  );
}

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
          if (Array.isArray(data.users)) setPendingCount(data.users.length);
        })
        .catch(() => {});
    }
  }, [isAdmin, pathname]);

  if (!user) return null;

  const userInitial = user.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white min-h-screen">
      {/* ── Logo / Branding ───────────────────────── */}
      <div className="border-b border-slate-200/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200/50">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-slate-900">Ichki Akademiya</p>
            <p className="mt-0.5 text-[11px] text-slate-500 truncate max-w-[130px]">
              {isAdmin ? "Bosh Administrator" : (user.branchName ?? "Filial belgilanmagan")}
            </p>
          </div>
          {isAdmin && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              <ShieldCheck className="h-3 w-3" />
              ADMIN
            </span>
          )}
        </div>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">

        {/* Admin section */}
        {isAdmin && (
          <div className="space-y-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              👑 Admin Boshqaruvi
            </p>
            {adminLinks.map(({ href, label, icon, isUsers }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                icon={icon}
                active={pathname === href || (href !== "/admin" && pathname.startsWith(href))}
                badge={isUsers ? pendingCount : undefined}
                variant="admin"
              />
            ))}
          </div>
        )}

        {/* Divider for admin */}
        {isAdmin && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center px-3">
              <div className="w-full border-t border-slate-200/80" />
            </div>
          </div>
        )}

        {/* Employee section */}
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isAdmin ? "👁 Xodim ko'rinishi" : "📌 Asosiy Menyular"}
          </p>
          {employeeLinks.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href}
            />
          ))}
        </div>
      </nav>

      {/* ── User footer ──────────────────────────── */}
      <div className="border-t border-slate-200/80 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">
              {user.positionName || (isAdmin ? "Administrator" : "Xodim")}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Chiqish
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
