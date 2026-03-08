import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { questionId, code, language, status } = await req.json();

    if (!questionId || !code || !language || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        questionId: questionId === 'default' ? null : questionId, // Handle default question
        code,
        language,
        status,
      },
    });

    // Update user stats
    const isPassed = status === "PASSED";
    await prisma.user.update({
      where: { id: userId },
      data: {
        battlesTotal: { increment: 1 },
        battlesWon: { increment: isPassed ? 1 : 0 },
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (err) {
    console.error("Failed to record submission:", err);
    return NextResponse.json({ error: "Failed to record submission" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(submissions);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
