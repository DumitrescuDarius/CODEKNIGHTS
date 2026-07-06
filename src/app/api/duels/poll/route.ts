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
    const selectFields = {
      id: true, pin: true, status: true,
      hostPenalty: true, guestPenalty: true,
      hostFinalized: true, guestFinalized: true,
      hostRatingChange: true, guestRatingChange: true,
      hostSolveTime: true, guestSolveTime: true,
      hostComplexity: true, guestComplexity: true,
      hostCodeLength: true, guestCodeLength: true,
      hostLineCount: true, guestLineCount: true,
      hostTestsPassed: true, guestTestsPassed: true,
      hostTestsTotal: true, guestTestsTotal: true,
      hostLastActive: true, guestLastActive: true,
      host: true, guest: true, startedAt: true,
      question: true, hostId: true, guestId: true,
      createdAt: true
    };

    let duel = await prisma.duel.findUnique({
      where: { pin },
      select: selectFields
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    // Auto-merge logic for concurrent quick match searches
    if (duel.status === 'WAITING' && duel.pin.startsWith('QM-')) {
      const olderWaiting = await prisma.duel.findFirst({
        where: {
          status: 'WAITING',
          hostId: { not: duel.hostId },
          pin: { startsWith: 'QM-' },
          createdAt: { lt: duel.createdAt }, // only join older duels to prevent cyclic merging
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (olderWaiting) {
        try {
          const merged = await prisma.duel.update({
            where: { id: olderWaiting.id },
            data: { guestId: duel.hostId, status: 'ACTIVE', startedAt: new Date() },
            select: selectFields
          });
          // Delete our newer duel since we joined the older one
          await prisma.duel.delete({ where: { id: duel.id } }).catch(() => {});
          duel = merged as any;
        } catch (mergeErr) {
          console.error("Failed to merge duel:", mergeErr);
        }
      }
    }

    return NextResponse.json({ ...duel, serverTime: Date.now() });
  } catch (err) {
    console.error("Poll error:", err);
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
