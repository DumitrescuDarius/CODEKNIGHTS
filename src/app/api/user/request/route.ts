import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { targetUserId } = await req.json();
  
  if (!targetUserId || userId === targetUserId) {
    return NextResponse.json({ error: "Invalid targetUserId" }, { status: 400 });
  }

  try {
    // Check if request already exists
    const existing = await prisma.friendRequest.findFirst({
        where: { OR: [
            { senderId: userId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: userId }
        ]}
    });

    if (existing) {
        return NextResponse.json({ error: "Request already exists" }, { status: 400 });
    }

    await prisma.friendRequest.create({
        data: { senderId: userId, receiverId: targetUserId, status: "PENDING" }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Request error:", err);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
