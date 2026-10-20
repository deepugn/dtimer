import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, name, color, taskId, isFocusMode, tagIds } = body;

    const stopwatch = await prisma.stopwatch.findFirst({
      where: { id, userId: user.userId },
      include: { laps: true, tags: true, task: true },
    });

    if (!stopwatch) {
      return NextResponse.json({ error: "Stopwatch not found" }, { status: 404 });
    }

    const now = new Date();
    let updatedData: any = {};

    if (action === "START") {
      // If focus mode or exclusive running is requested, pause any other running stopwatches
      if (stopwatch.isFocusMode || body.exclusiveFocus) {
        const otherRunning = await prisma.stopwatch.findMany({
          where: {
            userId: user.userId,
            id: { not: id },
            status: "RUNNING",
          },
        });

        for (const other of otherRunning) {
          if (other.lastStartedAt) {
            const delta = now.getTime() - new Date(other.lastStartedAt).getTime();
            await prisma.stopwatch.update({
              where: { id: other.id },
              data: {
                status: "PAUSED",
                accumulatedMs: other.accumulatedMs + Math.max(0, delta),
                lastStartedAt: null,
              },
            });
          }
        }
      }

      if (stopwatch.status !== "RUNNING") {
        updatedData = {
          status: "RUNNING",
          lastStartedAt: now,
        };
      }
    } else if (action === "PAUSE") {
      if (stopwatch.status === "RUNNING" && stopwatch.lastStartedAt) {
        const delta = now.getTime() - new Date(stopwatch.lastStartedAt).getTime();
        updatedData = {
          status: "PAUSED",
          accumulatedMs: stopwatch.accumulatedMs + Math.max(0, delta),
          lastStartedAt: null,
        };
      }
    } else if (action === "RESET") {
      // Delete laps associated with this stopwatch
      await prisma.lap.deleteMany({
        where: { stopwatchId: id },
      });

      updatedData = {
        status: "PAUSED",
        accumulatedMs: 0,
        lastStartedAt: null,
      };
    } else {
      // General update (name, color, tags, task)
      if (name !== undefined) updatedData.name = name.trim();
      if (color !== undefined) updatedData.color = color;
      if (taskId !== undefined) updatedData.taskId = taskId || null;
      if (isFocusMode !== undefined) updatedData.isFocusMode = Boolean(isFocusMode);

      if (Array.isArray(tagIds)) {
        updatedData.tags = {
          set: tagIds.map((tid: string) => ({ id: tid })),
        };
      }
    }

    const updated = await prisma.stopwatch.update({
      where: { id },
      data: updatedData,
      include: {
        tags: true,
        task: true,
        laps: { orderBy: { lapNumber: "desc" } },
      },
    });

    return NextResponse.json({ stopwatch: updated });
  } catch (error) {
    console.error("Update stopwatch error:", error);
    return NextResponse.json({ error: "Failed to update stopwatch" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const existing = await prisma.stopwatch.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stopwatch not found" }, { status: 404 });
    }

    await prisma.stopwatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Stopwatch deleted" });
  } catch (error) {
    console.error("Delete stopwatch error:", error);
    return NextResponse.json({ error: "Failed to delete stopwatch" }, { status: 500 });
  }
}
