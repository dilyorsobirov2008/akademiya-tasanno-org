import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-guard";
import { getBranchesCached } from "@/lib/cache";

export async function GET() {
  const { error } = await requireSession(false);
  if (error) return error;

  const branches = await getBranchesCached();
  return NextResponse.json({ branches });
}
