import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based access control: Only ADMIN can view platform stats
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Aggregations
    const [totalUsers, totalStopwatches, totalTasks, completedTasks, allSessions] =
      await Promise.all([
        prisma.user.count(),
        prisma.stopwatch.count(),
        prisma.task.count(),
        prisma.task.count({ where: { status: "COMPLETED" } }),
        prisma.timeSession.findMany({
          select: { durationMs: true },
        }),
      ]);

    const totalTrackedMs = allSessions.reduce((acc, s) => acc + s.durationMs, 0);

    const activeTimersCount = await prisma.stopwatch.count({
      where: { status: "RUNNING" },
    });

    // Recent 10 activities across all users
    const recentActivity = await prisma.timeSession.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        tags: {
          select: { name: true, color: true, icon: true },
        },
        task: {
          select: { title: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTrackedMs,
        totalStopwatches,
        activeTimersCount,
        totalTasks,
        completedTasks,
      },
      recentActivity,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
