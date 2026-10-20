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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const tagId = searchParams.get("tagId");
    const taskId = searchParams.get("taskId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = { userId: user.userId };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (tagId && tagId !== "ALL") {
      where.tags = {
        some: { id: tagId },
      };
    }

    if (taskId && taskId !== "ALL") {
      where.taskId = taskId;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.startTime.lte = end;
      }
    }

    const [total, sessions] = await Promise.all([
      prisma.timeSession.count({ where }),
      prisma.timeSession.findMany({
        where,
        include: {
          tags: true,
          task: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { startTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch session history" }, { status: 500 });
  }
}

// Manual session creation (e.g. retroactive time entry)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, startTime, endTime, durationMinutes, taskId, tagIds, notes } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const start = startTime ? new Date(startTime) : new Date();
    let end: Date;
    let durationMs: number;

    if (endTime) {
      end = new Date(endTime);
      durationMs = Math.max(0, end.getTime() - start.getTime());
    } else if (durationMinutes) {
      durationMs = Number(durationMinutes) * 60 * 1000;
      end = new Date(start.getTime() + durationMs);
    } else {
      return NextResponse.json({ error: "Duration or end time required" }, { status: 400 });
    }

    const session = await prisma.timeSession.create({
      data: {
        userId: user.userId,
        title: title.trim(),
        startTime: start,
        endTime: end,
        durationMs,
        notes: notes ? notes.trim() : null,
        taskId: taskId || null,
        tags: {
          connect: Array.isArray(tagIds)
            ? tagIds.map((id: string) => ({ id }))
            : [],
        },
      },
      include: {
        tags: true,
        task: true,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
