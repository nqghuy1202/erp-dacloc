import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db/client";
import { loadActor } from "@/server/access";
import { SESSION_COOKIE, readSession } from "@/server/auth";
import type { Actor, Role } from "@/server/types";
import { type Locale, translator } from "./i18n";

export const getActor = cache(async (): Promise<Actor | null> => {
  const jar = await cookies();
  const uid = await readSession(jar.get(SESSION_COOKIE)?.value);
  return uid ? loadActor(db, uid) : null;
});

/** Trang cần đăng nhập; sai vai trò → về trang chính theo vai trò (ma trận trạng thái "sai quyền") */
export async function requireActor(roles?: Role[]): Promise<Actor> {
  const a = await getActor();
  if (!a) redirect("/dang-nhap");
  if (roles && !roles.includes(a.role) && a.role !== "admin") redirect(homeFor(a));
  return a;
}

export function homeFor(a: Actor) {
  if (a.role === "worker") return "/hien-truong";
  if (a.role === "lab") return "/xet-nghiem";
  if (a.role === "storekeeper") return "/kho";
  if (a.role === "farm_lead") return "/san-xuat/trai";
  return "/";
}

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("locale")?.value;
  return v === "en" ? "en" : "vi";
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: translator(locale) };
}
