import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const { searchParams } = new URL(req.url);
    const gameMode = searchParams.get("gameMode") || "CODEKNIGHTS";

    // Randomly cleanup old guests (10% chance to avoid heavy load on every poll)
    if (Math.random() < 0.1) {
      prisma.user.deleteMany({
        where: {
          email: null,
          createdAt: {
            lt: new Date(Date.now() - 48 * 60 * 60 * 1000)
          }
        }
      }).catch(console.error);
    }

    const availableDuels = await prisma.duel.findMany({
      where: {
        status: 'WAITING',
        pin: { startsWith: 'QM-' },
        expiresAt: { gt: now },
        guestId: null,
        gameMode
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
            rating: true,
            isRoyal: true
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove hidden test cases from questions for security
    const safeDuels = availableDuels.map(d => {
      const copy = { ...d };
      if (copy.question && 'hiddenTestCases' in copy.question) {
        (copy.question as any).hiddenTestCases = null;
      }
      return copy;
    });
    
    return NextResponse.json(safeDuels);
  } catch (err: any) {
    console.error("Fetch public matches error:", err);
    return NextResponse.json({ error: "Failed to fetch public matches", details: err?.message || String(err) }, { status: 500 });
  }
}
