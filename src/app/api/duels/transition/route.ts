import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  try {
    const { duelId, code, guestUserId } = await req.json();
    const userId = session?.user ? (session.user as any).id : guestUserId;

    if (!duelId || !userId || !code) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: { question: true }
    });

    if (!duel || duel.phase !== "BREAKING") {
      return NextResponse.json({ error: "Duel is not in BREAKING phase" }, { status: 400 });
    }

    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    // Determine which question belongs to the user
    const userQuestionId = isHost ? duel.questionIds[0] : duel.questionIds[1];
    
    // We would validate the code difference here, but user said:
    // "No, they don't even need to test it, just change the code."
    // So we just save whatever code they submit as their sabotaged code.

    const updateData: any = {};
    if (isHost) {
      updateData.hostSabotagedCode = code;
    } else {
      updateData.guestSabotagedCode = code;
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: duelId },
      data: updateData
    });

    // If both have submitted their sabotaged codes, or if one submits and the phase time has already passed
    // Actually, we transition to FIXING when BOTH have submitted their code, or if the time has passed.
    // For simplicity, if time has passed and at least one submitted, we transition?
    // Let's transition as soon as BOTH have non-null sabotaged codes, or we just let the host do the transition?
    // It's better if we just check if both are submitted.
    if (updatedDuel.hostSabotagedCode && updatedDuel.guestSabotagedCode) {
      await prisma.duel.update({
        where: { id: duelId },
        data: { phase: "FIXING", phaseEndsAt: null }
      });
    }

    return NextResponse.json({ success: true, phase: updatedDuel.hostSabotagedCode && updatedDuel.guestSabotagedCode ? "FIXING" : "BREAKING" });
  } catch (err: any) {
    console.error("Transition error:", err);
    return NextResponse.json({ error: "Failed to transition phase" }, { status: 500 });
  }
}
