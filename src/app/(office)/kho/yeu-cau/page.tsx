import { db } from "@/lib/db/client";
import { fmtAgo, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { centralWarehouse, stockList } from "@/server/inventory";
import { farmsInScope, materialsAll, requestQueue } from "@/server/queries-admin";
import { Badge, Card, CardBody, CardHeader, Empty, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { CancelRequestButton, IssueSheet, NewRequestSheet, RejectSheet } from "./forms";
import { cancelReq, issueReq, rejectReq, sendRequest } from "./actions";

export const metadata = { title: "Yêu cầu cấp vật tư" };
export const dynamic = "force-dynamic";

const DAY = 86400e3;

export default async function RequestsPage() {
  const actor = await requireActor(["storekeeper", "farm_lead", "director"]);
  const { locale } = await getT();
  const isLead = actor.role === "farm_lead" || actor.role === "admin";
  const isKeeper = actor.role === "storekeeper" || actor.role === "admin";
  const queue = await requestQueue(db, actor);
  const open = queue.filter((q) => q.r.status === "pending" || q.r.status === "partial");
  const closed = queue.filter((q) => !open.includes(q));

  const [farms, mats] = isLead ? await Promise.all([farmsInScope(db, actor), materialsAll(db)]) : [[], []];
  const available = new Map<number, number>();
  if (isKeeper && open.length) {
    const central = await centralWarehouse(db).catch(() => null);
    if (central) for (const r of (await stockList(db, actor, central.id)).rows) available.set(r.materialId, r.qty);
  }
  const now = new Date();

  const lineText = (q: (typeof queue)[number]) => q.lines.map(({ l, m }) => (
    <div key={l.id}>
      {m.name} · {l.issued > 0 && l.issued < l.qty
        ? <>Đã cấp {fmtNum(locale, l.issued, 1)}/{fmtNum(locale, l.qty, 1)} {m.unit}</>
        : <>{fmtNum(locale, l.qty, 1)} {m.unit}</>}
    </div>
  ));

  return (
    <>
      <PageHeader title="Yêu cầu cấp vật tư" crumb="Kho" meta={`${open.length} chờ xử lý`}
        actions={isLead && farms.length ? (
          <NewRequestSheet action={sendRequest} farms={farms.map((f) => ({ id: f.id, name: f.name }))}
            materials={mats.filter((m) => !m.banned).map((m) => ({ id: m.id, name: m.name, unit: m.unit }))} />
        ) : null} />

      <Card className="mb-4">
        <CardHeader title="Chờ xử lý" right={<span>cũ nhất trước</span>} />
        <CardBody>
          {open.length ? (
            <Table head={["Mã", "Trại", "Vật tư", "Chờ", "Trạng thái", ""]}>
              {open.map((q, i) => {
                const overdue = now.getTime() - q.r.createdAt.getTime() > DAY;
                return (
                  <tr key={q.r.id} className="align-top">
                    <td className="py-3 font-medium">{q.r.code}{q.r.note ? <div className="max-w-48 truncate text-xs font-normal text-fg-2" title={q.r.note}>{q.r.note}</div> : null}</td>
                    <td className="py-3">{q.farmName}</td>
                    <td className="py-3">{lineText(q)}</td>
                    <td className="py-3"><span className="inline-flex items-center gap-2">{fmtAgo(locale, q.r.createdAt, now)}{overdue ? <Badge tone="warn">Quá 24 giờ</Badge> : null}</span></td>
                    <td className="py-3"><StatusBadge status={q.r.status} locale={locale} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        {isKeeper ? (
                          <>
                            <IssueSheet action={issueReq} id={q.r.id} code={q.r.code} farmName={q.farmName} primary={i === 0 && !isLead} locale={locale}
                              lines={q.lines.map(({ l, m }) => ({ materialId: m.id, name: m.name, unit: m.unit, qty: l.qty, issued: l.issued, available: available.get(m.id) ?? 0 }))} />
                            <RejectSheet action={rejectReq} id={q.r.id} code={q.r.code} />
                          </>
                        ) : null}
                        {isLead && q.r.status === "pending" ? <CancelRequestButton action={cancelReq} id={q.r.id} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : <Empty title="Không có yêu cầu chờ" />}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Đã đóng gần đây" />
        <CardBody>
          {closed.length ? (
            <Table head={["Mã", "Trại", "Vật tư", "Gửi", "Trạng thái"]}>
              {closed.map((q) => (
                <tr key={q.r.id} className="align-top">
                  <td className="py-3 font-medium">{q.r.code}</td>
                  <td className="py-3">{q.farmName}</td>
                  <td className="py-3">{lineText(q)}</td>
                  <td className="py-3">{fmtAgo(locale, q.r.createdAt, now)}</td>
                  <td className="py-3">
                    <StatusBadge status={q.r.status} locale={locale} />
                    {q.r.rejectReason ? <div className="max-w-56 truncate text-xs text-fg-2" title={q.r.rejectReason}>{q.r.rejectReason}</div> : null}
                  </td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có yêu cầu đã đóng" />}
        </CardBody>
      </Card>
    </>
  );
}
