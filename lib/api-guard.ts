import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * API route'larda ishlatiladigan umumiy ruxsat tekshiruvi.
 * requireAdmin=true bo'lsa faqat role === 'admin' o'ta oladi.
 */
export async function requireSession(requireAdmin = false) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 }) };
  }

  if (requireAdmin && session.user.role !== "admin") {
    return { session: null, error: NextResponse.json({ error: "Ruxsat yo'q (faqat admin uchun)" }, { status: 403 }) };
  }

  return { session, error: null };
}
