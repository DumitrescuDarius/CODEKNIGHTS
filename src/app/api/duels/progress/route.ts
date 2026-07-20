import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const { duelId, codeLength, lineCount, testsPassed, testsTotal, guestUserId, codeSnapshot } = await req.json();
    const userId = session?.user ? (session.user as any).id : guestUserId || "guest";

    if (!duelId) {
      return NextResponse.json({ error: "Duel ID is required" }, { status: 400 });
    }

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
    if (isHost) {
      updateData.hostCodeLength = codeLength ?? 0;
      updateData.hostLineCount = lineCount ?? 0;
      updateData.hostTestsPassed = testsPassed ?? 0;
      updateData.hostTestsTotal = testsTotal ?? 0;
      updateData.hostLastActive = new Date();
      if (codeSnapshot) {
        updateData.hostCode = codeSnapshot;
        if (duel.gameMode === "HACKBOUNTY" && duel.phase === "BREAKING") {
           updateData.hostSabotagedCode = codeSnapshot;
        }
      }
    } else {
      updateData.guestCodeLength = codeLength ?? 0;
      updateData.guestLineCount = lineCount ?? 0;
      updateData.guestTestsPassed = testsPassed ?? 0;
      updateData.guestTestsTotal = testsTotal ?? 0;
      updateData.guestLastActive = new Date();
      if (codeSnapshot) {
        updateData.guestCode = codeSnapshot;
        if (duel.gameMode === "HACKBOUNTY" && duel.phase === "BREAKING") {
           updateData.guestSabotagedCode = codeSnapshot;
        }
      }
    }

    await prisma.duel.update({
      where: { id: duelId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Progress update error:", err);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
