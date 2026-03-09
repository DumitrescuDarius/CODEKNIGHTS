import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, difficulty, testCases, hiddenTestCases } = await req.json();

    if (!title || !description || !difficulty || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data: any = {
      title,
      description,
      difficulty,
      testCases: JSON.stringify(testCases),
      hiddenTestCases: hiddenTestCases ? JSON.stringify(hiddenTestCases) : "[]",
    };

    const question = await prisma.question.create({ data });

    return NextResponse.json(question);
  } catch (err: any) {
    console.error("Prisma Error:", err);
    return NextResponse.json({ 
      error: "Failed to create question", 
      details: err.message,
      code: err.code 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(questions);
  } catch (err) {
    console.error("Failed to fetch questions:", err);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
  }

  try {
    await prisma.question.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete question:", err);
    return NextResponse.json({ error: "Failed to delete question", details: err.message }, { status: 500 });
  }
}
