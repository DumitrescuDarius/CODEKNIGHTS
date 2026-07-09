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
  const { targetId } = await req.json();
  
  if (!targetId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const deleted = await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId }
        ]
      }
    });

    if (deleted.count === 0) {
        return NextResponse.json({ error: "Not friends" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unfriend error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
