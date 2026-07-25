import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 bg-slate-50 p-6 lg:p-10">{children}</main>
    </div>
  );
}
