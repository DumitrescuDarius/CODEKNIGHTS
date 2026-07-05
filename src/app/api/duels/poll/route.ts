import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  try {
    const duel = await prisma.duel.findUnique({
      where: { pin },
      select: {
        id: true,
        status: true,
        hostPenalty: true,
        guestPenalty: true,
        hostFinalized: true,
        guestFinalized: true,
        hostRatingChange: true,
        guestRatingChange: true,
        hostSolveTime: true,
        guestSolveTime: true,
        hostComplexity: true,
        guestComplexity: true,
        hostCodeLength: true,
        guestCodeLength: true,
        hostLineCount: true,
        guestLineCount: true,
        hostTestsPassed: true,
        guestTestsPassed: true,
        hostTestsTotal: true,
        guestTestsTotal: true,
        hostLastActive: true,
        guestLastActive: true,
        host: true,
        guest: true,
        startedAt: true
      }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    return NextResponse.json({ ...duel, serverTime: Date.now() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
