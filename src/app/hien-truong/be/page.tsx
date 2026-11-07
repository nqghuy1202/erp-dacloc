import Link from "next/link";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { alerts, logs, lots, stages, tankWorkers, tanks } from "@/lib/db/schema";
import { requireActor } from "@/lib/session";
import { FieldTop } from "@/components/field/top";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

export default async function MyTanksPage() {
  const actor = await requireActor(["worker", "farm_lead"]);
  const tankRows = actor.role === "worker"
    ? await db.select({ t: tanks }).from(tankWorkers).innerJoin(tanks, eq(tanks.id, tankWorkers.tankId)).where(eq(tankWorkers.userId, actor.id))
    : await db.select({ t: tanks }).from(tanks).where(actor.farmIds.length ? inArray(tanks.farmId, actor.farmIds) : sql`true`);
  const ids = tankRows.map((r) => r.t.id);
  const lotRows = ids.length ? await db.select({ l: lots, st: stages }).from(lots).innerJoin(stages, eq(stages.id, lots.stageId)).where(and(inArray(lots.tankId, ids), eq(lots.status, "rearing"))) : [];
  const lastWater = ids.length ? await db.selectDistinctOn([logs.tankId], { tankId: logs.tankId, data: logs.data, at: logs.recordedAt }).from(logs)
    .where(and(inArray(logs.tankId, ids), eq(logs.kind, "water"))).orderBy(logs.tankId, desc(logs.recordedAt)) : [];
  const open = ids.length ? await db.select({ tankId: alerts.tankId, title: alerts.title }).from(alerts).where(and(inArray(alerts.tankId, ids), sql`${alerts.status} <> 'closed'`)) : [];
  const sorted = [...tankRows].sort((a, b) => a.t.code.localeCompare(b.t.code));
  return (
    <>
      <FieldTop title="Bể của tôi" sub={`${lotRows.length} bể đang ương`} />
      <div className="grid grid-cols-2 gap-3 p-4">
        {!sorted.length ? <p className="col-span-2 py-16 text-center text-fg-2">Chưa được giao bể · liên hệ trưởng trại</p> : null}
        {sorted.map(({ t }) => {
          const lot = lotRows.find((r) => r.l.tankId === t.id);
          const w = lastWater.find((x) => x.tankId === t.id);
          const al = open.find((a) => a.tankId === t.id);
          const body = (
            <>
              <span className="font-mono text-lg font-bold">{t.code}</span>
              <span className="text-[13px] text-fg-2">{lot ? lot.st.name : t.status === "cleaning" ? "Chờ vệ sinh" : "Trống"}</span>
              {w ? <span className="num text-[13px]">pH {String(w.data.ph ?? "—").replace(".", ",")} · {String(w.data.temp ?? "—").replace(".", ",")}°C</span> : null}
              {al ? <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad-ink">{al.title.split(" · ")[0]}</span> : null}
            </>
          );
          const cls = cn("flex min-h-[112px] flex-col items-start gap-1 rounded-[14px] border bg-surface p-4", al ? "border-2 border-bad" : "border-line", !lot && "opacity-60");
          return lot ? <Link key={t.id} href={`/hien-truong/be/${t.id}`} className={cls}>{body}</Link> : <div key={t.id} className={cls}>{body}</div>;
        })}
      </div>
    </>
  );
}
