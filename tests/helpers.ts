import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "node:path";
import * as schema from "@/lib/db/schema";
import type { DB } from "@/lib/db/types";
import { farms, tankWorkers, tanks, userFarms, users, warehouses } from "@/lib/db/schema";
import { seedCatalog } from "@/server/catalog-seed";
import type { Actor, Role } from "@/server/types";

export async function makeDb() {
  const pg = new PGlite();
  const db = drizzle(pg, { schema }) as unknown as DB;
  await migrate(drizzle(pg), { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle") });
  return { db, pg };
}

/** Bối cảnh chuẩn: 2 trại giống T1, T2, mỗi trại 4 bể + kho trại; người dùng đủ vai trò */
export async function makeWorld() {
  const { db, pg } = await makeDb();
  const cat = await seedCatalog(db);
  const [t1, t2, bm] = await db.insert(farms).values([
    { code: "T1", name: "Trại giống 1", kind: "hatchery" },
    { code: "T2", name: "Trại giống 2", kind: "hatchery" },
    { code: "BM1", name: "Bố mẹ 1", kind: "broodstock" },
  ]).returning();
  const tk = await db.insert(tanks).values([
    ...[1, 2, 3, 4].map((i) => ({ farmId: t1.id, code: `T1-B0${i}` })),
    ...[1, 2, 3, 4].map((i) => ({ farmId: t2.id, code: `T2-B0${i}` })),
    { farmId: bm.id, code: "BM1-Q01", status: "quarantine" as const },
  ]).returning();
  const whs = await db.insert(warehouses).values([
    { code: "K-T1", name: "Kho Trại giống 1", farmId: t1.id },
    { code: "K-T2", name: "Kho Trại giống 2", farmId: t2.id },
  ]).returning();
  const mk = async (empCode: string, role: Role, farmIds: number[]): Promise<Actor> => {
    const [u] = await db.insert(users).values({ empCode, name: empCode, passwordHash: "x", role }).returning();
    if (farmIds.length) await db.insert(userFarms).values(farmIds.map((farmId) => ({ userId: u.id, farmId })));
    return { id: u.id, empCode, name: empCode, role, farmIds };
  };
  const actors = {
    admin: await mk("AD01", "admin", []),
    director: await mk("GD01", "director", []),
    lead1: await mk("TT01", "farm_lead", [t1.id, bm.id]),
    lead2: await mk("TT02", "farm_lead", [t2.id]),
    worker1: await mk("CN01", "worker", [t1.id]),
    worker1b: await mk("CN02", "worker", [t1.id]),
    worker2: await mk("CN03", "worker", [t2.id]),
    lab: await mk("XN01", "lab", [t1.id, t2.id, bm.id]),
    store: await mk("KH01", "storekeeper", [t1.id, t2.id]),
  };
  await db.insert(tankWorkers).values([
    { tankId: tk[0].id, userId: actors.worker1.id }, { tankId: tk[1].id, userId: actors.worker1.id },
    { tankId: tk[2].id, userId: actors.worker1b.id }, { tankId: tk[4].id, userId: actors.worker2.id },
  ]);
  return {
    db, pg, cat, farms: { t1, t2, bm }, tanks: tk, warehouses: { central: cat.centralWarehouse, t1: whs[0], t2: whs[1] }, actors,
    van: cat.species[0], stage: cat.stageIds.VAN,
  };
}

export type World = Awaited<ReturnType<typeof makeWorld>>;
