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
  console.log(`[api/user/follow] User ${userId} performing ${action} on ${targetUserId}`);
  
  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  try {
    if (action === 'follow') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          following: { connect: { id: targetUserId } }
        }
      });
    } else if (action === 'unfollow') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          following: { disconnect: { id: targetUserId } }
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
