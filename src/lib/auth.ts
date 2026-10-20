import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-dtimer-2026-key";
const TOKEN_COOKIE_NAME = "dtimer_session";

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  tier: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function getSessionCookie(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(TOKEN_COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const token = getSessionCookie();
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(): Promise<UserPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export { TOKEN_COOKIE_NAME };
