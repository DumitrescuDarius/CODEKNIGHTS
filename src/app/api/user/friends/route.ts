import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { following: true, followedBy: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friends = user.following.filter(f => user.followedBy.some(fb => fb.id === f.id));

    return NextResponse.json(friends);
  } catch (err) {
    console.error("Friends fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
