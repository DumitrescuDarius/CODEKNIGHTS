import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  const { searchParams } = new URL(req.url);
  let requestedUserId = searchParams.get("userId");
  
  if (requestedUserId === "undefined" || requestedUserId === "null") {
      requestedUserId = null;
  }

  if (!requestedUserId && (!session || !session.user)) {
    // Guest requesting their own profile
    return NextResponse.json({
        id: "guest",
        username: "Guest Knight",
        rating: 1000,
        battlesWon: 0,
        battlesTotal: 0,
        rank: "Novice",
        pastDuels: [],
        failedSubmissionsCount: 0,
        currentStreak: 0,
        isOnline: true,
        globalRank: 9999
    });
  }

  const userId = requestedUserId || (session?.user as any)?.id;

  try {
    const userPromise = prisma.user.findUnique({
      where: { id: userId },
      include: {
        hostDuels: {
          where: { status: "FINISHED" },
          include: { 
            guest: { select: { id: true, username: true, name: true, image: true, rating: true } }, 
            question: { select: { id: true, title: true, difficulty: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 30
        },
        guestDuels: {
          where: { status: "FINISHED" },
          include: { 
            host: { select: { id: true, username: true, name: true, image: true, rating: true } }, 
            question: { select: { id: true, title: true, difficulty: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 30
        }
      }
    });

    const failedSubmissionsPromise = prisma.submission.count({
      where: { userId: userId, status: "FAILED" }
    });

    const [user, failedSubmissionsCount] = await Promise.all([userPromise, failedSubmissionsPromise]);

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    const pastDuels = [...user.hostDuels, ...user.guestDuels].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 60);
    
    let currentStreak = 0;
    for (const duel of pastDuels) {
      const isHost = duel.hostId === userId;
      const change = isHost ? duel.hostRatingChange : duel.guestRatingChange;
      if (change !== null && change !== undefined) {
          if (change > 0) {
              currentStreak++;
          } else if (change < 0) {
              break;
          }
      }
    }
    
    // Check if online
    const isOnline = global.onlineUsers ? global.onlineUsers.has(userId) : false;
    
    // Calculate global rank
    const userRating = user.rating || 1000;
    const higherRatedCount = await prisma.user.count({
      where: {
        rating: {
          gt: userRating
        }
      }
    });
    const globalRank = higherRatedCount + 1;
    
    return NextResponse.json({ ...user, pastDuels, failedSubmissionsCount, currentStreak, isOnline, globalRank });
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
    if (username && (username.length < 4 || username.length > 20)) {
      return new NextResponse("Username must be between 4 and 20 characters", { status: 400 });
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

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userId = (session.user as any).id;
    
    // Prisma will cascade delete Accounts, Sessions, etc. if configured,
    // but just in case, we can delete the user directly.
    await prisma.user.delete({
      where: { id: userId },
    });

    return new NextResponse("Account deleted", { status: 200 });
  } catch (error) {
    console.error("Account deletion error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
