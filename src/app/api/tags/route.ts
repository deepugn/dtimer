import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: { userId: user.userId },
      include: {
        _count: {
          select: {
            stopwatches: true,
            tasks: true,
            timeSessions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Fetch tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color, icon } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
    }

    const existing = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: user.userId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A tag with this name already exists" }, { status: 409 });
    }

    const tag = await prisma.tag.create({
      data: {
        userId: user.userId,
        name: name.trim(),
        color: color || "#3B82F6",
        icon: icon || "🏷️",
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
