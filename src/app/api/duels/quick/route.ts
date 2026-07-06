import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { guestName } = await req.json().catch(() => ({}));

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!userId) {
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000 } });
      userId = newUser.id;
    }

    // If user already has a waiting duel, return it
    const existing = await prisma.duel.findFirst({ where: { hostId: userId, status: 'WAITING' }, include: { question: true, host: true } });
    if (existing) return NextResponse.json(existing);

    // Try to find a waiting duel to join (not hosted by this user)
    const now = new Date();
    const waiting = await prisma.duel.findFirst({
      where: { status: 'WAITING', hostId: { not: userId }, pin: { startsWith: 'QM-' }, expiresAt: { gt: now } },
      orderBy: { createdAt: 'asc' }
    });

    if (waiting) {
      const updated = await prisma.duel.update({
        where: { id: waiting.id },
        data: { guestId: userId, status: 'ACTIVE', startedAt: new Date() },
        include: { question: true, host: true, guest: true }
      });
      return NextResponse.json({ ...updated, serverTime: Date.now() });
    }

    // No waiting duel found: create one for this user
    const questions = await prisma.question.findMany({ select: { id: true } });
    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions available" }, { status: 400 });
    }
    const randomQuestionId = questions[Math.floor(Math.random() * questions.length)].id;
    const pin = "QM-" + Math.floor(100000 + Math.random() * 900000).toString();

    const duel = await prisma.duel.create({
      data: {
        pin,
        questionId: randomQuestionId,
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
    console.error("Quick match error:", err);
    return NextResponse.json({ error: "Quick match failed", details: err?.message || String(err) }, { status: 500 });
  }
}
