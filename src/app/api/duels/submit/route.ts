import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const { duelId, solveTime, surrender, complexityScore, totalPenalty, finalize, guestUserId, code, hackBountySolved } = await req.json();
    const userId = session?.user ? (session.user as any).id : guestUserId || "guest";
    const TIME_LIMIT = 420 * 1000; // 7 minutes

    const duel = await prisma.duel.findUnique({
      where: { id: duelId },
      include: { host: true, guest: true, question: true }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    // Match the client timer: use the duel's configured duration and the moment
    // the duel actually started (waiting-lobby time must not count).
    const difficultyTimeLimits: Record<string, number> = {
        "Easy": 8 * 60 * 1000,
        "Medium": 12 * 60 * 1000,
        "Hard": 18 * 60 * 1000
    };
    let limit = duel.totalTime > 0
      ? duel.totalTime * 60 * 1000
      : (difficultyTimeLimits[duel.question?.difficulty] || 8 * 60 * 1000);
    
    const isHost = duel.hostId === userId;
    const isGuest = duel.guestId === userId;

    const opponentFinalized = isHost ? duel.guestFinalized : duel.hostFinalized;
    const opponentSolveTimeMs = isHost ? duel.guestSolveTime : duel.hostSolveTime;

    if (opponentFinalized && opponentSolveTimeMs) {
        limit = Math.min(limit, opponentSolveTimeMs + 120 * 1000);
    }

    const elapsed = Date.now() - new Date(duel.startedAt || duel.createdAt).getTime();
    const isTimedOut = elapsed > limit;


    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "Not a participant in this duel" }, { status: 403 });
    }

    const ZERO_SCORE = 0;
    const updateData: any = {};

    if (surrender) {
      if (isHost) { 
        updateData.hostPenalty = ZERO_SCORE; 
        if (code) updateData.hostCode = code;
      }
      if (isGuest) { 
        updateData.guestPenalty = ZERO_SCORE; 
        if (code) updateData.guestCode = code;
      }
      updateData.hostFinalized = true;
      updateData.guestFinalized = true;
    } else if (isTimedOut) {
      if (isHost) {
        updateData.hostFinalized = true;
        if (totalPenalty !== undefined && totalPenalty !== null) {
          updateData.hostPenalty = totalPenalty;
          if (code) updateData.hostCode = code;
        } else if (duel.hostPenalty === null || duel.hostPenalty === undefined) {
          updateData.hostPenalty = ZERO_SCORE;
        }
      }
      if (isGuest) {
        updateData.guestFinalized = true;
        if (totalPenalty !== undefined && totalPenalty !== null) {
          updateData.guestPenalty = totalPenalty;
          if (code) updateData.guestCode = code;
        } else if (duel.guestPenalty === null || duel.guestPenalty === undefined) {
          updateData.guestPenalty = ZERO_SCORE;
        }
      }
    } else if (finalize) {
      if (isHost) {
        updateData.hostFinalized = true;
        if (solveTime) updateData.hostSolveTime = solveTime;
        if (complexityScore) updateData.hostComplexity = complexityScore;
        if (code) updateData.hostCode = code;
        if (totalPenalty !== undefined && totalPenalty !== null) {
          updateData.hostPenalty = totalPenalty;
        }
      }
      if (isGuest) {
        updateData.guestFinalized = true;
        if (solveTime) updateData.guestSolveTime = solveTime;
        if (complexityScore) updateData.guestComplexity = complexityScore;
        if (code) updateData.guestCode = code;
        if (totalPenalty !== undefined && totalPenalty !== null) {
          updateData.guestPenalty = totalPenalty;
        }
      }
    } else {
      if (isHost) {
        const currentPenalty = duel.hostPenalty || ZERO_SCORE;
        if (totalPenalty > currentPenalty) {
          updateData.hostPenalty = totalPenalty;
        }
      }
      if (isGuest) {
        const currentPenalty = duel.guestPenalty || ZERO_SCORE;
        if (totalPenalty > currentPenalty) {
          updateData.guestPenalty = totalPenalty;
        }
      }
    }
    
    // Check if both finalized or timed out
    let updatedDuel = await prisma.duel.update({
      where: { id: duelId },
      data: updateData,
      include: { host: true, guest: true, question: true }
    });
    
    // Now evaluate if the duel should be finished based on the FRESH updatedDuel
    const hostSurrendered = (isHost && surrender) || updatedDuel.hostPenalty === ZERO_SCORE || (isTimedOut && updatedDuel.hostPenalty === null);
    const guestSurrendered = (isGuest && surrender) || updatedDuel.guestPenalty === ZERO_SCORE || (isTimedOut && updatedDuel.guestPenalty === null);
    const bothFinalized = updatedDuel.hostFinalized && updatedDuel.guestFinalized;
    const hackBountyEarlyWin = duel.gameMode === "HACKBOUNTY" && duel.phase === "FIXING" && hackBountySolved;

    if (updatedDuel.status === "WAITING" && (hostSurrendered || guestSurrendered)) {
        await prisma.duel.updateMany({
            where: { id: duelId, status: "WAITING" },
            data: { status: "CANCELLED" }
        });
        updatedDuel = (await prisma.duel.findUnique({
            where: { id: duelId },
            include: { host: true, guest: true, question: true }
        })) as any;
    }

    if (updatedDuel.status === "ACTIVE" && (bothFinalized || isTimedOut || hostSurrendered || guestSurrendered || hackBountyEarlyWin)) {
        let hostWon = false;
        let isDraw = false;

        if (hostSurrendered && guestSurrendered) {
            isDraw = true;
        } else if (hostSurrendered) {
            hostWon = false;
        } else if (guestSurrendered) {
            hostWon = true;
        } else if (hackBountyEarlyWin) {
            hostWon = isHost;
        } else {
            const hostScore = updatedDuel.hostPenalty ?? ZERO_SCORE;
            const guestScore = updatedDuel.guestPenalty ?? ZERO_SCORE;
            const isClose = Math.abs(hostScore - guestScore) < 0.0001;
            isDraw = isClose;
            hostWon = !isClose && hostScore > guestScore;
        }

        const isHostGuest = updatedDuel.host?.username?.startsWith("Guest Knight") || false;
        const isGuestGuest = updatedDuel.guest?.username?.startsWith("Guest Knight") || false;
        const hasGuest = isHostGuest || isGuestGuest;

        const eloChange = updatedDuel.unrated ? 0 : (Math.floor(Math.random() * 21) + 50);
        const hostRatingChange = isDraw ? 0 : (hostWon ? eloChange : -eloChange);
        const guestRatingChange = isDraw ? 0 : (hostWon ? -eloChange : eloChange);
        let finishReason = "SOLVED";
        if (isDraw) finishReason = "DRAW";
        else if (hostSurrendered || guestSurrendered) finishReason = isTimedOut ? "TIMEOUT" : "SURRENDERED";

        const { count } = await prisma.duel.updateMany({
            where: { id: duelId, status: "ACTIVE" },
            data: {
                status: "FINISHED",
                finishReason,
                hostRatingChange,
                guestRatingChange
            }
        });

        if (count > 0) {
            // We successfully transitioned the duel. Fetch the latest and apply the Elo updates.
            updatedDuel = await prisma.duel.findUnique({
                where: { id: duelId },
                include: { host: true, guest: true, question: true }
            }) as any;

            if (!isDraw && !updatedDuel.unrated) {
                const winnerId = hostRatingChange > 0 ? updatedDuel.hostId : updatedDuel.guestId;
                const loserId = hostRatingChange > 0 ? updatedDuel.guestId : updatedDuel.hostId;
                const absEloChange = Math.abs(hostRatingChange);

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
                        
                        const gameMode = updatedDuel.gameMode || "CODEKNIGHTS";
                        const ratingKey = gameMode === "BUGHUNTER" ? "ratingBugHunter" : gameMode === "HACKBOUNTY" ? "ratingHackBounty" : gameMode === "MLMAGES" ? "ratingMlMages" : "rating";
                        
                        const newRating = ((user as any)[ratingKey] || 1000) + absEloChange;
                        const updateData: any = { battlesWon: { increment: 1 }, battlesTotal: { increment: 1 }, rank: getRank(newRating), dailyWins: dailyWins };
                        updateData[ratingKey] = newRating;

                        await prisma.user.update({
                            where: { id: winnerId },
                            data: updateData
                        });
                    }
                }
                if (loserId) {
                    const user = await prisma.user.findUnique({ where: { id: loserId } });
                    if (user) {
                        const gameMode = updatedDuel.gameMode || "CODEKNIGHTS";
                        const ratingKey = gameMode === "BUGHUNTER" ? "ratingBugHunter" : gameMode === "HACKBOUNTY" ? "ratingHackBounty" : gameMode === "MLMAGES" ? "ratingMlMages" : "rating";
                        
                        const newRating = Math.max(0, ((user as any)[ratingKey] || 1000) - absEloChange);
                        const updateData: any = { battlesTotal: { increment: 1 }, rank: getRank(newRating) };
                        updateData[ratingKey] = newRating;

                        await prisma.user.update({
                            where: { id: loserId },
                            data: updateData
                        });
                    }
                }
            }
        } else {
            // Someone else transitioned it
            updatedDuel = await prisma.duel.findUnique({
                where: { id: duelId },
                include: { host: true, guest: true, question: true }
            }) as any;
        }
    }

    return NextResponse.json(updatedDuel);
  } catch (err) {
    console.error("Duel submit error:", err);
    return NextResponse.json({ error: "Failed to submit duel result" }, { status: 500 });
  }
}
