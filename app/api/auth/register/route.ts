import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validatsiya xatosi", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, phone, password, branchId, positionId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Bu telefon raqam bilan foydalanuvchi allaqachon mavjud" },
        { status: 409 }
      );
    }

    const [branch, position] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.position.findUnique({ where: { id: positionId } }),
    ]);
    if (!branch) return NextResponse.json({ error: "Filial topilmadi" }, { status: 404 });
    if (!position) return NextResponse.json({ error: "Lavozim topilmadi" }, { status: 404 });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        phone,
        passwordHash,
        branchId,
        positionId,
        status: "pending",
        role: "employee",
      },
      select: { id: true, fullName: true, phone: true, status: true },
    });

    return NextResponse.json(
      {
        message: "Ro'yxatdan o'tish muvaffaqiyatli. Admin tasdig'ini kuting.",
        user,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("REGISTER_ERROR", err);
    return NextResponse.json({ error: "Server xatosi yuz berdi" }, { status: 500 });
  }
}
