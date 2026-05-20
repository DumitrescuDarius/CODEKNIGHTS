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
    const requests = await prisma.friendRequest.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    const friends = requests.map(r => r.senderId === userId ? r.receiver : r.sender);

    return NextResponse.json(friends);
  } catch (err) {
    console.error("Friends fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
