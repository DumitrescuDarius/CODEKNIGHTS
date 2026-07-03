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
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
        NOT: {
          id: (session?.user as any)?.id || "no-session",
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        battlesWon: true,
        battlesTotal: true,
      },
      take: 10,
    });

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
