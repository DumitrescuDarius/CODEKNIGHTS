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
    const { title, description, difficulty, testCases } = await req.json();

    if (!title || !description || !difficulty || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        title,
        description,
        difficulty,
        testCases: JSON.stringify(testCases),
      },
    });

    return NextResponse.json(question);
  } catch (err) {
    console.error("Failed to create question:", err);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
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
