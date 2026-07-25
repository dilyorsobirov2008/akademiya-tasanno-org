"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setServerError(null);

    const result = await signIn("credentials", {
      phone: data.phone,
      password: data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Ichki Akademiya</h1>
        <p className="mt-1 text-sm text-slate-500">Hisobingizga kiring</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Hisobingiz yo'qmi?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>
    </div>
  );
}
