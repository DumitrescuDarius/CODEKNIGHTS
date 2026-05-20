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

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
