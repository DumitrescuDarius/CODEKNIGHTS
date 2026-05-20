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
        receiverId: userId,
        status: "PENDING"
      },
      include: {
        sender: true
      }
    });

    const pendingRequests = requests.map(r => ({ ...r.sender, requestId: r.id }));

    return NextResponse.json(pendingRequests);
  } catch (err) {
    console.error("Requests fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
