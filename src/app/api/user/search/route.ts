import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Try finding users with contains
    let users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { startsWith: query, mode: 'insensitive' } },
          { name: { startsWith: query, mode: 'insensitive' } },
        ],
        NOT: {
          id: (session?.user as any)?.id || "no-session",
        },
      },
      select: {
        id: true, name: true, username: true, image: true,
        battlesWon: true, battlesTotal: true, rating: true, rank: true,
      },
      take: 20,
    });

    // 2. If no users found, try finding similar by using the first 3 characters!
    if (users.length === 0 && query.length >= 3) {
      const prefix = query.substring(0, 3);
      users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { startsWith: prefix, mode: 'insensitive' } },
            { name: { startsWith: prefix, mode: 'insensitive' } },
          ],
          NOT: { id: (session?.user as any)?.id || "no-session" },
        },
        select: {
          id: true, name: true, username: true, image: true,
          battlesWon: true, battlesTotal: true, rating: true, rank: true,
        },
        take: 10,
      });
    }

    // Sort to put exact matches first, then startsWith, then others
    const queryLower = query.toLowerCase();
    users.sort((a, b) => {
      const aName = (a.username || a.name || "").toLowerCase();
      const bName = (b.username || b.name || "").toLowerCase();
      
      const aExact = aName === queryLower;
      const bExact = bName === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aName.startsWith(queryLower);
      const bStarts = bName.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return aName.localeCompare(bName);
    });
    
    // limit to 10
    users = users.slice(0, 10);

    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json(users.map(u => ({ ...u, status: "NONE" })));
    }

    const userIds = users.map(u => u.id);
    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: userIds } },
          { senderId: { in: userIds }, receiverId: userId }
        ]
      }
    });

    const results = users.map(user => {
      const rel = requests.find(r => r.senderId === user.id || r.receiverId === user.id);
      let status = "NONE";
      let requestId: string | undefined;

      if (rel) {
        if (rel.status === "ACCEPTED") {
          status = "FRIENDS";
        } else if (rel.status === "PENDING") {
          if (rel.senderId === userId) {
            status = "SENT";
          } else {
            status = "RECEIVED";
            requestId = rel.id;
          }
        }
      }

      return {
        ...user,
        status,
        requestId
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("User search error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
