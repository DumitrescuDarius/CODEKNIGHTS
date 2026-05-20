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
  const { requestId, action } = await req.json(); // action: 'ACCEPT' or 'REJECT'
  
  if (!requestId || !action) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId }});

    if (!request || request.receiverId !== userId || request.status !== "PENDING") {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === 'ACCEPT') {
        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "ACCEPTED" }
        });
    } else if (action === 'REJECT') {
        await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" }
        });
    } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Action error:", err);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
