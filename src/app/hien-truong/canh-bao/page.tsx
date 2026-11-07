import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { fmtAgo } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { openAlerts } from "@/server/queries";
import { FieldTop } from "@/components/field/top";
import { cn } from "@/components/ui/cn";
import { AckButton } from "./ack-button";

export const dynamic = "force-dynamic";

export default async function FieldAlertsPage() {
  const actor = await requireActor(["worker", "farm_lead"]);
  const { locale } = await getT();
  const rows = await openAlerts(db, actor, 50);
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
  return (
    <>
      <FieldTop title="Cảnh báo" sub={`${rows.length} đang mở`} />
      <ul className="flex flex-col gap-3 p-4">
        {!rows.length ? <li className="py-16 text-center text-fg-2">Không có cảnh báo</li> : null}
        {rows.map(({ a, farmName }) => (
          <li key={a.id} className={cn("flex flex-col gap-2 rounded-[14px] border bg-surface p-4", a.severity === "bad" ? "border-2 border-bad" : "border-line")}>
            <div className="flex items-start gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", a.severity === "bad" ? "bg-bad-soft text-bad-ink" : "bg-warn-soft text-warn-ink")}>{a.severity === "bad" ? "Khẩn" : "Theo dõi"}</span>
              <span className="ml-auto text-xs text-fg-2">{fmtAgo(locale, a.createdAt)}</span>
            </div>
            <div className="font-semibold">{a.title}</div>
            <div className="text-[13px] text-fg-2">{farmName ?? "Toàn khu"} · {a.detail}{a.status === "ack" ? " · đã xác nhận" : ""}</div>
            <div className="flex gap-2">
              {a.tankId && actor.role === "worker" ? <Link href={`/hien-truong/be/${a.tankId}?loai=nuoc`} className="flex min-h-12 flex-1 items-center justify-center rounded-ctl border border-line font-medium">Đo lại</Link> : null}
              {a.lotId && actor.role === "farm_lead" ? <Link href={`/san-xuat/lo/${a.lotId}`} className="flex min-h-12 flex-1 items-center justify-center rounded-ctl border border-line font-medium">Mở lô</Link> : null}
              {actor.role === "farm_lead" && a.status === "open" ? <div className="flex-1"><AckButton id={a.id} /></div> : null}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
