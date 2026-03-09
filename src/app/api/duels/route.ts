import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Create a new duel
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Allow both registered users and guests (who won't have a session)
  // For guests, we'll use a placeholder ID
  const userId = session?.user ? (session.user as any).id : "guest";
  const userName = session?.user ? ((session.user as any).username || session.user.name) : "Guest Knight";

  try {
    // Get all questions to pick one randomly
    const questions = await prisma.question.findMany();
    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions available in the arena" }, { status: 400 });
    }

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    // Generate a unique 6-digit PIN
    let pin = "";
    let isUnique = false;
    while (!isUnique) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await prisma.duel.findUnique({ where: { pin } });
      if (!existing) isUnique = true;
    }

    const duel = await prisma.duel.create({
      data: {
        pin,
        questionId: randomQuestion.id,
        status: "WAITING",
        hostId: userId,
        expiresAt: new Date(Date.now() + 30 * 60000), // 30 mins expiry
      },
      include: {
        question: true,
        host: true
      }
    });

    // Add a temporary field for the response if host is guest
    const responseDuel = { ...duel };
    if (userId === "guest") {
      (responseDuel as any).host = { username: userName, image: null };
    }

    return NextResponse.json(responseDuel);
  } catch (err: any) {
    console.error("Failed to create duel:", err);
    return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
  }
}

// Get duel state by PIN
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ error: "PIN is required" }, { status: 400 });
  }

  try {
    const duel = await prisma.duel.findUnique({
      where: { pin },
      include: {
        question: true,
        host: true,
        guest: true
      }
    });

    if (!duel) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }

    return NextResponse.json(duel);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch duel" }, { status: 500 });
  }
}
