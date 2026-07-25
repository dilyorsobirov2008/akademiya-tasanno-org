"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Clock, AlertTriangle, RefreshCw, LogOut, Building, Briefcase, UserCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserStatusInfo {
  status: "pending" | "approved" | "rejected";
  fullName: string;
  phone: string;
  branchName: string | null;
  positionName: string | null;
}

export default function PendingApprovalPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<UserStatusInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/status");
      if (res.ok) {
        const data: UserStatusInfo = await res.json();
        setInfo(data);
        if (data.status === "approved") {
          await update();
          router.push("/dashboard");
          return;
        }
      }
    } catch {
      setMessage("Holatni tekshirishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [router, update]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const isRejected = info?.status === "rejected";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Status Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-slate-800/80 border border-slate-700 shadow-inner mb-2">
            {isRejected ? (
              <ShieldAlert className="h-12 w-12 text-rose-500 animate-pulse" />
            ) : (
              <Clock className="h-12 w-12 text-amber-400 animate-bounce" />
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {isRejected ? "So'rov Rad Etilgan" : "Kutish Rejimida"}
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed px-2">
            {isRejected ? (
              <span className="text-rose-400 font-medium">
                ❌ Sizning platformaga a'zo bo'lish so'rovingiz administrator tomonidan rad etildi. Boshqa savollar uchun kompaniya rahbariyati bilan bog'laning.
              </span>
            ) : (
              <span>
                ⏳ Sizning so'rovingiz admin tomonidan ko'rib chiqilmoqda. Tasdiqlangandan so'ng tizimdan to'liq foydalanishingiz mumkin.
              </span>
            )}
          </p>
        </div>

        {/* User Info Details */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Arizachi ma'lumotlari</p>

          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">F.I.Sh:</span>
              <span className="font-semibold text-white">{info?.fullName || session?.user?.name || "—"}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-indigo-400" /> Filial:
              </span>
              <span className="font-medium text-slate-200">{info?.branchName || session?.user?.branchName || "—"}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-indigo-400" /> Lavozim:
              </span>
              <span className="font-medium text-slate-200">{info?.positionName || session?.user?.positionName || "—"}</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isRejected && (
            <Button
              onClick={checkStatus}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl shadow-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Tekshirilmoqda..." : "🔄 Holatni Qayta Tekshirish"}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </Button>
        </div>

        <div className="text-center">
          <span className="text-[11px] text-slate-500">Ichki Akademiya &copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
