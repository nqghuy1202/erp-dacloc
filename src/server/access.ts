import { and, eq } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { tankWorkers, tanks, userFarms, users } from "@/lib/db/schema";
import { fail } from "./errors";
import { type Actor, type Role, seesAllFarms } from "./types";

export async function loadActor(db: DB, userId: number): Promise<Actor | null> {
  const [u] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.active, true)));
  if (!u) return null;
  const farms = await db.select({ farmId: userFarms.farmId }).from(userFarms).where(eq(userFarms.userId, u.id));
  return { id: u.id, empCode: u.empCode, name: u.name, role: u.role, farmIds: farms.map((f) => f.farmId) };
}

export function assertRole(actor: Actor, roles: Role[]) {
  if (!roles.includes(actor.role) && actor.role !== "admin") fail("forbidden", "Không có quyền thực hiện");
}

/** R1: chỉ thao tác trên trại được phân quyền */
export function canFarm(actor: Actor, farmId: number) {
  return seesAllFarms(actor) || actor.farmIds.includes(farmId);
}

export function assertFarm(actor: Actor, farmId: number) {
  if (!canFarm(actor, farmId)) fail("forbidden", "Không có quyền với trại này");
}

/** Công nhân chỉ ghi bể được giao; trưởng trại ghi mọi bể trong trại mình */
export async function assertCanLogTank(db: DB, actor: Actor, tankId: number) {
  const [t] = await db.select().from(tanks).where(eq(tanks.id, tankId));
  if (!t) fail("not_found", "Không tìm thấy bể");
  assertFarm(actor, t!.farmId);
  if (actor.role === "worker") {
    const [w] = await db.select().from(tankWorkers).where(and(eq(tankWorkers.tankId, tankId), eq(tankWorkers.userId, actor.id)));
    if (!w) fail("forbidden", "Bể này không được giao cho bạn");
  }
  return t!;
}
