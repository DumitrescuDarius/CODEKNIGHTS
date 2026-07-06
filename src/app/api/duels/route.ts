import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { guestName, demoMode } = await req.json();

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!userId) {
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000 } });
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

    return NextResponse.json({ ...duel, serverTime: Date.now() });
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

    return NextResponse.json({ ...duel, serverTime: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
