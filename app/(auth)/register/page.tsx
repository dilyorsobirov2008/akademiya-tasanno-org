import { prisma } from "@/lib/prisma";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const [branches, positions] = await Promise.all([
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
    prisma.position.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">Ro'yxatdan o'tish</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ma'lumotlaringizni to'ldiring. Admin tasdiqlagandan so'ng kirish imkoniyati ochiladi.
        </p>
        <RegisterForm branches={branches} positions={positions} />
      </div>
    </div>
  );
}
