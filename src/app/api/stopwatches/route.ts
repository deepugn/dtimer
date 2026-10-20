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

    const stopwatches = await prisma.stopwatch.findMany({
      where: { userId: user.userId },
      include: {
        tags: true,
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            estimatedMinutes: true,
          },
        },
        laps: {
          orderBy: { lapNumber: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ stopwatches });
  } catch (error) {
    console.error("Fetch stopwatches error:", error);
    return NextResponse.json({ error: "Failed to fetch stopwatches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, taskId, color, isFocusMode, tagIds } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Stopwatch name is required" }, { status: 400 });
    }

    const stopwatch = await prisma.stopwatch.create({
      data: {
        userId: user.userId,
        name: name.trim(),
        taskId: taskId || null,
        color: color || "#3B82F6",
        isFocusMode: Boolean(isFocusMode),
        status: "PAUSED",
        accumulatedMs: 0,
        tags: {
          connect: Array.isArray(tagIds)
            ? tagIds.map((id: string) => ({ id }))
            : [],
        },
      },
      include: {
        tags: true,
        task: true,
        laps: true,
      },
    });

    return NextResponse.json({ stopwatch }, { status: 201 });
  } catch (error) {
    console.error("Create stopwatch error:", error);
    return NextResponse.json({ error: "Failed to create stopwatch" }, { status: 500 });
  }
}
