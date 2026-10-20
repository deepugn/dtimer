import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCurrentElapsed } from "@/lib/time-utils";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { sessionNotes } = body;

    const task = await prisma.task.findFirst({
      where: { id, userId: user.userId },
      include: {
        tags: true,
        stopwatches: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 1. Mark task completed
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        tags: true,
      },
    });

    let loggedSession = null;

    // 2. If there are linked stopwatches that have tracked time, finalize and log a session
    for (const sw of task.stopwatches) {
      const currentElapsed = calculateCurrentElapsed(
        sw.accumulatedMs,
        sw.status,
        sw.lastStartedAt
      );

      if (currentElapsed > 0) {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - currentElapsed);

        loggedSession = await prisma.timeSession.create({
          data: {
            userId: user.userId,
            stopwatchId: sw.id,
            taskId: task.id,
            title: `${task.title} (Completed)`,
            startTime,
            endTime,
            durationMs: currentElapsed,
            notes: sessionNotes || `Completed task: ${task.title}`,
            tags: {
              connect: task.tags.map((t) => ({ id: t.id })),
            },
          },
          include: {
            tags: true,
          },
        });

        // Reset and pause the stopwatch
        await prisma.stopwatch.update({
          where: { id: sw.id },
          data: {
            status: "PAUSED",
            accumulatedMs: 0,
            lastStartedAt: null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      session: loggedSession,
    });
  } catch (error) {
    console.error("Complete task error:", error);
    return NextResponse.json({ error: "Failed to complete task" }, { status: 500 });
  }
}
