import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tier: true,
        timezone: true,
        createdAt: true,
        _count: {
          select: {
            stopwatches: true,
            tasks: true,
            timeSessions: true,
            tags: true,
          },
        },
        timeSessions: {
          select: {
            durationMs: true,
            startTime: true,
          },
          orderBy: { startTime: "desc" },
        },
        tasks: {
          where: { status: "COMPLETED" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userActivityList = users.map((u) => {
      const totalTrackedMs = u.timeSessions.reduce((acc, s) => acc + s.durationMs, 0);
      const lastActiveAt = u.timeSessions[0]?.startTime || u.createdAt;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        tier: u.tier,
        createdAt: u.createdAt,
        lastActiveAt,
        totalTrackedMs,
        stopwatchesCount: u._count.stopwatches,
        tasksCount: u._count.tasks,
        completedTasksCount: u.tasks.length,
        sessionsCount: u._count.timeSessions,
        tagsCount: u._count.tags,
      };
    });

    return NextResponse.json({ users: userActivityList });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
