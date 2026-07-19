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
  const { guestName, demoMode, hostId, guestId, gameMode, unrated, problems } = await req.json().catch(() => ({}));

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!userId && !hostId) {
      const image = `https://api.dicebear.com/9.x/bottts/svg?seed=${Math.random().toString(36).substring(7)}`;
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000, image } });
      userId = newUser.id;
    }

    const parsedProblems = Array.isArray(problems) && problems.length > 0 ? problems : ["EASY"];
    const parsedNumProblems = parsedProblems.length;
    
    let parsedTotalTime = 0;
    parsedProblems.forEach(p => {
      const uDiff = p.toUpperCase();
      if (uDiff === "EASY") parsedTotalTime += 5;
      else if (uDiff === "MEDIUM") parsedTotalTime += 9;
      else if (uDiff === "HARD") parsedTotalTime += 14;
      else parsedTotalTime += 8;
    });

    const chosenDifficulty = parsedProblems.length === 1 ? parsedProblems[0].toUpperCase() : "MIXED";
    const isUnrated = unrated !== undefined ? !!unrated : false;

    let targetQuestionId = null;
    let selectedIds: string[] = [];

    if (demoMode) {
      const demoQuestion = await prisma.question.findFirst({ where: { title: "Maximum Subarray Sum" }, select: { id: true } });
      if (demoQuestion) {
        targetQuestionId = demoQuestion.id;
        selectedIds = [demoQuestion.id];
      }
    }

    if (!targetQuestionId) {
      for (const diff of parsedProblems) {
        const formattedDiff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
        const queryCond: any = { difficulty: formattedDiff };
        if (gameMode === "BUGHUNTER") {
          queryCond.brokenCode = { not: null };
        }
        const availableQuestions = await prisma.question.findMany({
          where: queryCond,
          select: { id: true }
        });
        
        if (availableQuestions.length === 0) {
          const fallbackQuestions = await prisma.question.findMany({
            where: gameMode === "BUGHUNTER" ? { brokenCode: { not: null } } : {},
            select: { id: true }
          });
          if (fallbackQuestions.length === 0) {
            return NextResponse.json({ error: "No questions available in the database" }, { status: 400 });
          }
          const randQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
          selectedIds.push(randQ.id);
        } else {
          let candidates = availableQuestions.filter(q => !selectedIds.includes(q.id));
          if (candidates.length === 0) {
            candidates = availableQuestions;
          }
          const randQ = candidates[Math.floor(Math.random() * candidates.length)];
          selectedIds.push(randQ.id);
        }
      }
      targetQuestionId = selectedIds[0];
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
          unrated: isUnrated,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + parsedTotalTime * 60000 + 5 * 60000),
          numProblems: parsedNumProblems,
          totalTime: parsedTotalTime,
          difficulty: chosenDifficulty,
          questionIds: selectedIds,
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
        gameMode: gameMode || "CODEKNIGHTS",
        expiresAt: new Date(Date.now() + parsedTotalTime * 60000 + 5 * 60000),
        numProblems: parsedNumProblems,
        totalTime: parsedTotalTime,
        difficulty: chosenDifficulty,
        unrated: isUnrated,
        questionIds: selectedIds,
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
