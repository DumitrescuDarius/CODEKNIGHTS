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


    const safeDuel = { ...duel };
    if (safeDuel.question && 'hiddenTestCases' in safeDuel.question) {
       (safeDuel.question as any).hiddenTestCases = null;
    }

    if (safeDuel.questionIds && safeDuel.questionIds.length > 0) {
      const allQuestions = await prisma.question.findMany({
        where: { id: { in: safeDuel.questionIds } }
      });
      const safeQuestions = allQuestions.map(q => {
        const sq = { ...q };
        if ('hiddenTestCases' in sq) {
          (sq as any).hiddenTestCases = null;
        }
        return sq;
      });
      (safeDuel as any).questions = safeDuel.questionIds
        .map(id => safeQuestions.find(q => q.id === id))
        .filter(Boolean);
    } else {
      (safeDuel as any).questions = safeDuel.question ? [safeDuel.question] : [];
    }

    console.log("[POLL ROUTE] safeDuel.questionIds:", safeDuel.questionIds, "questions count:", (safeDuel as any).questions?.length);
    return NextResponse.json(
      { ...safeDuel, serverTime: Date.now() },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    console.error("Poll error:", err);
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
