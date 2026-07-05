import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const { duelId, solveTime, surrender, complexityScore, totalPenalty, finalize, guestUserId, code } = await req.json();
    const userId = session?.user ? (session.user as any).id : guestUserId || "guest";
    const TIME_LIMIT = 420 * 1000; // 7 minutes

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: { host: true, guest: true, question: true }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    // Dynamic Time Limit
    const difficultyTimeLimits: Record<string, number> = {
        "Easy": 8 * 60 * 1000,
        "Medium": 12 * 60 * 1000,
        "Hard": 18 * 60 * 1000
    };
    const limit = difficultyTimeLimits[duel.question?.difficulty] || 8 * 60 * 1000;
    const elapsed = Date.now() - new Date(duel.createdAt).getTime();
    const isTimedOut = elapsed > limit;

    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;

    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "Not a participant in this duel" }, { status: 403 });
    }

    const INFINITE_PENALTY = 999999999;
    const updateData: any = {};

    if (surrender || isTimedOut) {
      if (isHost) { 
        updateData.hostPenalty = INFINITE_PENALTY; 
        if (code) updateData.hostCode = code;
      }
      if (isGuest) { 
        updateData.guestPenalty = INFINITE_PENALTY; 
        if (code) updateData.guestCode = code;
      }
      if (surrender) {
          updateData.hostFinalized = true;
          updateData.guestFinalized = true;
          updateData.status = "FINISHED";
      }
    } else if (finalize) {
      if (isHost) {
        updateData.hostFinalized = true;
        if (solveTime) updateData.hostSolveTime = solveTime;
        if (complexityScore) updateData.hostComplexity = complexityScore;
        if (code) updateData.hostCode = code;
      }
      if (isGuest) {
        updateData.guestFinalized = true;
        if (solveTime) updateData.guestSolveTime = solveTime;
        if (complexityScore) updateData.guestComplexity = complexityScore;
        if (code) updateData.guestCode = code;
      }
    } else {
      if (isHost) {
        const currentPenalty = duel.hostPenalty || INFINITE_PENALTY;
        if (totalPenalty < currentPenalty) {
          updateData.hostPenalty = totalPenalty;
        }
      }
      if (isGuest) {
        const currentPenalty = duel.guestPenalty || INFINITE_PENALTY;
        if (totalPenalty < currentPenalty) {
          updateData.guestPenalty = totalPenalty;
        }
      }
    }
    
    // Check if both finalized or timed out
    const hostFinalized = (isHost && finalize) || duel.hostFinalized || (isHost && (surrender || isTimedOut));
    const guestFinalized = (isGuest && finalize) || duel.guestFinalized || (isGuest && (surrender || isTimedOut));
    
    if ((hostFinalized && guestFinalized) || isTimedOut) {
        updateData.status = "FINISHED";
    }

    // Final calculations if finished
    if (updateData.status === "FINISHED") {
      const hostPenalty = (isHost ? (updateData.hostPenalty ?? duel.hostPenalty) : duel.hostPenalty) ?? INFINITE_PENALTY;
      const guestPenalty = (isGuest ? (updateData.guestPenalty ?? duel.guestPenalty) : duel.guestPenalty) ?? INFINITE_PENALTY;

      const hostSurrendered = hostPenalty === INFINITE_PENALTY;
      const guestSurrendered = guestPenalty === INFINITE_PENALTY;

      let hostWon = false;
      let isDraw = false;

      // Prioritize explicit surrender status
      if (hostSurrendered && guestSurrendered) {
          isDraw = true;
      } else if (hostSurrendered) {
          hostWon = false;
      } else if (guestSurrendered) {
          hostWon = true;
      } else {
          // If neither surrendered, compare penalties
          const isClose = Math.abs(hostPenalty - guestPenalty) < 0.0001;
          isDraw = isClose;
          hostWon = !isClose && hostPenalty < guestPenalty;
      }

      if (isDraw) {
          updateData.hostRatingChange = 0;
          updateData.guestRatingChange = 0;
          updateData.finishReason = "DRAW";
      } else {
          const eloChange = 100;
          updateData.hostRatingChange = hostWon ? eloChange : -eloChange;
          updateData.guestRatingChange = hostWon ? -eloChange : eloChange;
          if (hostSurrendered || guestSurrendered) {
              updateData.finishReason = isTimedOut ? "TIMEOUT" : "SURRENDERED";
          } else {
              updateData.finishReason = "SOLVED";
          }
      }
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: duelId },
      data: updateData,
      include: { host: true, guest: true, question: true }
    });
    
    // Rating update logic
    if (updatedDuel.status === "FINISHED") {
      const isDraw = (updatedDuel.hostRatingChange || 0) === 0 && (updatedDuel.guestRatingChange || 0) === 0;
      
      // Check if either participant is a guest
      const host = await prisma.user.findUnique({ where: { id: updatedDuel.hostId } });
      const guest = updatedDuel.guestId ? await prisma.user.findUnique({ where: { id: updatedDuel.guestId } }) : null;
      
      const isHostGuest = host?.username?.startsWith("Guest Knight");
      const isGuestGuest = guest?.username?.startsWith("Guest Knight");
      
      if (!isDraw && !isHostGuest && !isGuestGuest) {
          const winnerId = (updatedDuel.hostRatingChange || 0) > 0 ? updatedDuel.hostId : updatedDuel.guestId;
          const loserId = (updatedDuel.hostRatingChange || 0) > 0 ? updatedDuel.guestId : updatedDuel.hostId;
          const eloChange = Math.abs(updatedDuel.hostRatingChange || 0);

          const getRank = (rating: number) => {
            if (rating >= 2500) return "Grandmaster";
            if (rating >= 2000) return "Master";
            if (rating >= 1600) return "Diamond";
            if (rating >= 1300) return "Gold";
            if (rating >= 1100) return "Silver";
            return "Bronze";
          };

          if (winnerId) {
              const user = await prisma.user.findUnique({ where: { id: winnerId } });
              if (user) {
                  let dailyWins: Record<string, number> = {};
                  try { dailyWins = user?.dailyWins ? (typeof user.dailyWins === 'string' ? JSON.parse(user.dailyWins) : (user.dailyWins as any)) : {}; } catch (e) { dailyWins = {}; }
                  dailyWins[new Date().toLocaleDateString('en-CA')] = (dailyWins[new Date().toLocaleDateString('en-CA')] || 0) + 1;
                  const newRating = (user?.rating || 1000) + eloChange;
                  await prisma.user.update({
                      where: { id: winnerId },
                      data: { battlesWon: { increment: 1 }, battlesTotal: { increment: 1 }, rating: newRating, rank: getRank(newRating), dailyWins: dailyWins }
                  });
              }
          }
          if (loserId) {
              const user = await prisma.user.findUnique({ where: { id: loserId } });
              if (user) {
                  const newRating = Math.max(0, (user?.rating || 1000) - eloChange);
                  await prisma.user.update({
                      where: { id: loserId },
                      data: { battlesTotal: { increment: 1 }, rating: newRating, rank: getRank(newRating) }
                  });
              }
          }
      }
    }

    return NextResponse.json(updatedDuel);
  } catch (err) {
    console.error("Duel submit error:", err);
    return NextResponse.json({ error: "Failed to submit duel result" }, { status: 500 });
  }
}
