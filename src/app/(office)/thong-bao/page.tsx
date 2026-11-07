import Link from "next/link";
import { db } from "@/lib/db/client";
import { fmtAgo, fmtDate, fmtTime } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { openAlerts } from "@/server/queries";
import { markNotificationsRead, myNotifications } from "@/server/queries-lab";
import { Badge, Card, CardBody, CardHeader, Empty, PageHeader } from "@/components/ui";
import { ActionForm, Submit } from "@/components/ui/client";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";
import { ackAlertAction } from "./actions";

export const metadata = { title: "Thông báo" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const actor = await requireActor();
  const { locale } = await getT();
  const canAck = ["farm_lead", "director", "admin"].includes(actor.role);
  const [notes, alerts] = await Promise.all([myNotifications(db, actor), openAlerts(db, actor, 50)]);
  // Đã hiển thị cho người dùng → đánh dấu đã đọc (chữ đậm vẫn giữ ở lần xem này)
  if (notes.some(({ n }) => !n.readAt)) await markNotificationsRead(db, actor);
  const unread = notes.filter(({ n }) => !n.readAt).length;

  if (!notes.length && !alerts.length) {
    return (
      <>
        <PageHeader title="Thông báo" />
        <Card><Empty title="Không có thông báo" /></Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Thông báo" meta={`${unread} chưa đọc · ${alerts.length} cảnh báo mở`} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Cảnh báo mở" />
          <CardBody>
            {alerts.length ? (
              <ul className="flex flex-col">
                {alerts.map(({ a, farmName }) => (
                  <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <Badge tone={a.severity === "bad" ? "bad" : "warn"}>{a.severity === "bad" ? "Khẩn" : "Theo dõi"}</Badge>
                    <div className="min-w-0">
                      <Link href={a.lotId ? `/san-xuat/lo/${a.lotId}` : "/thong-bao"} className="font-medium hover:underline">{a.title}</Link>
                      <div className="text-xs text-fg-2">{farmName ?? "Toàn khu"}{a.detail ? ` · ${a.detail}` : ""} · {fmtAgo(locale, a.createdAt)}{a.escalated ? " · đã leo thang" : ""}</div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                      {a.status === "open" && canAck ? (
                        <ActionForm action={ackAlertAction} resetOnSuccess={false}>
                          <input type="hidden" name="alertId" value={a.id} />
                          <Submit variant="secondary">Xác nhận</Submit>
                        </ActionForm>
                      ) : <StatusBadge status={a.status} />}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Không có cảnh báo mở" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Thông báo của tôi" />
          <CardBody>
            {notes.length ? (
              <ul className="flex flex-col">
                {notes.map(({ n, lotId, severity }) => (
                  <li key={n.id} className="flex min-h-12 items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", !n.readAt ? (severity === "bad" ? "bg-bad" : "bg-accent") : "bg-transparent")} aria-hidden />
                    <div className="min-w-0 flex-1">
                      {lotId
                        ? <Link href={`/san-xuat/lo/${lotId}`} className={cn("hover:underline", !n.readAt ? "font-semibold" : "text-fg-2")}>{n.title}</Link>
                        : <span className={cn(!n.readAt ? "font-semibold" : "text-fg-2")}>{n.title}</span>}
                      {!n.readAt ? <span className="sr-only"> (chưa đọc)</span> : null}
                    </div>
                    <span className="num shrink-0 text-xs text-fg-2" title={`${fmtDate(locale, n.createdAt)} ${fmtTime(locale, n.createdAt)}`}>{fmtAgo(locale, n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Không có thông báo" />}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
