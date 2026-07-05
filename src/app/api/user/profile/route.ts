import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostDuels: {
          where: { status: "FINISHED" },
          include: { guest: true, question: true },
          orderBy: { createdAt: "desc" },
          take: 100
        },
        guestDuels: {
          where: { status: "FINISHED" },
          include: { host: true, question: true },
          orderBy: { createdAt: "desc" },
          take: 100
        }
      }
    });

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const failedSubmissionsCount = await prisma.submission.count({
      where: { userId: userId, status: "FAILED" }
    });
    
    const pastDuels = [...user.hostDuels, ...user.guestDuels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 200);
    
    let currentStreak = 0;
    for (const duel of pastDuels) {
      const isHost = duel.hostId === userId;
      const change = isHost ? duel.hostRatingChange : duel.guestRatingChange;
      if (change !== null && change !== undefined) {
          if (change > 0) {
              currentStreak++;
          } else {
              break;
          }
      }
    }
    
    // Check if online
    const isOnline = global.onlineUsers ? global.onlineUsers.has(userId) : false;
    
    return NextResponse.json({ ...user, pastDuels, failedSubmissionsCount, currentStreak, isOnline });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { username, image } = await req.json();

    // Basic validation
    if (username && (username.length < 3 || username.length > 20)) {
      return new NextResponse("Username must be between 3 and 20 characters", { status:400 });
    }

    // Check if username is taken by someone else
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== (session.user as any).id) {
        return new NextResponse("Username already taken", { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        username,
        image,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
