import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { users } from "@/lib/db/schema";

export const SESSION_COOKIE = "dl_session";
const MAX_AGE = 60 * 60 * 12; // 12 giờ

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET phải dài ≥ 32 ký tự");
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);

export async function verifyLogin(db: DB, empCode: string, password: string) {
  const code = empCode.trim().toUpperCase();
  if (!code || !password) return null;
  const [u] = await db.select().from(users).where(eq(users.empCode, code));
  // so sánh cả khi không có user để thời gian phản hồi như nhau
  const ok = await bcrypt.compare(password, u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvali");
  return u && u.active && ok ? u : null;
}

export async function signSession(userId: number) {
  return new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(secret());
}

export async function readSession(token: string | undefined): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE;
