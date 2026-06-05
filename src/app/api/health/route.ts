import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      db: "connected",
    });
  } catch (error: unknown) {
    const e = error as Record<string, unknown>;
    return NextResponse.json({
      status: "error",
      db: "disconnected",
      message: typeof e?.message === 'string' ? e.message : String(error),
      code: typeof e?.code === 'string' ? e.code : undefined,
    });
  }
}
