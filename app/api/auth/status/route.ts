import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { branch: true, position: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
  }

  return NextResponse.json({
    status: user.status,
    role: user.role,
    fullName: user.fullName,
    phone: user.phone,
    branchName: user.branch?.name ?? null,
    positionName: user.position?.name ?? null,
  });
}
