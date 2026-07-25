import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-guard";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const { error } = await requireSession(true);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl yuborilmadi" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || ".bin";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      message: "Fayl muvaffaqiyatli yuklandi",
      fileUrl,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("UPLOAD_ERROR", err);
    return NextResponse.json({ error: "Fayl yuklashda xatolik yuz berdi" }, { status: 500 });
  }
}
