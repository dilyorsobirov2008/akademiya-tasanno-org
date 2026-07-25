import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={session.user} />
      <main className="flex-1 bg-slate-50 p-6 lg:p-10">{children}</main>
    </div>
  );
}
