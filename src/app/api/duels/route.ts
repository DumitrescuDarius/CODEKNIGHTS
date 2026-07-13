import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function attachQuestionsToDuel(d: any) {
  const safeDuel = { ...d };
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
  return safeDuel;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { guestName, demoMode, hostId, guestId, gameMode, unrated } = await req.json().catch(() => ({}));

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!userId && !hostId) {
      const image = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(userName)}&rowColor=random`;
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000, image } });
      userId = newUser.id;
    }

    let targetQuestionId = null;
    if (demoMode) {
      const demoQuestion = await prisma.question.findFirst({ where: { title: "Maximum Subarray Sum" }, select: { id: true } });
      if (demoQuestion) {
        targetQuestionId = demoQuestion.id;
      }
    }

    if (!targetQuestionId) {
      const questions = await prisma.question.findMany({ select: { id: true } });
      if (questions.length === 0) {
        return NextResponse.json({ error: "No questions available" }, { status: 400 });
      }
      targetQuestionId = questions[Math.floor(Math.random() * questions.length)].id;
    }
    
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    if (hostId && guestId) {
      const duel = await prisma.duel.create({
        data: {
          pin,
          questionId: targetQuestionId,
          status: "ACTIVE",
          hostId,
          guestId,
          gameMode: gameMode || "CODEKNIGHTS",
          unrated: !!unrated,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60000),
        },
        include: {
          question: true,
          host: true,
          guest: true
        }
      });
      const safeDuel = await attachQuestionsToDuel(duel);
      return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
    }

    const duel = await prisma.duel.create({
      data: {
        pin,
        questionId: targetQuestionId,
        status: "WAITING",
        hostId: userId,
        expiresAt: new Date(Date.now() + 30 * 60000),
      },
      include: {
        question: true,
        host: true
      }
    });

    const safeDuel = await attachQuestionsToDuel(duel);
    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err: any) {
    console.error("Failed to create duel:", err);
    return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  try {
    const duel = await prisma.duel.findUnique({
      where: { pin },
      include: {
        question: true,
        host: true,
        guest: true
      }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    const safeDuel = await attachQuestionsToDuel(duel);
    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
