import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-guard";
import { getPositionsCached } from "@/lib/cache";

export async function GET() {
  const { error } = await requireSession(false);
  if (error) return error;

  const positions = await getPositionsCached();
  return NextResponse.json({ positions });
}
