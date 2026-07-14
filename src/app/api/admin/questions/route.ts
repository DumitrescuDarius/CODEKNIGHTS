import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const adminApiKey = process.env.ADMIN_API_KEY || "dev-admin-key";
  const authHeader = req.headers.get("authorization");
  const hasValidToken = authHeader && authHeader === `Bearer ${adminApiKey}`;
  
  return hasValidToken || (session && (session.user as any).isAdmin);
}

export async function POST(req: NextRequest) {
  const isAuthorized = await checkAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, restrictions, difficulty, testCases, hiddenTestCases, timeLimit, memoryLimit } = await req.json();

    if (!title || !description || !difficulty || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const allQuestions = await prisma.question.findMany({ select: { problemId: true } });
    const ids = allQuestions.map(q => q.problemId).filter(id => id !== null).sort((a: any, b: any) => a - b);
    let smallest = 1;
    for (const pid of ids) {
      if (pid === smallest) smallest++;
      else if (pid! > smallest) break;
    }

    const data: any = {
      problemId: smallest,
      title,
      description,
      restrictions,
      difficulty,
      testCases: JSON.stringify(testCases),
      hiddenTestCases: hiddenTestCases ? JSON.stringify(hiddenTestCases) : "[]",
      ...(timeLimit !== undefined && { timeLimit: Number(timeLimit) }),
      ...(memoryLimit !== undefined && { memoryLimit: Number(memoryLimit) }),
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

export async function PATCH(req: NextRequest) {
  const isAuthorized = await checkAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, title, description, restrictions, difficulty, testCases, hiddenTestCases, timeLimit, memoryLimit } = await req.json();

    if (!id || !title || !description || !difficulty || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const data: any = {
      title,
      description,
      restrictions,
      difficulty,
      testCases: JSON.stringify(testCases),
      hiddenTestCases: hiddenTestCases ? JSON.stringify(hiddenTestCases) : "[]",
      ...(timeLimit !== undefined && { timeLimit: Number(timeLimit) }),
      ...(memoryLimit !== undefined && { memoryLimit: Number(memoryLimit) }),
    };

    const question = await prisma.question.update({
      where: { id },
      data,
    });

    return NextResponse.json(question);
  } catch (err: any) {
    console.error("Prisma Error:", err);
    return NextResponse.json({ 
      error: "Failed to update question", 
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
  const isAuthorized = await checkAdminAuth(req);
  if (!isAuthorized) {
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
