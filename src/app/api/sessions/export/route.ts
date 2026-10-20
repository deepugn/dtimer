import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { formatDurationHuman } from "@/lib/time-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv"; // "csv" or "json"
    const tagId = searchParams.get("tagId");
    const taskId = searchParams.get("taskId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { userId: user.userId };
    if (tagId && tagId !== "ALL") {
      where.tags = { some: { id: tagId } };
    }
    if (taskId && taskId !== "ALL") {
      where.taskId = taskId;
    }
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    const sessions = await prisma.timeSession.findMany({
      where,
      include: {
        tags: true,
        task: {
          select: { title: true, status: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    if (format === "json") {
      return new NextResponse(JSON.stringify(sessions, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="dtimer-history-${Date.now()}.json"`,
        },
      });
    }

    // CSV format
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const headers = [
      "Session ID",
      "Title",
      "Tags",
      "Linked Task",
      "Start Time",
      "End Time",
      "Duration (Minutes)",
      "Duration (Formatted)",
      "Notes",
    ];

    const rows = sessions.map((s) => [
      escapeCsv(s.id),
      escapeCsv(s.title),
      escapeCsv(s.tags.map((t) => t.name).join("; ")),
      escapeCsv(s.task ? s.task.title : "None"),
      escapeCsv(new Date(s.startTime).toISOString()),
      escapeCsv(new Date(s.endTime).toISOString()),
      escapeCsv(Math.round(s.durationMs / 60000).toString()),
      escapeCsv(formatDurationHuman(s.durationMs)),
      escapeCsv(s.notes || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dtimer-history-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export sessions error:", error);
    return NextResponse.json({ error: "Failed to export sessions" }, { status: 500 });
  }
}
