import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { notesData: true }
    });
    
    return NextResponse.json(user?.notesData || { nodes: [], edges: [] });
  } catch (err: any) {
    console.error("Failed to fetch notes:", err);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { notesData: data }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update notes:", err);
    return NextResponse.json({ error: "Failed to update notes", details: err.message }, { status: 500 });
  }
}
