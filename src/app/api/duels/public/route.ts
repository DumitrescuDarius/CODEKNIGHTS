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

    let onlineUsers: string[] | null = null;
    try {
      const port = process.env.PORT || 3000;
      // Note: Use 127.0.0.1 to avoid potential IPv6 resolution issues on Windows
      const res = await fetch(`http://127.0.0.1:${port}/api/socket_online`, { cache: 'no-store' });
      if (res.ok) {
        onlineUsers = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch online users for public duels", e);
    }

    const activeAvailableDuels = onlineUsers 
      ? availableDuels.filter(d => onlineUsers!.includes(d.hostId))
      : availableDuels;

    // Attach full questions array if questionIds exist
    let allQuestionIds = new Set<string>();
    activeAvailableDuels.forEach(d => {
      if (d.questionIds && d.questionIds.length > 0) {
        d.questionIds.forEach(id => allQuestionIds.add(id));
      }
    });

    let questionsMap: Record<string, any> = {};
    if (allQuestionIds.size > 0) {
      const qList = await prisma.question.findMany({
        where: { id: { in: Array.from(allQuestionIds) } },
        select: { id: true, title: true, difficulty: true }
      });
      qList.forEach(q => { questionsMap[q.id] = q; });
    }

    // Remove hidden test cases from questions for security and attach questions
    const safeDuels = activeAvailableDuels.map(d => {
      const copy = { ...d } as any;
      if (copy.question && 'hiddenTestCases' in copy.question) {
        copy.question.hiddenTestCases = null;
      }
      if (copy.questionIds && copy.questionIds.length > 0) {
        copy.questions = copy.questionIds.map((id: string) => questionsMap[id]).filter(Boolean);
      } else {
        copy.questions = copy.question ? [copy.question] : [];
      }
      return copy;
    });
    
    return NextResponse.json(safeDuels);
  } catch (err: any) {
    console.error("Fetch public matches error:", err);
    return NextResponse.json({ error: "Failed to fetch public matches", details: err?.message || String(err) }, { status: 500 });
  }
}
