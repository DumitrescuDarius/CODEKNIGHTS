import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { guestName } = await req.json();
    if (!guestName) {
      return NextResponse.json({ error: "No guest name provided" }, { status: 400 });
    }

    await prisma.user.deleteMany({
      where: {
        username: guestName,
        accounts: { none: {} }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete guest error:", err);
    return NextResponse.json({ error: "Failed to delete guest account" }, { status: 500 });
  }
}
