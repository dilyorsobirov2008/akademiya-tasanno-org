import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

// GET /api/admin/users?status=pending&branchId=...&positionId=...
export async function GET(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const branchId = searchParams.get("branchId") || undefined;
    const positionId = searchParams.get("positionId") || undefined;

    const users = await prisma.user.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(branchId ? { branchId } : {}),
        ...(positionId ? { positionId } : {}),
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        branchId: true,
        positionId: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("ADMIN_USERS_GET_ERROR", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
