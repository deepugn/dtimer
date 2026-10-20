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
    const { note } = body;

    const stopwatch = await prisma.stopwatch.findFirst({
      where: { id, userId: user.userId },
      include: {
        laps: { orderBy: { lapNumber: "desc" }, take: 1 },
      },
    });

    if (!stopwatch) {
      return NextResponse.json({ error: "Stopwatch not found" }, { status: 404 });
    }

    const currentTotalMs = calculateCurrentElapsed(
      stopwatch.accumulatedMs,
      stopwatch.status,
      stopwatch.lastStartedAt
    );

    const lastLap = stopwatch.laps[0];
    const lastLapSplit = lastLap ? lastLap.splitTimeMs : 0;
    const lapNumber = lastLap ? lastLap.lapNumber + 1 : 1;
    const lapTimeMs = Math.max(0, currentTotalMs - lastLapSplit);

    const lap = await prisma.lap.create({
      data: {
        stopwatchId: id,
        lapNumber,
        splitTimeMs: currentTotalMs,
        lapTimeMs,
        note: note ? note.trim() : null,
      },
    });

    return NextResponse.json({ lap }, { status: 201 });
  } catch (error) {
    console.error("Create lap error:", error);
    return NextResponse.json({ error: "Failed to record lap" }, { status: 500 });
  }
}
