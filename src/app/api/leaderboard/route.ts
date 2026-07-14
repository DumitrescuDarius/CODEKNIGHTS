import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Leaderboard session fetch error:", error);
  }
  
  const { searchParams } = req.nextUrl;
  
  // Resolve current user ID from session or query param
  let queryUserId = searchParams.get("userId");
  if (queryUserId === "undefined" || queryUserId === "null") {
    queryUserId = null;
  }
  const currentUserId = session?.user ? (session.user as any).id : (queryUserId || undefined);

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
        isRoyal: true,
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
          isRoyal: true,
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
