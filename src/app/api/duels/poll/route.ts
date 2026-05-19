import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        guestRatingChange: true
      }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    return NextResponse.json(duel);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
