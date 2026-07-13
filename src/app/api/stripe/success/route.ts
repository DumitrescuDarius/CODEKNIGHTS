import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isRoyal: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("Failed to upgrade user to Royal:", err);
    return NextResponse.json({ error: "Failed to upgrade user to Royal status" }, { status: 500 });
  }
}
