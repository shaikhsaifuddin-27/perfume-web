import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      db: "connected",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      db: "disconnected",
      message: error?.message,
      code: error?.code,
    });
  }
}
