import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = { userId: user.userId };
    if (status && status !== "ALL") {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        tags: true,
        stopwatches: {
          select: {
            id: true,
            name: true,
            status: true,
            accumulatedMs: true,
            lastStartedAt: true,
          },
        },
        timeSessions: {
          select: {
            durationMs: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Compute total tracked time per task
    const tasksWithMetrics = tasks.map((t) => {
      const totalTrackedMs = t.timeSessions.reduce((acc, s) => acc + s.durationMs, 0);
      return {
        ...t,
        totalTrackedMs,
      };
    });

    return NextResponse.json({ tasks: tasksWithMetrics });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, estimatedMinutes, priority, dueDate, tagIds } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        description: description?.trim() || null,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : 0,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: {
          connect: Array.isArray(tagIds)
            ? tagIds.map((id: string) => ({ id }))
            : [],
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
