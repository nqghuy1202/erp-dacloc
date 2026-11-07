import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtAgo, fmtCompact, fmtMillion, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { overview } from "@/server/planning";
import { lowStock, openAlerts, survival30, weeklyHarvest } from "@/server/queries";
import { runEscalation } from "@/server/alerts";
import { Badge, Card, CardBody, CardHeader, Empty, PageHeader, Progress, Stat, Table } from "@/components/ui";
import { WeeklyChart } from "@/components/charts/weekly";
import { ymd } from "@/server/util";

export const metadata = { title: "Tổng quan" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const actor = await requireActor(["director", "farm_lead"]);
  const { t, locale } = await getT();
  await runEscalation(db); // gọi lười (ADR 0001 — Hobby cron 1 lần/ngày)
  const today = ymd(new Date());
  const [o, alerts, weekly, surv, low] = await Promise.all([overview(db, today), openAlerts(db, actor, 6), weeklyHarvest(db), survival30(db), lowStock(db, actor)]);
  const day = Number(today.slice(8, 10));
  const daysInMonth = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate();
  const pctDone = o.planMonth ? (o.actualMonth / o.planMonth) * 100 : 0;
  const pctMark = o.planMonth && o.planToDate != null ? (o.planToDate / o.planMonth) * 100 : undefined;
  const gap = o.planToDate != null ? o.actualMonth - o.planToDate : null;
  const maxPct = Math.max(40, ...o.ranking.map((r) => r.pct ?? 0), pctMark ?? 0);

  return (
    <>
      <PageHeader title={t("ov.title")} meta={`${today.slice(5, 7)}/${today.slice(0, 4)} · ${o.ranking.length} trại`} />

      <Card className="mb-4 grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-x-8 md:p-6">
        <div>
          <div className="text-[13px] text-fg-2">{t("ov.harvestVsPlan")}</div>
          <div className="num mt-1 text-[32px] font-semibold leading-tight md:text-[40px]">
            {fmtMillion(locale, o.actualMonth)} <span className="text-lg font-medium text-fg-2">/ {o.planMonth != null ? fmtMillion(locale, o.planMonth) : "—"} {t("ov.million")} PL</span>
          </div>
        </div>
        {o.planMonth != null && gap != null ? (
          <div className="num flex flex-wrap items-end gap-6 md:gap-8">
            <div><div className="text-[13px] text-fg-2">{t("ov.planToDate")}</div><div className="text-[22px] font-semibold">{fmtCompact(locale, o.planToDate ?? 0)}</div></div>
            <div><div className="text-[13px] text-fg-2">{t("ov.pctToDate")}</div><div className="text-[22px] font-semibold">{o.planToDate ? fmtNum(locale, (o.actualMonth / o.planToDate) * 100) : "—"}%</div></div>
            <Badge tone={gap < 0 ? "warn" : "ok"} className="px-3 py-1 text-sm">
              {gap < 0 ? <ArrowDown size={14} className="mr-1" /> : <ArrowUp size={14} className="mr-1" />}
              {gap < 0 ? t("ov.behind") : t("ov.ahead")} {fmtCompact(locale, Math.abs(gap))} PL
            </Badge>
          </div>
        ) : (
          <div className="text-[13px]"><Badge tone="warn">{t("ov.noPlan")}</Badge> <Link href="/san-xuat/ke-hoach" className="ml-2 font-medium text-accent-ink underline">Lập kế hoạch</Link></div>
        )}
        {o.planMonth != null ? (
          <div className="md:col-span-2">
            <Progress value={pctDone} mark={pctMark} height={14} label={`Đã thu ${fmtNum(locale, pctDone, 1)}% kế hoạch tháng`} />
            <div className="num mt-2 flex flex-wrap justify-between gap-2 text-xs text-fg-2">
              <span>{fmtNum(locale, pctDone, 1)}%</span><span>{t("ov.markLegend")} ({day}/{daysInMonth})</span><span>{t("ov.daysLeft", { n: daysInMonth - day })}</span>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("ov.activeLots")} value={fmtNum(locale, o.activeLots)} />
        <Stat label={t("ov.estimated")} value={<>{fmtMillion(locale, o.estimatedPl)} <span className="text-sm font-medium text-fg-2">{t("ov.million")}</span></>} />
        <Stat label={t("ov.survival")} value={surv != null ? `${fmtNum(locale, surv * 100, 1)}%` : "—"} />
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t("ov.byFarm")} right={<span>% kế hoạch tháng · vạch = mốc hôm nay</span>} />
          <CardBody>
            <div className="flex flex-col gap-1">
              {o.ranking.map((r) => {
                const slow = r.pctOfToDate != null && r.pctOfToDate < 90;
                return (
                  <Link key={r.farmId} href={`/san-xuat/trai/${r.farmId}`} className="grid min-h-10 grid-cols-[110px_minmax(0,1fr)_96px] items-center gap-3 rounded-ctl px-2 hover:bg-surface-2">
                    <span className="truncate text-[13px] font-medium">{r.name}</span>
                    {r.pct != null ? <Progress value={(r.pct / maxPct) * 100} mark={pctMark != null ? (pctMark / maxPct) * 100 : undefined} tone={slow ? "warn" : "acc"} label={`${r.name} ${r.pct}%`} /> : <span className="text-xs text-fg-2">Chưa có kế hoạch</span>}
                    <span className="num flex items-center justify-end gap-1.5 text-[13px]">{r.pct != null ? `${fmtNum(locale, r.pct, 1)}%` : "—"}{slow ? <Badge tone="warn">{t("ov.behind")}</Badge> : null}</span>
                  </Link>
                );
              })}
              {!o.ranking.length ? <Empty title="Chưa có trại" /> : null}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("ov.openAlerts")} right={<Link href="/thong-bao" className="font-medium text-accent-ink">{t("common.all")}</Link>} />
          <CardBody>
            {alerts.length ? (
              <ul className="flex flex-col">
                {alerts.map(({ a, farmName }) => (
                  <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                    <Badge tone={a.severity === "bad" ? "bad" : "warn"}>{a.severity === "bad" ? "Khẩn" : "Theo dõi"}</Badge>
                    <div className="min-w-0">
                      <Link href={a.lotId ? `/san-xuat/lo/${a.lotId}` : "/thong-bao"} className="font-medium hover:underline">{a.title}</Link>
                      <div className="text-xs text-fg-2">{farmName ?? "Toàn khu"} · {a.detail}{a.escalated ? " · đã leo thang" : ""}</div>
                    </div>
                    <span className="text-xs text-fg-2">{fmtAgo(locale, a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Không có cảnh báo mở" />}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title={t("ov.weekly")} right={<><span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-accent" />{t("ov.actual")}</span><span className="inline-flex items-center gap-1"><i className="h-0.5 w-3 bg-fg-2" />{t("ov.plan")}</span><span>· {t("ov.million")} PL</span></>} />
          <CardBody><WeeklyChart data={weekly} label="Sản lượng 12 tuần, triệu PL" /></CardBody>
        </Card>
        <Card>
          <CardHeader title={t("ov.lowStock")} right={<Link href="/kho" className="font-medium text-accent-ink">Kho</Link>} />
          <CardBody>
            {low.length ? (
              <Table head={["Vật tư", "Kho", "Tồn", "Tối thiểu"]}>
                {low.map((r) => (
                  <tr key={`${r.wh.id}-${r.m.id}`}><td>{r.m.name}</td><td>{r.wh.name}</td><td className={`text-right ${r.qty < 0 ? "text-bad" : ""}`}>{fmtNum(locale, r.qty, 1)} {r.m.unit}</td><td className="text-right">{fmtNum(locale, r.m.minStock)} {r.m.unit}</td></tr>
                ))}
              </Table>
            ) : <Empty title="Tồn kho đủ mức tối thiểu" />}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
