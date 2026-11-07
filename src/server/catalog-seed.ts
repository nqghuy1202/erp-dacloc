import { eq } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { materials, species, stages, warehouses, waterThresholds } from "@/lib/db/schema";

const FEED6 = ["02:00", "06:00", "10:00", "14:00", "18:00", "22:00"];
const WATER2 = ["06:00", "18:00"];

type StageDef = { code: string; name: string; days: number; feed: string[]; water: string[]; loss: number; thr: Record<string, [number, number]> };

const WATER_BASE: Record<string, [number, number]> = { ph: [7.5, 8.5], temp: [27, 31], salinity: [25, 32], do: [5, 10] };

function vannamei(): StageDef[] {
  const out: StageDef[] = [{ code: "N", name: "Nauplius", days: 2, feed: [], water: WATER2, loss: 10, thr: { ...WATER_BASE, salinity: [28, 32] } }];
  for (const i of [1, 2, 3]) out.push({ code: `Z${i}`, name: `Zoea ${i}`, days: 1, feed: FEED6, water: WATER2, loss: 10, thr: { ...WATER_BASE, salinity: [28, 32] } });
  for (const i of [1, 2, 3]) out.push({ code: `M${i}`, name: `Mysis ${i}`, days: 1, feed: FEED6, water: WATER2, loss: 8, thr: { ...WATER_BASE, salinity: [28, 32] } });
  for (let i = 1; i <= 15; i++) out.push({ code: `PL${i}`, name: `PL${i}`, days: 1, feed: FEED6, water: WATER2, loss: 5, thr: WATER_BASE });
  return out;
}

const SEABASS: StageDef[] = [
  { code: "EGG", name: "Trứng", days: 1, feed: [], water: WATER2, loss: 20, thr: { ...WATER_BASE, ph: [7.5, 8.5] } },
  { code: "LAR", name: "Cá bột", days: 15, feed: FEED6, water: WATER2, loss: 10, thr: WATER_BASE },
  { code: "FRY", name: "Cá hương", days: 20, feed: ["07:00", "11:00", "15:00", "19:00"], water: WATER2, loss: 5, thr: WATER_BASE },
];

const LOBSTER: StageDef[] = [
  { code: "PUE", name: "Tôm trắng (puerulus)", days: 30, feed: ["06:00", "18:00"], water: WATER2, loss: 3, thr: WATER_BASE },
  { code: "JUV", name: "Tôm hùm con", days: 60, feed: ["06:00", "18:00"], water: WATER2, loss: 2, thr: WATER_BASE },
];

/** Danh mục chuẩn ngành (Assumption ba-spec §11) — dùng cho seed và test */
export async function seedCatalog(db: DB) {
  const sp = await db.insert(species).values([
    { code: "VAN", nameVi: "Tôm thẻ chân trắng", nameEn: "Whiteleg shrimp", standardSurvival: 0.6, pcrValidDays: 3, requiredDiseases: ["WSSV", "IHHNV", "AHPND", "EHP", "TSV"] },
    { code: "SEA", nameVi: "Cá chẽm", nameEn: "Asian sea bass", standardSurvival: 0.4, pcrValidDays: 7, requiredDiseases: ["VNN"] },
    { code: "LOB", nameVi: "Tôm hùm", nameEn: "Spiny lobster", standardSurvival: 0.7, pcrValidDays: 7, requiredDiseases: ["WSSV"] },
  ]).returning();
  const defs: [number, StageDef[], string][] = [[sp[0].id, vannamei(), "PL10"], [sp[1].id, SEABASS, "FRY"], [sp[2].id, LOBSTER, "JUV"]];
  const stageIds: Record<string, Record<string, number>> = {};
  for (const [speciesId, list, harvestCode] of defs) {
    const rows = await db.insert(stages).values(list.map((s, i) => ({
      speciesId, seq: i + 1, code: s.code, name: s.name, days: s.days, feedTimes: s.feed, waterTimes: s.water, lossLimitPct: s.loss,
    }))).returning();
    const code = sp.find((x) => x.id === speciesId)!.code;
    stageIds[code] = Object.fromEntries(rows.map((r) => [r.code, r.id]));
    await db.insert(waterThresholds).values(rows.flatMap((r, i) =>
      Object.entries(list[i].thr).map(([param, [min, max]]) => ({ stageId: r.id, param, min, max }))));
    const harvestSeq = rows.find((r) => r.code === harvestCode)!.seq;
    await db.update(species).set({ harvestMinStageSeq: harvestSeq }).where(eq(species.id, speciesId));
  }
  const mats = await db.insert(materials).values([
    { code: "ART90", name: "Artemia Golden 90%", unit: "kg", group: "feed", minStock: 120 },
    { code: "FRIP2", name: "Thức ăn Frippak #2", unit: "kg", group: "feed", minStock: 100 },
    { code: "ALGAE", name: "Tảo Thalassiosira", unit: "L", group: "feed", minStock: 40 },
    { code: "BACIL", name: "Men vi sinh Bacillus", unit: "kg", group: "probiotic", minStock: 25 },
    { code: "EDTA", name: "EDTA", unit: "kg", group: "chemical", minStock: 10 },
    { code: "CHLOR", name: "Chlorine 70%", unit: "kg", group: "chemical", minStock: 50 },
    { code: "ABK", name: "Kháng sinh K (cấm)", unit: "kg", group: "drug", banned: true },
  ]).returning();
  const [central] = await db.insert(warehouses).values({ code: "KT", name: "Kho tổng" }).returning();
  return { species: sp, stageIds, materials: Object.fromEntries(mats.map((m) => [m.code, m])), centralWarehouse: central };
}
