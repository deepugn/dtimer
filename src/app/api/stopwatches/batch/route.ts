import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // "START_ALL", "PAUSE_ALL", "RESET_ALL"

    const now = new Date();
    const stopwatches = await prisma.stopwatch.findMany({
      where: { userId: user.userId },
    });

    if (action === "START_ALL") {
      // Start all paused stopwatches
      for (const sw of stopwatches) {
        if (sw.status !== "RUNNING") {
          await prisma.stopwatch.update({
            where: { id: sw.id },
            data: {
              status: "RUNNING",
              lastStartedAt: now,
            },
          });
        }
      }
    } else if (action === "PAUSE_ALL") {
      // Pause all running stopwatches
      for (const sw of stopwatches) {
        if (sw.status === "RUNNING" && sw.lastStartedAt) {
          const delta = now.getTime() - new Date(sw.lastStartedAt).getTime();
          await prisma.stopwatch.update({
            where: { id: sw.id },
            data: {
              status: "PAUSED",
              accumulatedMs: sw.accumulatedMs + Math.max(0, delta),
              lastStartedAt: null,
            },
          });
        }
      }
    } else if (action === "RESET_ALL") {
      // Reset all stopwatches and delete laps
      for (const sw of stopwatches) {
        await prisma.lap.deleteMany({
          where: { stopwatchId: sw.id },
        });

        await prisma.stopwatch.update({
          where: { id: sw.id },
          data: {
            status: "PAUSED",
            accumulatedMs: 0,
            lastStartedAt: null,
          },
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.stopwatch.findMany({
      where: { userId: user.userId },
      include: {
        tags: true,
        task: true,
        laps: { orderBy: { lapNumber: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, stopwatches: updated });
  } catch (error) {
    console.error("Batch stopwatches error:", error);
    return NextResponse.json({ error: "Failed to perform batch action" }, { status: 500 });
  }
}
