import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { defaultSurvival, farmsInScope, latestPlan, pendingPlans, tanksOfFarm } from "@/server/queries-admin";
import { ymd } from "@/server/util";
import { Card, CardBody, CardHeader, Empty, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";
import { ApproveButton, PlanEditor, ReturnSheet } from "./forms";
import { reviewPlanAction, savePlanAction } from "./actions";

export const metadata = { title: "Kế hoạch sản xuất" };
export const dynamic = "force-dynamic";

const addMonth = (m: string, d: number) => {
  const [y, mo] = m.split("-").map(Number);
  const i = y * 12 + (mo - 1) + d;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
};
const planStatus = (s: string) => (s === "pending" ? "pending_approval" : s);
const label = (m: string) => `${m.slice(5, 7)}/${m.slice(0, 4)}`;

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ month?: string; farm?: string }> }) {
  const actor = await requireActor(["farm_lead", "director"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "") ? sp.month! : ymd(new Date()).slice(0, 7);
  const prevMonth = addMonth(month, -1);
  const farms = await farmsInScope(db, actor);
  const farm = farms.find((f) => f.id === Number(sp.farm)) ?? farms[0];
  const isLead = actor.role === "farm_lead" || actor.role === "admin";
  const isDirector = actor.role === "director" || actor.role === "admin";
  const href = (p: { month?: string; farm?: number }) => `/san-xuat/ke-hoach?month=${p.month ?? month}${(p.farm ?? farm?.id) ? `&farm=${p.farm ?? farm?.id}` : ""}`;

  const [cur, prev, tanks, survival, pending] = await Promise.all([
    farm ? latestPlan(db, farm.id, month) : null,
    farm && isLead ? latestPlan(db, farm.id, prevMonth) : null,
    farm && isLead ? tanksOfFarm(db, farm.id) : [],
    isLead ? defaultSurvival(db) : 0.6,
    isDirector ? pendingPlans(db) : [],
  ]);
  const editable = isLead && !!farm && (!cur || ["draft", "returned"].includes(cur.plan.status));
  const total = cur?.lines.reduce((a, x) => a + x.l.harvestQty, 0) ?? 0;

  return (
    <>
      <PageHeader title="Kế hoạch sản xuất" crumb="Sản xuất"
        meta={<span className="inline-flex flex-wrap items-center gap-2">{farm?.name ?? "—"} · tháng {label(month)}{cur ? <><StatusBadge status={planStatus(cur.plan.status)} locale={locale} /><span>v{cur.plan.version}</span></> : null}</span>}
        actions={
          <nav aria-label="Chọn tháng" className="flex items-center gap-1">
            <Link href={href({ month: prevMonth })} aria-label={`Tháng ${label(prevMonth)}`} className="grid h-10 w-10 place-items-center rounded-ctl border border-line bg-surface hover:bg-surface-2"><ChevronLeft size={18} /></Link>
            <span className="num min-w-20 text-center text-[15px] font-semibold">{label(month)}</span>
            <Link href={href({ month: addMonth(month, 1) })} aria-label={`Tháng ${label(addMonth(month, 1))}`} className="grid h-10 w-10 place-items-center rounded-ctl border border-line bg-surface hover:bg-surface-2"><ChevronRight size={18} /></Link>
          </nav>
        } />

      {isDirector ? (
        <Card className="mb-4">
          <CardHeader title="Chờ duyệt" right={<span>{pending.length} kế hoạch</span>} />
          <CardBody>
            {pending.length ? (
              <Table head={["Trại", "Tháng", "Phiên bản", "Số lô", "Tổng thu dự kiến", "Gửi lúc", ""]}>
                {pending.map(({ p, farmName, lines, harvest }, i) => (
                  <tr key={p.id}>
                    <td><Link href={href({ month: p.month, farm: p.farmId })} className="font-medium hover:underline">{farmName}</Link></td>
                    <td>{label(p.month)}</td>
                    <td>v{p.version}</td>
                    <td className="text-right">{fmtNum(locale, lines)}</td>
                    <td className="text-right">{fmtNum(locale, harvest)} PL</td>
                    <td>{fmtDate(locale, p.submittedAt)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <ApproveButton action={reviewPlanAction} planId={p.id} primary={i === 0} />
                        <ReturnSheet action={reviewPlanAction} planId={p.id} title={`${farmName} ${label(p.month)}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : <Empty title="Không có kế hoạch chờ duyệt" />}
          </CardBody>
        </Card>
      ) : null}

      {farms.length > 1 ? (
        <nav aria-label="Chọn trại" className="mb-4 flex flex-wrap gap-2">
          {farms.map((f) => (
            <Link key={f.id} href={href({ farm: f.id })} aria-current={f.id === farm?.id ? "page" : undefined}
              className={cn("inline-flex min-h-10 items-center rounded-ctl border px-3 text-[13px] font-medium",
                f.id === farm?.id ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-fg-2 hover:bg-surface-2")}>
              {f.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {cur?.plan.status === "returned" && cur.plan.returnReason ? (
        <div role="status" className="mb-4 rounded-card border border-line bg-bad-soft px-4 py-3 text-[13px] text-bad-ink">
          <span className="font-semibold">Trả lại:</span> {cur.plan.returnReason}
        </div>
      ) : null}

      <Card>
        <CardBody>
          {!farm ? <Empty title="Chưa có trại" /> : editable ? (
            tanks.length ? (
              <PlanEditor key={`${farm.id}-${month}-${cur?.plan.id ?? 0}-${cur?.plan.status ?? "none"}`}
                action={savePlanAction} farmId={farm.id} month={month} prevMonth={prevMonth} survival={survival} locale={locale}
                tanks={tanks.map((t) => ({ id: t.id, code: t.code }))}
                initial={(cur?.lines ?? []).map(({ l }) => ({ tankId: l.tankId, stockDate: l.stockDate, stockQty: l.stockQty, harvestDate: l.harvestDate, harvestQty: l.harvestQty }))}
                prev={(prev?.lines ?? []).map(({ l }) => ({ tankId: l.tankId, stockDate: l.stockDate, stockQty: l.stockQty, harvestDate: l.harvestDate, harvestQty: l.harvestQty }))} />
            ) : <Empty title="Trại chưa có bể" />
          ) : cur ? (
            <>
              <div className="mb-4 border-b border-line pb-3">
                <div className="text-[13px] text-fg-2">Tổng thu dự kiến · {cur.lines.length} lô</div>
                <div className="num text-[22px] font-semibold">{fmtNum(locale, total)} PL</div>
              </div>
              {cur.lines.length ? (
                <Table head={["Bể", "Ngày thả", "Số thả", "Ngày thu", "Số thu dự kiến"]}>
                  {cur.lines.map(({ l, tankCode }) => (
                    <tr key={l.id}>
                      <td className="font-medium">{tankCode}</td>
                      <td>{fmtDate(locale, l.stockDate)}</td>
                      <td className="text-right">{fmtNum(locale, l.stockQty)}</td>
                      <td>{fmtDate(locale, l.harvestDate)}</td>
                      <td className="text-right">{fmtNum(locale, l.harvestQty)}</td>
                    </tr>
                  ))}
                </Table>
              ) : <Empty title="Kế hoạch chưa có lô" />}
            </>
          ) : <Empty title={`Chưa có kế hoạch tháng ${month.slice(5, 7)}`} />}
        </CardBody>
      </Card>
    </>
  );
}
