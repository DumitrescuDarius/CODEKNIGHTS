import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { guestName, unrated, forceCreate, findOnly, problems } = await req.json().catch(() => ({}));

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!userId) {
      const image = `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(userName)}&rowColor=random`;
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000, image } });
      userId = newUser.id;
    }

    const now = new Date();

    const attachQuestionsToDuel = async (d: any) => {
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
        safeDuel.questions = safeDuel.questionIds
          .map(id => safeQuestions.find(q => q.id === id))
          .filter(Boolean);
      } else {
        safeDuel.questions = safeDuel.question ? [safeDuel.question] : [];
      }
      return safeDuel;
    };

    // If we are forcing creation, cancel any old waiting duels for this user to start fresh
    if (forceCreate) {
      await prisma.duel.updateMany({
        where: { hostId: userId, status: 'WAITING' },
        data: { status: 'CANCELLED' }
      });
    } else {
      // If user already has an active, unexpired waiting duel, return it
      const existing = await prisma.duel.findFirst({ 
        where: { hostId: userId, status: 'WAITING', expiresAt: { gt: now } }, 
        include: { question: true, host: true }
      });
      if (existing) {
        const safeExisting = await attachQuestionsToDuel(existing);
        return NextResponse.json(safeExisting);
      }
    }

    // Try to find a waiting duel to join (not hosted by this user) if not forcing creation
    let waiting = null;
    if (!forceCreate) {
      waiting = await prisma.duel.findFirst({
        where: { status: 'WAITING', hostId: { not: userId }, pin: { startsWith: 'QM-' }, expiresAt: { gt: now }, unrated: !!unrated },
        orderBy: { createdAt: 'asc' }
      });
    }

    if (waiting) {
      const updated = await prisma.duel.update({
        where: { id: waiting.id },
        data: { guestId: userId, status: 'ACTIVE', startedAt: new Date() },
        include: { question: true, host: true, guest: true }
      });
      const safeUpdated = await attachQuestionsToDuel(updated);
      return NextResponse.json({ ...safeUpdated, serverTime: Date.now() });
    }

    if (findOnly) {
      return NextResponse.json({ error: "No active public match found. Try creating one!" }, { status: 404 });
    }

    // No waiting duel found: create one for this user
    const formatDifficulty = (diff: string) => {
      if (!diff) return "Easy";
      return diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
    };

    const problemList = (problems && Array.isArray(problems) && problems.length > 0) 
      ? problems 
      : ["EASY"];

    // Calculate total time: Easy = 5m, Medium = 9m, Hard = 14m
    const calculatedTotalTime = problemList.reduce((sum: number, diff: string) => {
      const d = diff.toUpperCase();
      if (d === "EASY") return sum + 5;
      if (d === "MEDIUM") return sum + 9;
      return sum + 14;
    }, 0);

    // Select distinct questions for each block difficulty
    const questionIds: string[] = [];
    for (const diff of problemList) {
      const formattedDiff = formatDifficulty(diff);
      let pool = await prisma.question.findMany({
        where: {
          difficulty: formattedDiff,
          id: { notIn: questionIds }
        },
        select: { id: true }
      });
      if (pool.length === 0) {
        pool = await prisma.question.findMany({
          where: { difficulty: formattedDiff },
          select: { id: true }
        });
      }
      if (pool.length === 0) {
        pool = await prisma.question.findMany({ select: { id: true } });
      }
      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        questionIds.push(picked.id);
      }
    }

    if (questionIds.length === 0) {
      return NextResponse.json({ error: "No questions available" }, { status: 400 });
    }

    const randomQuestionId = questionIds[0];
    const pin = "QM-" + Math.floor(100000 + Math.random() * 900000).toString();

    const duel = await prisma.duel.create({
      data: {
        pin,
        questionId: randomQuestionId,
        questionIds,
        status: "WAITING",
        hostId: userId,
        unrated: !!unrated,
        expiresAt: new Date(Date.now() + 30 * 60000),
        numProblems: problemList.length,
        totalTime: calculatedTotalTime,
        difficulty: problemList.join(", ")
      },
      include: {
        question: true,
        host: true
      }
    });

    const safeDuel = await attachQuestionsToDuel(duel);
    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err: any) {
    console.error("Quick match error:", err);
    return NextResponse.json({ error: "Quick match failed", details: err?.message || String(err) }, { status: 500 });
  }
}
