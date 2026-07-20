import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { duelId, action, guestUserId } = await req.json().catch(() => ({}));

  let userId = session?.user ? (session.user as any).id : null;
  const currentUserId = userId || guestUserId;

  try {
    if (!duelId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: { host: true, guest: true, question: true }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    // Verify current user is the host
    if (duel.hostId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "accept") {
      const isHackBounty = (duel.gameMode === "HACKBOUNTY");
      const updated = await prisma.duel.update({
        where: { id: duelId },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          phase: isHackBounty ? "BREAKING" : null,
          phaseEndsAt: isHackBounty ? new Date(Date.now() + 120 * 1000) : null,
        },
        include: { host: true, guest: true, question: true }
      });
      
      const safe = { ...updated };
      if (safe.question && 'hiddenTestCases' in safe.question) {
        (safe.question as any).hiddenTestCases = null;
      }
      if (safe.questionIds && safe.questionIds.length > 0) {
        const allQuestions = await prisma.question.findMany({
          where: { id: { in: safe.questionIds } }
        });
        const safeQuestions = allQuestions.map(q => {
          const sq = { ...q };
          if ('hiddenTestCases' in sq) {
            (sq as any).hiddenTestCases = null;
          }
          return sq;
        });
        (safe as any).questions = safe.questionIds
          .map(id => safeQuestions.find(q => q.id === id))
          .filter(Boolean);
      } else {
        (safe as any).questions = safe.question ? [safe.question] : [];
      }
      return NextResponse.json(safe);
    } else if (action === "reject") {
      const updated = await prisma.duel.update({
        where: { id: duelId },
        data: {
          status: "WAITING",
          guestId: null,
          startedAt: null
        },
        include: { host: true, guest: true, question: true }
      });
      
      const safe = { ...updated };
      if (safe.question && 'hiddenTestCases' in safe.question) {
        (safe.question as any).hiddenTestCases = null;
      }
      if (safe.questionIds && safe.questionIds.length > 0) {
        const allQuestions = await prisma.question.findMany({
          where: { id: { in: safe.questionIds } }
        });
        const safeQuestions = allQuestions.map(q => {
          const sq = { ...q };
          if ('hiddenTestCases' in sq) {
            (sq as any).hiddenTestCases = null;
          }
          return sq;
        });
        (safe as any).questions = safe.questionIds
          .map(id => safeQuestions.find(q => q.id === id))
          .filter(Boolean);
      } else {
        (safe as any).questions = safe.question ? [safe.question] : [];
      }
      return NextResponse.json(safe);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Duel action error:", err);
    return NextResponse.json({ error: "Action failed", details: err?.message || String(err) }, { status: 500 });
  }
}
