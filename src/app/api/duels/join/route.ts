import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { pin, guestName } = await req.json();

  let userId = session?.user ? (session.user as any).id : null;
  let userName = session?.user ? ((session.user as any).username || session.user.name) : guestName || "Guest Knight";

  try {
    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    if (!userId) {
      const newUser = await prisma.user.create({ data: { username: userName, rating: 1000 } });
      userId = newUser.id;
    }

    const duel = await prisma.duel.findUnique({
      where: { pin },
      include: { host: true }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    if (duel.status !== "WAITING") {
      return NextResponse.json({ error: "Duel is already active or finished" }, { status: 400 });
    }

    if (duel.hostId === userId) {
      return NextResponse.json({ error: "You cannot join your own duel" }, { status: 400 });
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: duel.id },
      data: {
        guestId: userId,
        status: "ACTIVE",
        startedAt: new Date(),
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

    return NextResponse.json({ ...safeDuel, serverTime: Date.now() });
  } catch (err) {
    console.error("Join duel error:", err);
    return NextResponse.json({ error: "Failed to join duel" }, { status: 500 });
  }
}
