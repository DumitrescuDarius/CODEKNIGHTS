import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
          followedBy: true
      }
    });

    if (!user) {
        return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { username, image } = await req.json();

    // Basic validation
    if (username && (username.length < 3 || username.length > 20)) {
      return new NextResponse("Username must be between 3 and 20 characters", { status:400 });
    }

    // Check if username is taken by someone else
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser && existingUser.id !== (session.user as any).id) {
        return new NextResponse("Username already taken", { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: {
        username,
        image,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
