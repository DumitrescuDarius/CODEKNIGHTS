import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : "guest";

  try {
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
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

    // Only registered hosts can be protected against self-joining easily
    if (userId !== "guest" && session?.user && duel.hostId === (session.user as any).id) {
      return NextResponse.json({ error: "You cannot join your own duel" }, { status: 400 });
    }

    const updatedDuel = await prisma.duel.update({
      where: { id: duel.id },
      data: {
        guestId: userId,
        status: "ACTIVE",
      },
      include: {
        question: true,
        host: true,
        guest: true
      }
    });

    // Add temporary field for guest info if guest joined
    if (userId === "guest" && !updatedDuel.guest) {
      (updatedDuel as any).guest = { username: "Guest Knight", image: null };
    }

    return NextResponse.json(updatedDuel);
  } catch (err) {
    console.error("Join duel error:", err);
    return NextResponse.json({ error: "Failed to join duel" }, { status: 500 });
  }
}
