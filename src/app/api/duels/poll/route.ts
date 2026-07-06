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
    let duel = await prisma.duel.findUnique({
      where: { pin },
      include: {
        host: true,
        guest: true,
        question: true
      }
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
            include: { host: true, guest: true, question: true }
          });
          await prisma.duel.delete({ where: { id: duel.id } }).catch(() => {});
          duel = merged as any;
        } catch (mergeErr) {
          console.error("Failed to merge duel:", mergeErr);
        }
      }
    }

    const safeDuel = { ...duel };
    if (safeDuel.question && 'hiddenTestCases' in safeDuel.question) {
       (safeDuel.question as any).hiddenTestCases = null;
    }

    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err) {
    console.error("Poll error:", err);
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
