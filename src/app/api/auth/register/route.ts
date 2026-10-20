import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        passwordHash,
        role: "USER",
        tier: "PRO", // Default to Pro for full feature access in SaaS
      },
    });

    // Create default starter tags for the new user
    const defaultTags = [
      { name: "Office Work", color: "#3B82F6", icon: "💼" },
      { name: "Reading a Book", color: "#10B981", icon: "📖" },
      { name: "Deep Work", color: "#8B5CF6", icon: "⚡" },
      { name: "Meetings", color: "#F59E0B", icon: "👥" },
      { name: "Learning / Study", color: "#EC4899", icon: "🎓" },
      { name: "Admin & Email", color: "#64748B", icon: "✉️" },
    ];

    for (const tag of defaultTags) {
      await prisma.tag.create({
        data: {
          userId: user.id,
          name: tag.name,
          color: tag.color,
          icon: tag.icon,
        },
      });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
    };

    const token = signToken(payload);

    const response = NextResponse.json(
      { success: true, user: payload },
      { status: 201 }
    );

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
