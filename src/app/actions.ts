"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifyLogin } from "@/server/auth";
import { loadActor } from "@/server/access";
import { homeFor } from "@/lib/session";
import type { ActionState } from "@/lib/action";

const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: ActionState, f: FormData): Promise<ActionState> {
  const empCode = String(f.get("empCode") ?? "").trim().toUpperCase();
  const password = String(f.get("password") ?? "");
  const a = attempts.get(empCode);
  if (a && a.until > Date.now()) return { ok: false, error: "Đăng nhập sai quá nhiều lần, thử lại sau 5 phút", at: Date.now() };
  const u = await verifyLogin(db, empCode, password);
  if (!u) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(empCode, { n, until: n >= 5 ? Date.now() + 5 * 60e3 : 0 });
    return { ok: false, error: "Mã nhân viên hoặc mật khẩu không đúng", at: Date.now() };
  }
  attempts.delete(empCode);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(u.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE });
  const actor = await loadActor(db, u.id);
  redirect(homeFor(actor!));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/dang-nhap");
}

export async function setLocale(f: FormData) {
  const l = f.get("locale") === "en" ? "en" : "vi";
  (await cookies()).set("locale", l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const ref = (await headers()).get("referer");
  let back = "/";
  try { if (ref) back = new URL(ref).pathname; } catch { /* giữ "/" */ }
  redirect(back.startsWith("/") ? back : "/");
}
