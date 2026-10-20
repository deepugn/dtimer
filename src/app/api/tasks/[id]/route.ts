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
    const { title, description, estimatedMinutes, status, priority, dueDate, tagIds } = body;

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (estimatedMinutes !== undefined) data.estimatedMinutes = Number(estimatedMinutes);
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

    if (status !== undefined) {
      data.status = status;
      if (status === "COMPLETED" && existing.status !== "COMPLETED") {
        data.completedAt = new Date();
      } else if (status !== "COMPLETED") {
        data.completedAt = null;
      }
    }

    if (Array.isArray(tagIds)) {
      data.tags = {
        set: tagIds.map((tid: string) => ({ id: tid })),
      };
    }

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: {
        tags: true,
      },
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
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
    const existing = await prisma.task.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
