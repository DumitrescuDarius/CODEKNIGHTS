import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { pin, guestName, gameMode } = await req.json();

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user 
    ? ((session.user as any).username || session.user.name) 
    : `${guestName || "Guest Knight"}-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    if (!userId) {
      const image = `https://api.dicebear.com/9.x/bottts/svg?seed=${Math.random().toString(36).substring(7)}`;
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000, image } });
      userId = newUser.id;
    }

    const duel = await prisma.duel.findUnique({
      where: { pin },
      include: { host: true }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    if (gameMode && duel.gameMode && gameMode.toUpperCase() !== duel.gameMode.toUpperCase()) {
      return NextResponse.json({ error: "Game mode mismatch! You cannot join a " + duel.gameMode + " duel from " + gameMode }, { status: 400 });
    }

    if (duel.status !== "WAITING") {
      return NextResponse.json({ error: "Duel is already active or finished" }, { status: 400 });
    }

    if (duel.hostId === userId) {
      return NextResponse.json({ error: "You cannot join your own duel" }, { status: 400 });
    }

      const isHackBounty = (duel.gameMode === "HACKBOUNTY");
      const updatedDuel = await prisma.duel.update({
        where: { id: duel.id },
        data: {
          guestId: userId,
          status: "ACTIVE",
          startedAt: new Date(),
          phase: isHackBounty ? "BREAKING" : null,
          phaseEndsAt: isHackBounty ? new Date(Date.now() + 120 * 1000) : null,
        },
      include: {
        question: true,
        host: true,
        guest: true
      }
    });

    const safeDuel = { ...updatedDuel };
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

    console.log("[JOIN ROUTE] safeDuel.questionIds:", safeDuel.questionIds, "questions count:", (safeDuel as any).questions?.length);
    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err) {
    console.error("Join duel error:", err);
    return NextResponse.json({ error: "Failed to join duel" }, { status: 500 });
  }
}
