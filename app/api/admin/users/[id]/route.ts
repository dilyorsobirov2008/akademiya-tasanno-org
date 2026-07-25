import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-guard";
import { userStatusUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";


export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = userStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.role) updateData.role = parsed.data.role;
    if (parsed.data.branchId !== undefined) updateData.branchId = parsed.data.branchId;
    if (parsed.data.positionId !== undefined) updateData.positionId = parsed.data.positionId;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Foydalanuvchi ma'lumotlari yangilandi",
      user,
    });
  } catch (err) {
    console.error("ADMIN_USER_PATCH_ERROR", err);
    return NextResponse.json({ error: "Foydalanuvchi topilmadi yoki server xatosi" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Foydalanuvchi o'chirildi" });
  } catch (err) {
    console.error("ADMIN_USER_DELETE_ERROR", err);
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}
