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
    const { title, notes, resetTimer = true } = body;

    const stopwatch = await prisma.stopwatch.findFirst({
      where: { id, userId: user.userId },
      include: {
        tags: true,
        task: true,
      },
    });

    if (!stopwatch) {
      return NextResponse.json({ error: "Stopwatch not found" }, { status: 404 });
    }

    const totalMs = calculateCurrentElapsed(
      stopwatch.accumulatedMs,
      stopwatch.status,
      stopwatch.lastStartedAt
    );

    if (totalMs <= 0) {
      return NextResponse.json(
        { error: "No elapsed time to save" },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - totalMs);

    const session = await prisma.timeSession.create({
      data: {
        userId: user.userId,
        stopwatchId: stopwatch.id,
        taskId: stopwatch.taskId || null,
        title: title || stopwatch.name,
        startTime,
        endTime,
        durationMs: totalMs,
        notes: notes || null,
        tags: {
          connect: stopwatch.tags.map((t) => ({ id: t.id })),
        },
      },
      include: {
        tags: true,
        task: true,
      },
    });

    if (resetTimer) {
      // Clear laps and reset accumulated time
      await prisma.lap.deleteMany({
        where: { stopwatchId: id },
      });

      await prisma.stopwatch.update({
        where: { id },
        data: {
          status: "PAUSED",
          accumulatedMs: 0,
          lastStartedAt: null,
        },
      });
    }

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error("Log session error:", error);
    return NextResponse.json({ error: "Failed to log session" }, { status: 500 });
  }
}
