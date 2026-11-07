import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { countDetail } from "@/server/queries-admin";
import { Card, CardBody, Empty, PageHeader, Table } from "@/components/ui";
import { ActionForm, Submit } from "@/components/ui/client";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";
import { CountForm } from "../forms";
import { approveCountAction, submitCountAction } from "../actions";
import { TOLERANCE, diffRatio } from "../diff";

export const metadata = { title: "Biên bản kiểm kê" };
export const dynamic = "force-dynamic";

export default async function CountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(["storekeeper", "farm_lead", "director"]);
  const { locale } = await getT();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const d = await countDetail(db, actor, id);
  if (!d) notFound();
  const crumb = <Link href="/kho/kiem-ke" className="hover:underline">Kiểm kê</Link>;
  if (d === "forbidden") {
    return (
      <>
        <PageHeader title="Biên bản kiểm kê" crumb={crumb} />
        <Card><CardBody><Empty title="Không có quyền với kho này" /></CardBody></Card>
      </>
    );
  }
  const { c, wh, lines } = d;
  const canCount = c.status === "counting" && (actor.role === "storekeeper" || actor.role === "admin");
  const canApprove = c.status === "pending_approval" && ["farm_lead", "director", "admin"].includes(actor.role);
  const rows = lines.map(({ l, m }) => {
    const actual = l.actualQty ?? null;
    const r = actual == null ? null : diffRatio(l.bookQty, actual);
    return { l, m, actual, r, warn: r != null && Math.abs(r) > TOLERANCE };
  });
  const value = rows.reduce((a, x) => a + (x.actual == null ? 0 : (x.actual - x.l.bookQty) * x.l.unitCost), 0);

  return (
    <>
      <PageHeader title={c.code} crumb={crumb}
        meta={<span className="inline-flex flex-wrap items-center gap-2">{wh.name} · mở {fmtDate(locale, c.createdAt)} <StatusBadge status={c.status} locale={locale} /></span>}
        actions={canApprove ? (
          <ActionForm action={approveCountAction}>
            <input type="hidden" name="id" value={c.id} />
            <Submit>Duyệt</Submit>
          </ActionForm>
        ) : null} />

      <Card>
        <CardBody>
          {!lines.length ? <Empty title="Biên bản chưa có dòng vật tư" /> : canCount ? (
            <CountForm action={submitCountAction} countId={c.id} locale={locale}
              lines={lines.map(({ l, m }) => ({ materialId: m.id, name: m.name, code: m.code, unit: m.unit, bookQty: l.bookQty }))} />
          ) : (
            <>
              <Table head={["Vật tư", "Sổ", "Thực", "Chênh lệch"]}>
                {rows.map(({ l, m, actual, r, warn }) => (
                  <tr key={l.id} className={cn(warn && "bg-warn-soft")}>
                    <td><div className="font-medium">{m.name}</div><div className="text-xs text-fg-2">{m.code}</div></td>
                    <td className="text-right">{fmtNum(locale, l.bookQty, 1)} {m.unit}</td>
                    <td className="text-right">{actual == null ? "—" : `${fmtNum(locale, actual, 1)} ${m.unit}`}</td>
                    <td className={cn("text-right", warn && "font-semibold text-warn-ink")}>
                      {actual == null || r == null ? "—" : <>{actual - l.bookQty > 0 ? "+" : ""}{fmtNum(locale, actual - l.bookQty, 1)} {m.unit} · {fmtNum(locale, r * 100, 1)}%</>}
                    </td>
                  </tr>
                ))}
              </Table>
              {c.status !== "counting" ? (
                <div className="num mt-4 border-t border-line pt-3 text-[13px] text-fg-2">
                  {rows.filter((x) => x.warn).length} dòng lệch &gt; 2% · giá trị chênh lệch {fmtNum(locale, value)} đ
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
    </>
  );
}
