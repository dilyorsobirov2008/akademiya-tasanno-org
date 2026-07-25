"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Branch, Position } from "@prisma/client";

export function RegisterForm({ branches, positions }: { branches: Branch[]; positions: Position[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Xatolik yuz berdi");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setServerError("Tarmoq xatosi. Qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Muvaffaqiyatli ro'yxatdan o'tdingiz! Admin tasdig'idan so'ng tizimga kira olasiz.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">F.I.Sh</label>
        <Input placeholder="Alisher Karimov" {...register("fullName")} />
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Telefon raqam</label>
        <Input placeholder="+998901234567" {...register("phone")} />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Parol</label>
        <Input type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Filial</label>
        <select
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          {...register("branchId")}
          defaultValue=""
        >
          <option value="" disabled>
            Filialni tanlang
          </option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {errors.branchId && <p className="mt-1 text-xs text-red-600">{errors.branchId.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Lavozim</label>
        <select
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
          {...register("positionId")}
          defaultValue=""
        >
          <option value="" disabled>
            Lavozimni tanlang
          </option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.positionId && <p className="mt-1 text-xs text-red-600">{errors.positionId.message}</p>}
      </div>

      {serverError && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Hisobingiz bormi?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Kirish
        </Link>
      </p>
    </form>
  );
}
