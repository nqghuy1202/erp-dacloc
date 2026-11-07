import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { logs, lots, materials, stages, tankWorkers, tanks, users, waterThresholds } from "@/lib/db/schema";
import { requireActor } from "@/lib/session";
import { assertCanLogTank } from "@/server/access";
import { AppError } from "@/server/errors";
import { FieldTop } from "@/components/field/top";
import { LogForm } from "./log-form";

export const dynamic = "force-dynamic";

export default async function LogPage({ params, searchParams }: { params: Promise<{ tankId: string }>; searchParams: Promise<{ task?: string; loai?: string }> }) {
  const actor = await requireActor(["worker", "farm_lead"]);
  const { tankId: raw } = await params;
  const sp = await searchParams;
  const tankId = Number(raw);
  const back = <Link href="/hien-truong" aria-label="Quay lại" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line"><ChevronLeft /></Link>;
  try {
    if (!Number.isInteger(tankId)) throw new AppError("not_found");
    await assertCanLogTank(db, actor, tankId);
  } catch (e) {
    const msg = e instanceof AppError && e.code === "forbidden" ? "Bể này không được giao cho bạn" : "Không tìm thấy bể";
    return (<><FieldTop title="Ghi nhật ký" left={back} /><p role="alert" className="m-4 rounded-xl bg-bad-soft p-4 font-medium text-bad-ink">{msg}</p></>);
  }
  const [tank] = await db.select().from(tanks).where(eq(tanks.id, tankId));
  const [row] = await db.select({ l: lots, st: stages }).from(lots).innerJoin(stages, eq(stages.id, lots.stageId)).where(and(eq(lots.tankId, tankId), eq(lots.status, "rearing")));
  if (!row) return (<><FieldTop title={tank.code} left={back} /><p className="m-4 rounded-xl bg-surface-2 p-4 text-fg-2">Bể không có lô đang ương</p></>);
  const thr = await db.select().from(waterThresholds).where(eq(waterThresholds.stageId, row.st.id));
  const mats = await db.select({ id: materials.id, name: materials.name, unit: materials.unit, group: materials.group }).from(materials)
    .where(and(eq(materials.banned, false), inArray(materials.group, ["feed", "probiotic", "chemical"])));
  const [lastFeed] = await db.select({ l: logs, name: users.name }).from(logs).innerJoin(users, eq(users.id, logs.userId))
    .where(and(eq(logs.lotId, row.l.id), eq(logs.kind, "feed"))).orderBy(desc(logs.recordedAt)).limit(1);
  const myTanks = actor.role === "worker"
    ? (await db.select({ id: tanks.id, code: tanks.code }).from(tankWorkers).innerJoin(tanks, eq(tanks.id, tankWorkers.tankId)).where(and(eq(tankWorkers.userId, actor.id), eq(tanks.status, "rearing"))))
    : (await db.select({ id: tanks.id, code: tanks.code }).from(tanks).where(and(eq(tanks.farmId, tank.farmId), eq(tanks.status, "rearing"))));
  myTanks.sort((a, b) => a.code.localeCompare(b.code));
  const idx = myTanks.findIndex((t) => t.id === tankId);
  const next = myTanks.length > 1 ? myTanks[(idx + 1) % myTanks.length] : null;
  const ageDays = Math.floor((Date.now() - row.l.stockedAt.getTime()) / 86400e3);
  void sql;
  return (
    <>
      <FieldTop left={back} title={<span className="font-mono">{tank.code}</span>} sub={`${row.st.name} · ngày ${ageDays} · ≈${(row.l.estimatedQty / 1e6).toFixed(2).replace(".", ",")} tr con`} />
      <LogForm
        tankId={tankId} taskId={sp.task ? Number(sp.task) : undefined} initialKind={sp.loai === "nuoc" ? "water" : sp.loai === "hh" ? "loss" : "feed"}
        materials={mats} thresholds={Object.fromEntries(thr.map((t) => [t.param, [t.min, t.max]]))}
        lastFeed={lastFeed ? { materialId: lastFeed.l.materialId, qty: lastFeed.l.qty, at: lastFeed.l.recordedAt.toISOString(), by: lastFeed.name } : null}
        next={next} estimated={row.l.estimatedQty}
      />
    </>
  );
}
