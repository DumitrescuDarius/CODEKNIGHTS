import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId, action } = await req.json();
  const userId = (session.user as any).id;
  console.log(`[api/user/follow] User ${userId} performing ${action} on ${targetUserId}`);
  
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  try {
    if (action === 'follow') {
      await prisma.friendRequest.upsert({
        where: {
          senderId_receiverId: { senderId: userId, receiverId: targetUserId }
        },
        create: {
          senderId: userId,
          receiverId: targetUserId,
          status: "ACCEPTED"
        },
        update: {
          status: "ACCEPTED"
        }
      });
    } else if (action === 'unfollow') {
      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: userId }
          ]
        }
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Follow action error:", err);
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
