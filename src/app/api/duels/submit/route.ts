import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : "guest";

  try {
    const { duelId, solveTime, surrender, complexityScore, totalPenalty, finalize } = await req.json();
    const TIME_LIMIT = 420 * 1000; // 7 minutes

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
    if (surrender) {
      const LOST_TIME = 999999999;
      if (isHost) { 
        updateData.hostSolveTime = LOST_TIME; 
        updateData.hostComplexity = 0; 
        updateData.hostPenalty = 999999; 
      }
      if (isGuest) { 
        updateData.guestSolveTime = LOST_TIME; 
        updateData.guestComplexity = 0; 
        updateData.guestPenalty = 999999; 
      }
      // Force both to finalized and finish the duel
      updateData.hostFinalized = true;
      updateData.guestFinalized = true;
      updateData.status = "FINISHED";
    } else if (finalize) {
      if (isHost) updateData.hostFinalized = true;
      if (isGuest) updateData.guestFinalized = true;
      
      const hostFinalized = isHost ? true : (duel as any).hostFinalized;
      const guestFinalized = isGuest ? true : (duel as any).guestFinalized;
      
      if (hostFinalized && guestFinalized) {
        updateData.status = "FINISHED";
      }
    } else {
      if (isHost) {
        const currentPenalty = duel.hostPenalty || 999999999;
        if (totalPenalty < currentPenalty) {
          updateData.hostSolveTime = solveTime;
          updateData.hostComplexity = complexityScore;
          updateData.hostPenalty = totalPenalty;
        }
      }
      if (isGuest) {
        const currentPenalty = duel.guestPenalty || 999999999;
        if (totalPenalty < currentPenalty) {
          updateData.guestSolveTime = solveTime;
          updateData.guestComplexity = complexityScore;
          updateData.guestPenalty = totalPenalty;
        }
      }
    }

    // Logic: If Sudden Death or time exceeded
    const elapsed = Date.now() - new Date(duel.createdAt).getTime();
    if (!surrender && elapsed > TIME_LIMIT) {
        updateData.status = "FINISHED";
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: duelId },
      data: updateData,
      include: { host: true, guest: true }
    });

    // Winner detection and stats update
    if (updatedDuel.status === "FINISHED") {
      const finalDuel = updatedDuel;
      const hostPenalty = finalDuel.hostPenalty || 999999999;
      const guestPenalty = finalDuel.guestPenalty || 999999999;
        
      // Lower penalty wins. If penalties equal, lower time wins.
      const hostWon = hostPenalty < guestPenalty || (hostPenalty === guestPenalty && (finalDuel.hostSolveTime || 999999999) < (finalDuel.guestSolveTime || 999999999));
      
      const winnerId = hostWon ? finalDuel.hostId : finalDuel.guestId;
      const loserId = hostWon ? finalDuel.guestId : finalDuel.hostId;

      // ELO change: 90 - 120
      const eloChange = Math.floor(Math.random() * 31) + 90;
      
      const hostRatingChange = hostWon ? eloChange : -eloChange;
      const guestRatingChange = hostWon ? -eloChange : eloChange;

      // Update the duel record with the rating changes first
      await prisma.duel.update({
          where: { id: duelId },
          data: {
              hostRatingChange,
              guestRatingChange
          }
      });

      const getRank = (rating: number) => {
        if (rating >= 2500) return "Grandmaster";
        if (rating >= 2000) return "Master";
        if (rating >= 1600) return "Diamond";
        if (rating >= 1300) return "Gold";
        if (rating >= 1100) return "Silver";
        return "Bronze";
      };

      if (winnerId && winnerId !== "guest") {
          const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
          const user = await prisma.user.findUnique({ where: { id: winnerId } });
          
          // Handle dailyWins safely
          let dailyWins: Record<string, number> = {};
          try {
            dailyWins = user?.dailyWins ? (typeof user.dailyWins === 'string' ? JSON.parse(user.dailyWins) : (user.dailyWins as any)) : {};
          } catch (e) {
            dailyWins = {};
          }
          dailyWins[today] = (dailyWins[today] || 0) + 1;

          const newRating = (user?.rating || 1000) + eloChange;

          await prisma.user.update({
              where: { id: winnerId },
              data: {
                  battlesWon: { increment: 1 },
                  battlesTotal: { increment: 1 },
                  rating: newRating,
                  rank: getRank(newRating),
                  dailyWins: dailyWins
              }
          });
      }
      if (loserId && loserId !== "guest") {
          const user = await prisma.user.findUnique({ where: { id: loserId } });
          const newRating = Math.max(0, (user?.rating || 1000) - eloChange);
          
          await prisma.user.update({
              where: { id: loserId },
              data: { 
                battlesTotal: { increment: 1 },
                rating: newRating,
                rank: getRank(newRating)
              }
          });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Duel submit error:", err);
    return NextResponse.json({ error: "Failed to submit duel result" }, { status: 500 });
  }
}
