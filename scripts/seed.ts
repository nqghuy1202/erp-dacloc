/**
 * Seed dữ liệu MẪU cho môi trường demo (KHÔNG phải dữ liệu thật của Đắc Lộc).
 * Chạy: SEED_PASSWORD=... npm run db:seed   (mật khẩu chung cho mọi tài khoản mẫu, lấy từ env — không ghi trong repo)
 * Chỉ chạy trên DB trống: dừng nếu đã có bảng farms có dữ liệu.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { sql as dsql } from "drizzle-orm";
import * as s from "../src/lib/db/schema";
import { seedCatalog } from "../src/server/catalog-seed";
import { hashPassword } from "../src/server/auth";
import type { DB } from "../src/lib/db/types";
import type { Role } from "../src/server/types";

const url = process.env.DATABASE_URL;
const pw = process.env.SEED_PASSWORD;
if (!url || !pw || pw.length < 8) { console.error("Cần DATABASE_URL và SEED_PASSWORD (≥ 8 ký tự)"); process.exit(1); }
const client = postgres(url, { ssl: "require", max: 1, prepare: false });
const db = drizzle(client, { schema: s }) as unknown as DB;

let seedN = 7;
const rnd = () => { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const day = (offset: number, h = 8) => { const d = new Date(); d.setUTCHours(h - 7, 0, 0, 0); d.setUTCDate(d.getUTCDate() + offset); return d; };
const iso = (d: Date) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const code = (p: string, i: number) => `${p}-${String(i).padStart(4, "0")}`;

async function main() {
  const [{ n }] = await db.select({ n: dsql<number>`count(*)::int` }).from(s.farms);
  if (n > 0) { console.log("seed: DB đã có dữ liệu → bỏ qua"); return; }
  const cat = await seedCatalog(db);
  const van = cat.species[0];
  const vanStages = await db.select().from(s.stages).where(dsql`${s.stages.speciesId} = ${van.id}`).orderBy(s.stages.seq);

  // Trại: 3 bố mẹ + 11 trại giống (theo quy mô công bố)
  const farmRows = await db.insert(s.farms).values([
    ...[1, 2, 3].map((i) => ({ code: `BM${i}`, name: `Bố mẹ ${i}`, kind: "broodstock" as const })),
    ...Array.from({ length: 11 }, (_, i) => ({ code: `TG${i + 1}`, name: `Trại giống ${i + 1}`, kind: "hatchery" as const })),
  ]).returning();
  await db.insert(s.warehouses).values(farmRows.map((f) => ({ code: `K-${f.code}`, name: `Kho ${f.name}`, farmId: f.id })));
  const whs = await db.select().from(s.warehouses);
  const tankRows = await db.insert(s.tanks).values(farmRows.flatMap((f) => Array.from({ length: f.kind === "broodstock" ? 12 : 24 }, (_, i) => ({
    farmId: f.id, code: `${f.code}-B${String(i + 1).padStart(2, "0")}`, volumeM3: f.kind === "broodstock" ? 10 : 20,
  })))).returning();

  // Người dùng mẫu
  const hash = await hashPassword(pw!);
  const hatch = farmRows.filter((f) => f.kind === "hatchery");
  const bms = farmRows.filter((f) => f.kind === "broodstock");
  const mk = async (empCode: string, name: string, role: Role, farmIds: number[]) => {
    const [u] = await db.insert(s.users).values({ empCode, name, role, passwordHash: hash }).returning();
    if (farmIds.length) await db.insert(s.userFarms).values(farmIds.map((farmId) => ({ userId: u.id, farmId })));
    return u;
  };
  const admin = await mk("AD01", "Quản trị hệ thống", "admin", []);
  const director = await mk("GD01", "Nguyễn Văn An", "director", []);
  const lab = await mk("XN01", "Phạm Thị Dung", "lab", farmRows.map((f) => f.id));
  const store = await mk("KH01", "Lê Văn Hải", "storekeeper", farmRows.map((f) => f.id));
  const leadBm = await mk("TT00", "Đỗ Văn Bình", "farm_lead", bms.map((f) => f.id));
  const leads: Awaited<ReturnType<typeof mk>>[] = [];
  const workers: Record<number, Awaited<ReturnType<typeof mk>>[]> = {};
  const names = ["Trần Thị Bích", "Lê Văn Cường", "Võ Thị Hoa", "Ngô Văn Khoa", "Huỳnh Thị Lan", "Phan Văn Minh"];
  for (const [i, f] of hatch.entries()) {
    leads.push(await mk(`TT${String(i + 1).padStart(2, "0")}`, `Trưởng ${f.name}`, "farm_lead", [f.id]));
    workers[f.id] = [];
    for (const j of [0, 1]) workers[f.id].push(await mk(`CN${String(i * 2 + j + 1).padStart(3, "0")}`, `${names[(i * 2 + j) % names.length]} ${i + 1}`, "worker", [f.id]));
  }
  void admin;

  // Đàn bố mẹ
  const broods = await db.insert(s.broodstocks).values(bms.map((f, i) => ({
    code: code("BM", i + 1), farmId: f.id, tankId: tankRows.find((t) => t.farmId === f.id)!.id, speciesId: van.id,
    source: pick(["SIS Hawaii", "Kona Bay", "Shrimp Improvement Systems"]), origin: "Hoa Kỳ", line: "SPF", males: 300, females: 400,
    status: i === 2 ? "quarantine" : "ready", receivedAt: day(-60 + i * 20),
  }))).returning();
  for (const b of broods) {
    await db.insert(s.labTests).values({
      code: code("XN", b.id), subjectType: "broodstock", subjectId: b.id, kind: "pcr", sampledAt: day(-58), dueAt: day(-56),
      status: b.status === "ready" ? "final" : "pending", finalizedAt: b.status === "ready" ? day(-57) : null, finalizedBy: b.status === "ready" ? lab.id : null,
      results: van.requiredDiseases.map((indicator) => ({ indicator, positive: false })),
    });
  }

  // Lô đang ương + lô đã thu (lịch sử 12 tuần)
  let lotN = 0, batchN = 0;
  const today = iso(new Date());
  for (const f of hatch) {
    const ft = tankRows.filter((t) => t.farmId === f.id);
    const lead = leads[hatch.indexOf(f)];
    const plan: { tankId: number; stockDate: string; stockQty: number; harvestDate: string; harvestQty: number }[] = [];
    for (const [ti, t] of ft.entries()) {
      const busy = ti < 18; // 18/24 bể đang ương
      // lịch sử: 3 vòng đã thu
      for (const back of [3, 2, 1]) {
        if (rnd() < 0.25) continue;
        const stocked = day(-back * 26 - (ti % 9));
        const stockQty = 2_000_000 + Math.round(rnd() * 8) * 100_000;
        const surv = 0.52 + rnd() * 0.18;
        const [b] = await db.insert(s.spawnBatches).values({ code: code("ME", ++batchN), broodstockId: pick(broods.slice(0, 2)).id, spawnedAt: stocked, femalesSpawned: 60, nauplius: stockQty, remaining: 0, status: "used" }).returning();
        const [l] = await db.insert(s.lots).values({
          code: `L-${t.code}-${String(++lotN).padStart(4, "0")}`, farmId: f.id, tankId: t.id, speciesId: van.id, batchId: b.id,
          stageId: vanStages.find((x) => x.code === "PL12")!.id, stockedAt: stocked, stockedQty: stockQty, estimatedQty: Math.round(stockQty * surv),
          status: "harvested", closedAt: new Date(stocked.getTime() + 22 * 86400e3), costTotal: stockQty / 1e6 * 95000,
        }).returning();
        const [test] = await db.insert(s.labTests).values({
          code: code("XN", 1000 + l.id), subjectType: "lot", subjectId: l.id, kind: "pcr", sampledAt: new Date(stocked.getTime() + 20 * 86400e3),
          dueAt: new Date(stocked.getTime() + 21 * 86400e3), status: "final", finalizedAt: new Date(stocked.getTime() + 20.5 * 86400e3), finalizedBy: lab.id,
          results: van.requiredDiseases.map((indicator) => ({ indicator, positive: false })),
        }).returning();
        const harvestedAt = new Date(stocked.getTime() + 22 * 86400e3);
        if (harvestedAt < new Date()) {
          await db.insert(s.finishedLots).values({ code: code("TP", l.id), qrToken: randomUUID().replace(/-/g, "").slice(0, 16), sourceLotIds: [l.id], qty: Math.round(stockQty * surv), stageCode: "PL12", survivalRate: Math.round(surv * 10000) / 10000, harvestedAt, harvestedBy: lead.id, pcrTestId: test.id });
        }
      }
      if (!busy) { await db.update(s.tanks).set({ status: ti % 3 === 0 ? "cleaning" : "empty" }).where(dsql`${s.tanks.id} = ${t.id}`); continue; }
      const age = (ti * 7 + hatch.indexOf(f) * 3) % 22;
      const stageIdx = Math.min(vanStages.length - 1, Math.max(0, age - 1));
      const stockQty = 2_000_000 + Math.round(rnd() * 8) * 100_000;
      const est = Math.round(stockQty * (1 - Math.min(0.42, age * 0.019)));
      const [b] = await db.insert(s.spawnBatches).values({ code: code("ME", ++batchN), broodstockId: pick(broods.slice(0, 2)).id, spawnedAt: day(-age), femalesSpawned: 60, nauplius: stockQty, remaining: 0, status: "used" }).returning();
      const expected = iso(new Date(day(-age).getTime() + 22 * 86400e3));
      const [l] = await db.insert(s.lots).values({
        code: `L-${t.code}-${String(++lotN).padStart(4, "0")}`, farmId: f.id, tankId: t.id, speciesId: van.id, batchId: b.id,
        stageId: vanStages[stageIdx].id, stockedAt: day(-age), stockedQty: stockQty, estimatedQty: est, expectedHarvestAt: expected, costTotal: age * 6500,
      }).returning();
      await db.update(s.tanks).set({ status: "rearing" }).where(dsql`${s.tanks.id} = ${t.id}`);
      await db.insert(s.tankWorkers).values({ tankId: t.id, userId: workers[f.id][ti % 2].id });
      if (expected.slice(0, 7) === today.slice(0, 7)) plan.push({ tankId: t.id, stockDate: iso(day(-age)), stockQty, harvestDate: expected, harvestQty: Math.round(stockQty * van.standardSurvival) });
      // nhật ký 2 ngày gần nhất
      const logs = [];
      for (const d of [-1, 0]) for (const h of [6, 18]) {
        if (d === 0 && h > new Date().getUTCHours() + 7) continue;
        const ph = Math.round((7.8 + rnd() * 0.6 + (ti === 5 && d === 0 ? 0.8 : 0)) * 10) / 10;
        logs.push({ id: randomUUID(), lotId: l.id, tankId: t.id, userId: workers[f.id][ti % 2].id, kind: "water", recordedAt: day(d, h), data: { ph, temp: Math.round((28 + rnd() * 1.5) * 10) / 10, salinity: 30, do: Math.round((5.3 + rnd()) * 10) / 10 } });
      }
      if (logs.length) await db.insert(s.logs).values(logs);
      if (ti === 5) {
        const [a] = await db.insert(s.alerts).values({ type: "water_out_of_range", severity: "bad", farmId: f.id, lotId: l.id, tankId: t.id, title: `PH ${String(logs.at(-1)?.data.ph ?? 8.9).replace(".", ",")} · bể ${t.code}`, detail: "Ngưỡng 7,5–8,5", dedupeKey: `water:${l.id}:ph`, createdAt: day(0, 6) }).returning();
        await db.insert(s.notifications).values({ userId: lead.id, type: "water_out_of_range", alertId: a.id, title: a.title });
      }
      // PCR gần thu
      if (age >= 19) {
        await db.insert(s.labTests).values({ code: code("XN", 5000 + l.id), subjectType: "lot", subjectId: l.id, kind: "pcr", sampledAt: day(-1), dueAt: day(0),
          status: age >= 20 ? "final" : "pending", finalizedAt: age >= 20 ? day(-1, 16) : null, finalizedBy: age >= 20 ? lab.id : null,
          results: van.requiredDiseases.map((indicator) => ({ indicator, positive: false })) });
      }
    }
    // Kế hoạch tháng hiện tại đã duyệt
    if (plan.length) {
      const [p] = await db.insert(s.plans).values({ farmId: f.id, month: today.slice(0, 7), status: "approved", submittedAt: day(-10), approvedAt: day(-9), approvedBy: director.id, createdBy: lead.id }).returning();
      // thêm lô dự kiến cuối tháng cho đủ chỉ tiêu
      const extra = ft.slice(18).map((t, i) => ({ tankId: t.id, stockDate: today, stockQty: 2_400_000, harvestDate: `${today.slice(0, 7)}-${String(Math.min(28, 20 + i)).padStart(2, "0")}`, harvestQty: 1_440_000 }));
      await db.insert(s.planLines).values([...plan, ...extra].map((x) => ({ ...x, planId: p.id })));
    }
  }

  // Kho: nhập kho tổng, cấp cho trại
  const central = cat.centralWarehouse;
  const m = cat.materials;
  const lines: [string, number, number, string][] = [["ART90", 42, 1_850_000, "2027-03-01"], ["FRIP2", 64, 420_000, "2027-01-15"], ["ALGAE", 120, 35_000, "2026-12-01"], ["BACIL", 9, 650_000, "2027-06-01"], ["EDTA", 30, 80_000, "2028-01-01"], ["CHLOR", 400, 45_000, "2028-01-01"]];
  const [r] = await db.insert(s.receipts).values({ code: "PN-0001", warehouseId: central.id, supplier: "Công ty Thức ăn Thủy sản Miền Trung", docNo: "HĐ 1029", createdBy: store.id }).returning();
  for (const [c, q, cost, exp] of lines) {
    await db.insert(s.receiptLines).values({ receiptId: r.id, materialId: m[c].id, qty: q * 3, unitCost: cost, expiry: exp });
    const [sl] = await db.insert(s.stockLots).values({ warehouseId: central.id, materialId: m[c].id, supplierLot: `${c}-A`, expiry: exp, qtyRemaining: q, unitCost: cost }).returning();
    await db.insert(s.stockTx).values([
      { warehouseId: central.id, materialId: m[c].id, stockLotId: sl.id, qty: q * 3, unitCost: cost, type: "receipt", refKey: `seed:r:${sl.id}`, createdBy: store.id },
      { warehouseId: central.id, materialId: m[c].id, stockLotId: sl.id, qty: -q * 2, unitCost: cost, type: "issue_out", refKey: `seed:o:${sl.id}`, createdBy: store.id },
    ]);
    for (const f of hatch) {
      const wh = whs.find((w) => w.farmId === f.id)!;
      await db.insert(s.stockTx).values({ warehouseId: wh.id, materialId: m[c].id, stockLotId: sl.id, qty: (q * 2) / hatch.length, unitCost: cost, type: "issue_in", refKey: `seed:i:${sl.id}:${wh.id}`, createdBy: store.id });
    }
  }
  const [req] = await db.insert(s.requests).values({ code: "YC-0001", farmId: hatch[3].id, note: "Bổ sung cho tuần tới", createdBy: leads[3].id }).returning();
  await db.insert(s.requestLines).values([{ requestId: req.id, materialId: m.ART90.id, qty: 25 }, { requestId: req.id, materialId: m.BACIL.id, qty: 3 }]);

  console.log(`seed: xong — ${farmRows.length} trại, ${tankRows.length} bể, ${lotN} lô`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => client.end());
