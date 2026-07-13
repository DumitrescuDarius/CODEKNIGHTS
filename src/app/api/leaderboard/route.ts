import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  
  // Resolve current user ID from session or query param
  const queryUserId = searchParams.get("userId");
  const currentUserId = session?.user ? (session.user as any).id : queryUserId || undefined;

  try {
    // 1. Fetch top 100 users by rating
    const topUsers = await prisma.user.findMany({
      orderBy: {
        rating: "desc",
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        rating: true,
        rank: true,
        battlesWon: true,
        battlesTotal: true,
      },
      take: 100,
    });

    // 2. Fetch current user and calculate their global rank
    let currentUserRow = null;
    if (currentUserId) {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          rating: true,
          rank: true,
          battlesWon: true,
          battlesTotal: true,
        }
      });
      if (user) {
        const higherRatedCount = await prisma.user.count({
          where: { rating: { gt: user.rating } }
        });
        currentUserRow = {
          ...user,
          globalRank: higherRatedCount + 1
        };
      }
    }

    return NextResponse.json({
      topUsers,
      currentUser: currentUserRow
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
