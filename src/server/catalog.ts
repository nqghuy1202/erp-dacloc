import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "@/lib/db/types";
import { farms, materials, tanks, userFarms, users, warehouses } from "@/lib/db/schema";
import { assertRole } from "./access";
import { hashPassword } from "./auth";
import { fail } from "./errors";
import type { Actor, Role } from "./types";

export type ImportError = { row: number; code?: string; reason: "duplicate_code" | "invalid_row" | "unknown_farm" };

/** Tách CSV đơn giản (dấu phẩy hoặc chấm phẩy, có ngoặc kép) — file Excel lưu dạng CSV */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim().length);
  const sep = lines[0]?.includes(";") && !lines[0].includes(",") ? ";" : ",";
  for (const line of lines) {
    const cells: string[] = []; let cur = ""; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { cells.push(cur.trim()); cur = ""; } else cur += ch;
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

const tankRow = z.object({ farmCode: z.string().min(1), code: z.string().min(1).max(40), volumeM3: z.coerce.number().positive().max(10000) });

/** AC-1: dòng hợp lệ được lưu, dòng lỗi trả về kèm lý do */
export async function importTanks(db: DB, actor: Actor, rows: { farmCode: string; code: string; volumeM3: string | number }[]) {
  assertRole(actor, ["admin"]);
  const allFarms = await db.select().from(farms);
  const codes = rows.map((r) => String(r.code).trim().toUpperCase());
  const existing = new Set((await db.select({ code: tanks.code }).from(tanks).where(inArray(tanks.code, codes.length ? codes : ["~"]))).map((r) => r.code));
  const seen = new Set<string>();
  const errors: ImportError[] = [];
  const ok: { farmId: number; code: string; volumeM3: number }[] = [];
  rows.forEach((r, i) => {
    const p = tankRow.safeParse(r);
    if (!p.success) return errors.push({ row: i + 1, code: String(r.code ?? ""), reason: "invalid_row" });
    const code = p.data.code.toUpperCase();
    const farm = allFarms.find((f) => f.code.toUpperCase() === p.data.farmCode.toUpperCase());
    if (!farm) return errors.push({ row: i + 1, code, reason: "unknown_farm" });
    if (existing.has(code) || seen.has(code)) return errors.push({ row: i + 1, code, reason: "duplicate_code" });
    seen.add(code);
    ok.push({ farmId: farm.id, code, volumeM3: p.data.volumeM3 });
  });
  if (ok.length) await db.insert(tanks).values(ok);
  return { saved: ok.length, errors };
}

const materialRow = z.object({
  code: z.string().min(1).max(40), name: z.string().min(1).max(120), unit: z.string().min(1).max(10),
  group: z.enum(["feed", "chemical", "drug", "probiotic", "other"]).default("other"),
  minStock: z.coerce.number().min(0).default(0), banned: z.union([z.boolean(), z.string()]).transform((x) => x === true || /^(1|x|true|có|co)$/i.test(String(x))).default(false),
});

export async function importMaterials(db: DB, actor: Actor, rows: Record<string, string>[]) {
  assertRole(actor, ["admin"]);
  const existing = new Set((await db.select({ code: materials.code }).from(materials)).map((r) => r.code));
  const errors: ImportError[] = []; const ok: z.output<typeof materialRow>[] = []; const seen = new Set<string>();
  rows.forEach((r, i) => {
    const p = materialRow.safeParse(r);
    if (!p.success) return errors.push({ row: i + 1, code: r.code, reason: "invalid_row" });
    const code = p.data.code.toUpperCase();
    if (existing.has(code) || seen.has(code)) return errors.push({ row: i + 1, code, reason: "duplicate_code" });
    seen.add(code); ok.push({ ...p.data, code });
  });
  if (ok.length) await db.insert(materials).values(ok);
  return { saved: ok.length, errors };
}

export async function setMaterialBanned(db: DB, actor: Actor, materialId: number, banned: boolean) {
  assertRole(actor, ["admin"]);
  await db.update(materials).set({ banned }).where(eq(materials.id, materialId));
}

export const farmInput = z.object({ code: z.string().trim().min(1).max(20), name: z.string().trim().min(1).max(80), kind: z.enum(["broodstock", "hatchery"]) });

export async function createFarm(db: DB, actor: Actor, input: z.input<typeof farmInput>) {
  assertRole(actor, ["admin"]);
  const v = farmInput.parse(input);
  const code = v.code.toUpperCase();
  const [dup] = await db.select().from(farms).where(eq(farms.code, code));
  if (dup) fail("duplicate_code", "Mã trại đã tồn tại");
  return db.transaction(async (tx) => {
    const [f] = await tx.insert(farms).values({ ...v, code }).returning();
    await tx.insert(warehouses).values({ code: `K-${code}`, name: `Kho ${v.name}`, farmId: f.id });
    return f;
  });
}

export const userInput = z.object({
  empCode: z.string().trim().min(2).max(20).regex(/^[A-Za-z0-9_-]+$/),
  name: z.string().trim().min(1).max(80),
  role: z.enum(["worker", "farm_lead", "lab", "storekeeper", "director", "admin"]),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(72),
  farmIds: z.array(z.coerce.number().int().positive()).default([]),
});

export async function createUser(db: DB, actor: Actor, input: z.input<typeof userInput>) {
  assertRole(actor, ["admin"]);
  const v = userInput.parse(input);
  const empCode = v.empCode.toUpperCase();
  const [dup] = await db.select().from(users).where(eq(users.empCode, empCode));
  if (dup) fail("duplicate_code", "Mã nhân viên đã tồn tại");
  return db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ empCode, name: v.name, role: v.role as Role, passwordHash: await hashPassword(v.password) }).returning();
    if (v.farmIds.length) await tx.insert(userFarms).values(v.farmIds.map((farmId) => ({ userId: u.id, farmId })));
    return u;
  });
}

/** R1 edge: đổi trại → mất quyền trại cũ ngay; nhật ký cũ giữ tác giả */
export async function setUserFarms(db: DB, actor: Actor, userId: number, farmIds: number[]) {
  assertRole(actor, ["admin"]);
  await db.transaction(async (tx) => {
    await tx.delete(userFarms).where(eq(userFarms.userId, userId));
    if (farmIds.length) await tx.insert(userFarms).values(farmIds.map((farmId) => ({ userId, farmId })));
  });
}

export async function setUserActive(db: DB, actor: Actor, userId: number, active: boolean) {
  assertRole(actor, ["admin"]);
  if (userId === actor.id && !active) fail("invalid_input", "Không thể tự khoá tài khoản của mình");
  await db.update(users).set({ active }).where(eq(users.id, userId));
}
