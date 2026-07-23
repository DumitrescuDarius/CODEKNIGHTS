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

    if (!duel || (duel.phase !== "BREAKING" && duel.phase !== "FIXING")) {
      return NextResponse.json({ error: "Duel is not in a valid phase for this action" }, { status: 400 });
    }

    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    const userQuestionId = isHost ? duel.questionIds[0] : (duel.questionIds.length > 1 ? duel.questionIds[1] : duel.questionIds[0]);
    
    const targetQuestion = await prisma.question.findUnique({ where: { id: userQuestionId } });
    let finalCodeToSave = code;

    if (targetQuestion?.referenceCode) {
        try {
            const parsed = JSON.parse(targetQuestion.referenceCode);
            // Default to cpp or the first available language
            const originalCode = parsed["cpp"] || Object.values(parsed)[0] || "";
            const cleanOriginal = (originalCode as string).replace(/\s+/g, '');
            const cleanCurrent = code.replace(/\s+/g, '');
            
            if (cleanOriginal.length > 0) {
                // Levenshtein distance calculation
                const dp = Array(cleanOriginal.length + 1).fill(null).map(() => Array(cleanCurrent.length + 1).fill(0));
                for (let i = 0; i <= cleanOriginal.length; i++) dp[i][0] = i;
                for (let j = 0; j <= cleanCurrent.length; j++) dp[0][j] = j;
                for (let i = 1; i <= cleanOriginal.length; i++) {
                    for (let j = 1; j <= cleanCurrent.length; j++) {
                        const cost = cleanOriginal[i - 1] === cleanCurrent[j - 1] ? 0 : 1;
                        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
                    }
                }
                const dist = dp[cleanOriginal.length][cleanCurrent.length];
                if (dist > cleanOriginal.length * 0.1) {
                    finalCodeToSave = originalCode; // Fallback to original if they broke more than 10%
                }
            }
        } catch (e) {}
    }

    const updateData: any = {};
    if (isHost) {
      updateData.hostSabotagedCode = finalCodeToSave;
    } else {
      updateData.guestSabotagedCode = finalCodeToSave;
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
    const timeIsUp = updatedDuel.phaseEndsAt && (new Date(updatedDuel.phaseEndsAt).getTime() <= Date.now() + 5000);
    if ((updatedDuel.hostSabotagedCode && updatedDuel.guestSabotagedCode) || timeIsUp) {
      await prisma.duel.update({
        where: { id: duelId },
        data: { phase: "FIXING", phaseEndsAt: new Date(Date.now() + 10 * 60000).toISOString() }
      });
    }

    return NextResponse.json({ success: true, phase: ((updatedDuel.hostSabotagedCode && updatedDuel.guestSabotagedCode) || timeIsUp) ? "FIXING" : "BREAKING" });
  } catch (err: any) {
    console.error("Transition error:", err);
    return NextResponse.json({ error: "Failed to transition phase" }, { status: 500 });
  }
}
