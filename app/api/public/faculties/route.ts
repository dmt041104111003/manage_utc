import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const prismaAny = prisma as any;

  try {
    const [studentRows, supervisorRows] = await Promise.all([
      prismaAny.studentProfile?.findMany
        ? prismaAny.studentProfile.findMany({ distinct: ["faculty"], select: { faculty: true } })
        : Promise.resolve([]),
      prismaAny.supervisorProfile?.findMany
        ? prismaAny.supervisorProfile.findMany({ distinct: ["faculty"], select: { faculty: true } })
        : Promise.resolve([])
    ]);

    const faculties = Array.from(
      new Set(
        [...studentRows, ...supervisorRows]
          .map((r: any) => String(r?.faculty ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "vi"));

    return NextResponse.json({ success: true, faculties });
  } catch {
    return NextResponse.json({ success: true, faculties: [] });
  }
}

