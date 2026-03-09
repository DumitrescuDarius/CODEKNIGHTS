import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : "guest";

  try {
    const { duelId, solveTime } = await req.json();

    const duel = await prisma.duel.findUnique({
      where: { id: duelId }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "Not a participant in this duel" }, { status: 403 });
    }

    const updateData: any = {};
    if (isHost) updateData.hostSolveTime = solveTime;
    if (isGuest) updateData.guestSolveTime = solveTime;

    const updatedDuel = await prisma.duel.update({
      where: { id: duelId },
      data: updateData,
    });

    // Check if both finished
    if (updatedDuel.hostSolveTime !== null && updatedDuel.guestSolveTime !== null) {
      await prisma.duel.update({
        where: { id: duelId },
        data: { status: "FINISHED" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Duel submit error:", err);
    return NextResponse.json({ error: "Failed to submit duel result" }, { status: 500 });
  }
}
