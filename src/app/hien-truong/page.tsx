import Link from "next/link";
import { ArrowRight, Check, ChevronRight, ClipboardList } from "lucide-react";
import { db } from "@/lib/db/client";
import { getT, requireActor } from "@/lib/session";
import { generateDailyTasks, tasksForUser } from "@/server/planning";
import { ymd } from "@/server/util";
import { FieldTop } from "@/components/field/top";
import { Progress } from "@/components/ui/progress";
import { FieldBadge, FieldEmpty, FieldLinkButton } from "@/components/field/ui";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

export default async function TodayPage() {
  const actor = await requireActor(["worker", "farm_lead"]);
  const { t } = await getT();
  const day = ymd(new Date());
  await generateDailyTasks(db, day); // gọi lười, idempotent (R12)
  const rows = await tasksForUser(db, actor, day);
  const vn = new Date(Date.now() + 7 * 3600e3);
  const nowMin = vn.getUTCHours() * 60 + vn.getUTCMinutes();
  const done = rows.filter((r) => r.task.status === "done");
  const pending = rows.filter((r) => r.task.status === "pending");
  const now = pending.filter((r) => toMin(r.task.slot) <= nowMin + 30);
  const later = pending.filter((r) => toMin(r.task.slot) > nowMin + 30);
  const pct = rows.length ? (done.length / rows.length) * 100 : 0;

  const href = (r: (typeof rows)[number]) => `/hien-truong/be/${r.task.tankId}?task=${r.task.id}&loai=${r.task.kind === "water" ? "nuoc" : "an"}`;
  const next = now[0] ?? later[0]; // Primary M1: "Ghi việc kế tiếp" (design-spec 12 Screen map)

  const Item = ({ r, faded }: { r: (typeof rows)[number]; faded?: boolean }) => {
    const late = r.task.status === "pending" ? nowMin - toMin(r.task.slot) : 0;
    return (
      <Link href={href(r)}
        className={cn("grid min-h-[72px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-card border bg-surface px-4 py-3 shadow-sm active:bg-surface-2",
          late > 60 ? "border-2 border-bad" : "border-line", faded && "opacity-60")}>
        <span className="num font-mono text-sm font-semibold">{r.task.slot}</span>
        <span className="min-w-0">
          <span className="block font-mono text-lg font-bold">{r.tankCode}</span>
          <span className="block text-[13px] text-fg-2">{r.task.title}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {r.task.source === "manual" ? <FieldBadge tone="acc">Trưởng trại giao</FieldBadge> : null}
            {late > 60 ? <FieldBadge tone="bad">Trễ {late} phút</FieldBadge> : null}
          </span>
        </span>
        {faded ? <Check className="text-ok" aria-label="Xong" /> : <ChevronRight className="text-fg-2" aria-hidden />}
      </Link>
    );
  };

  return (
    <>
      <FieldTop title={t("field.today")} sub={`${actor.name} · ${day.slice(8, 10)}/${day.slice(5, 7)}`} />
      <section className="flex flex-col gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="num text-[28px] font-bold leading-tight">Còn {pending.length} <span className="text-[15px] font-medium text-fg-2">/ {rows.length} việc hôm nay</span></div>
        <Progress value={pct} height={8} label={`Đã xong ${done.length}/${rows.length} việc`} />
      </section>
      <div className="flex flex-col gap-2 p-4">
        {!rows.length ? (
          <FieldEmpty title="Chưa được giao bể · liên hệ trưởng trại" icon={<ClipboardList size={32} aria-hidden />} />
        ) : null}
        {now.length ? <h2 className="pt-1 text-xs font-semibold uppercase tracking-wide text-fg-2">Bây giờ</h2> : null}
        {now.map((r) => <Item key={r.task.id} r={r} />)}
        {later.length ? <h2 className="pt-4 text-xs font-semibold uppercase tracking-wide text-fg-2">Sau đó</h2> : null}
        {later.slice(0, 30).map((r) => <Item key={r.task.id} r={r} />)}
        {done.length ? (
          <details className="pt-4">
            <summary className="flex min-h-11 cursor-pointer items-center text-xs font-semibold uppercase tracking-wide text-fg-2">Đã xong · {done.length}</summary>
            <div className="flex flex-col gap-2 pt-2">{done.map((r) => <Item key={r.task.id} r={r} faded />)}</div>
          </details>
        ) : null}
      </div>
      {next ? (
        <div className="sticky z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur" style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}>
          <FieldLinkButton href={href(next)}>Ghi việc kế tiếp · {next.tankCode}<ArrowRight size={20} aria-hidden /></FieldLinkButton>
        </div>
      ) : null}
    </>
  );
}
