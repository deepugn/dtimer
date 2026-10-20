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
    const range = searchParams.get("range") || "7d"; // "today", "7d", "30d", "all"

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startOfWeek = new Date(todayStart);
    const dayOfWeek = (startOfWeek.getDay() + 6) % 7; // Monday = 0
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let filterStart: Date | null = null;
    if (range === "today") {
      filterStart = todayStart;
    } else if (range === "7d") {
      filterStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      filterStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch sessions for KPI aggregations
    const allUserSessions = await prisma.timeSession.findMany({
      where: { userId: user.userId },
      include: {
        tags: true,
        task: true,
      },
      orderBy: { startTime: "asc" },
    });

    let todayMs = 0;
    let thisWeekMs = 0;
    let thisMonthMs = 0;
    let allTimeMs = 0;

    for (const s of allUserSessions) {
      const sTime = new Date(s.startTime).getTime();
      allTimeMs += s.durationMs;
      if (sTime >= todayStart.getTime()) todayMs += s.durationMs;
      if (sTime >= startOfWeek.getTime()) thisWeekMs += s.durationMs;
      if (sTime >= startOfMonth.getTime()) thisMonthMs += s.durationMs;
    }

    // Filter sessions for charts based on range
    const filteredSessions = filterStart
      ? allUserSessions.filter((s) => new Date(s.startTime).getTime() >= filterStart.getTime())
      : allUserSessions;

    // 2. Tag Distribution (Donut Chart)
    const tagMap: Record<string, { name: string; color: string; durationMs: number; count: number }> = {};
    let filteredTotalDuration = 0;

    for (const s of filteredSessions) {
      filteredTotalDuration += s.durationMs;
      if (s.tags.length === 0) {
        const untaggedKey = "untagged";
        if (!tagMap[untaggedKey]) {
          tagMap[untaggedKey] = { name: "Untagged", color: "#94A3B8", durationMs: 0, count: 0 };
        }
        tagMap[untaggedKey].durationMs += s.durationMs;
        tagMap[untaggedKey].count += 1;
      } else {
        for (const t of s.tags) {
          if (!tagMap[t.id]) {
            tagMap[t.id] = { name: t.name, color: t.color, durationMs: 0, count: 0 };
          }
          tagMap[t.id].durationMs += s.durationMs;
          tagMap[t.id].count += 1;
        }
      }
    }

    const tagBreakdown = Object.values(tagMap)
      .map((t) => ({
        ...t,
        durationMinutes: Math.round(t.durationMs / 60000),
        durationHours: Number((t.durationMs / 3600000).toFixed(1)),
        percentage: filteredTotalDuration > 0
          ? Math.round((t.durationMs / filteredTotalDuration) * 100)
          : 0,
      }))
      .sort((a, b) => b.durationMs - a.durationMs);

    // 3. Daily Trend Data (Bar Chart)
    const daysCount = range === "today" ? 1 : range === "30d" ? 30 : 7;
    const dailyTrendMap: Record<string, { date: string; displayDate: string; totalMinutes: number; [key: string]: any }> = {};

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
      dailyTrendMap[dateKey] = {
        date: dateKey,
        displayDate,
        totalMinutes: 0,
      };
    }

    for (const s of filteredSessions) {
      const dateKey = new Date(s.startTime).toISOString().split("T")[0];
      if (dailyTrendMap[dateKey]) {
        const minutes = Math.round(s.durationMs / 60000);
        dailyTrendMap[dateKey].totalMinutes += minutes;

        // Tag breakdown per day
        const primaryTag = s.tags[0]?.name || "Untagged";
        dailyTrendMap[dateKey][primaryTag] = (dailyTrendMap[dateKey][primaryTag] || 0) + minutes;
      }
    }

    const dailyTrends = Object.values(dailyTrendMap);

    // 4. Hourly Distribution (Heatmap / Day Hours)
    const hourlyDistribution = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h === 0 ? "12" : h > 12 ? h - 12 : h} ${h >= 12 ? "PM" : "AM"}`,
      minutesTracked: 0,
    }));

    for (const s of filteredSessions) {
      const h = new Date(s.startTime).getHours();
      hourlyDistribution[h].minutesTracked += Math.round(s.durationMs / 60000);
    }

    // 5. Estimated vs Actual Task Variance
    const completedTasks = await prisma.task.findMany({
      where: {
        userId: user.userId,
        status: "COMPLETED",
      },
      include: {
        timeSessions: { select: { durationMs: true } },
      },
      take: 10,
      orderBy: { completedAt: "desc" },
    });

    const taskVariance = completedTasks.map((t) => {
      const actualMinutes = Math.round(
        t.timeSessions.reduce((acc, s) => acc + s.durationMs, 0) / 60000
      );
      const estimatedMinutes = t.estimatedMinutes || 0;
      return {
        taskId: t.id,
        title: t.title,
        estimatedMinutes,
        actualMinutes,
        varianceMinutes: actualMinutes - estimatedMinutes,
      };
    });

    // 6. Streak calculation
    const activeDates = new Set(
      allUserSessions.map((s) => new Date(s.startTime).toISOString().split("T")[0])
    );
    let currentStreak = 0;
    let checkDate = new Date(todayStart);

    while (activeDates.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return NextResponse.json({
      kpis: {
        todayMs,
        thisWeekMs,
        thisMonthMs,
        allTimeMs,
        totalSessionsCount: allUserSessions.length,
        completedTasksCount: completedTasks.length,
        currentStreakDays: currentStreak,
      },
      tagBreakdown,
      dailyTrends,
      hourlyDistribution,
      taskVariance,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
