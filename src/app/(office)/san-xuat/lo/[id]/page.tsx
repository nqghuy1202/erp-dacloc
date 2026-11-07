import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Circle, CircleDot, FlaskConical, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db/client";
import { type Locale, fmtCompact, fmtDate, fmtNum, fmtTime } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { canFarm } from "@/server/access";
import { harvestEligibility } from "@/server/production";
import { lotDetail, lotLogDays, lotProgress, lotWaterSeries } from "@/server/queries-production";
import { ymd } from "@/server/util";
import { Badge, Button, Card, CardBody, CardHeader, Empty, LinkButton, PageHeader, Stat, Table, type Tone } from "@/components/ui";
import { ActionForm, Submit } from "@/components/ui/client";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";
import { advanceStageAction, requestTestAction } from "./actions";
import { AddTaskSheet, HarvestSheet } from "./forms";

export const metadata = { title: "Chi tiết lô" };
export const dynamic = "force-dynamic";

const TABS = [["nhat-ky", "Nhật ký"], ["nuoc", "Chỉ số nước"], ["xet-nghiem", "Xét nghiệm"], ["nguon-goc", "Nguồn gốc"]] as const;
type Tab = (typeof TABS)[number][0];
const PARAMS = [["ph", "pH", ""], ["temp", "Nhiệt độ", "°C"], ["salinity", "Độ mặn", "‰"], ["do", "DO", "mg/L"]] as const;
const KIND: Record<string, string> = { feed: "Cho ăn", water: "Nước", loss: "Hao hụt", stage: "Chuyển giai đoạn", note: "Ghi chú" };
const TEST_KIND: Record<string, string> = { pcr: "PCR", micro: "Vi sinh", quality: "Chất lượng PL" };
const DAY = 86400000;

type Thr = { stageId: number; param: string; min: number; max: number };
type StageRow = { id: number; seq: number; code: string; name: string; days: number };

function Forbidden() {
  return (
    <>
      <PageHeader title="Chi tiết lô" />
      <Card>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldAlert size={24} className="text-bad" aria-hidden />
          <div className="text-[15px] font-medium">Không có quyền với trại này</div>
          <LinkButton href="/san-xuat/trai">Về trại của tôi</LinkButton>
        </div>
      </Card>
    </>
  );
}

/** Lịch giai đoạn: mốc đã qua tính từ ngày thả + số ngày chuẩn; mốc hiện tại theo ngày thực; mốc sau tính tiếp từ đó */
function schedule(list: StageRow[], stockedAt: Date, currentSeq: number, currentStart: Date) {
  const out: (StageRow & { start: Date })[] = [];
  let t = stockedAt.getTime();
  for (const s of list) {
    if (s.seq === currentSeq) t = currentStart.getTime();
    out.push({ ...s, start: new Date(t) });
    t += s.days * DAY;
  }
  return out;
}

function groupStages(list: (StageRow & { start: Date })[]) {
  const groups: { key: string; items: (StageRow & { start: Date })[] }[] = [];
  for (const s of list) {
    const key = s.code.replace(/\d+$/, "") || s.code;
    const g = groups[groups.length - 1];
    if (g && g.key === key && /\d$/.test(s.code)) g.items.push(s);
    else groups.push({ key, items: [s] });
  }
  return groups.map((g) => {
    const first = g.items[0], last = g.items[g.items.length - 1];
    const label = g.items.length > 1 ? `${first.name}–${last.name.match(/\d+$/)?.[0] ?? last.name}` : first.name;
    return { ...g, label, first, last };
  });
}

function Sparkline({ points, thr, label }: { points: { t: number; v: number }[]; thr?: { min: number; max: number }; label: string }) {
  const W = 240, H = 64, P = 4;
  const vals = points.map((p) => p.v).concat(thr ? [thr.min, thr.max] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi === lo) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const t0 = points[0].t, t1 = points[points.length - 1].t;
  const x = (t: number) => (t1 === t0 ? W / 2 : P + ((t - t0) / (t1 - t0)) * (W - 2 * P));
  const y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P);
  const out = (v: number) => !!thr && (v < thr.min || v > thr.max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label={label} preserveAspectRatio="none">
      {thr ? <rect x={0} width={W} y={y(thr.max)} height={Math.max(1, y(thr.min) - y(thr.max))} style={{ fill: "rgb(var(--band))" }} /> : null}
      <polyline points={points.map((p) => `${x(p.t)},${y(p.v)}`).join(" ")} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke"
        style={{ stroke: "rgb(var(--accent))" }} strokeLinejoin="round" strokeLinecap="round" />
      {points.filter((p) => out(p.v)).map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.v)} r={3} style={{ fill: "rgb(var(--bad))" }} />)}
    </svg>
  );
}

const fmtVal = (locale: Locale, v: number) => fmtNum(locale, v, Number.isInteger(v) ? 0 : 1);

export default async function LotPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; trang?: string }> }) {
  const actor = await requireActor(["farm_lead", "director", "lab"]);
  const { locale } = await getT();
  const { id: raw } = await params;
  const sp = await searchParams;
  const lotId = Number(raw);
  if (!Number.isInteger(lotId) || lotId <= 0) notFound();

  const d = await lotDetail(db, lotId);
  if (!d) {
    return (
      <>
        <PageHeader title="Chi tiết lô" />
        <Card><Empty title="Lô không tồn tại" action={<LinkButton href="/san-xuat/lo">Về danh sách lô</LinkButton>} /></Card>
      </>
    );
  }
  if (!canFarm(actor, d.lot.farmId)) return <Forbidden />;

  const tab: Tab = TABS.some(([k]) => k === sp.tab) ? (sp.tab as Tab) : "nhat-ky";
  const page = Math.max(1, Math.floor(Number(sp.trang) || 1));
  const now = new Date();
  const today = ymd(now);
  const [e, logDays, water] = await Promise.all([
    harvestEligibility(db, lotId, now),
    tab === "nhat-ky" ? lotLogDays(db, lotId, page) : Promise.resolve(null),
    tab === "nuoc" ? lotWaterSeries(db, lotId) : Promise.resolve(null),
  ]);
  const { lot, tank, farm, species: sp_, stage } = d;
  const rearing = lot.status === "rearing";
  const p = lotProgress(lot, now);
  const isLead = actor.role === "farm_lead" || actor.role === "admin";
  const canTest = isLead || actor.role === "lab";

  // Timeline: tới giai đoạn thu tối thiểu (hoặc giai đoạn hiện tại nếu đã vượt)
  const lastSeq = Math.max(sp_.harvestMinStageSeq, stage.seq);
  const sched = schedule(d.stageList.filter((s) => s.seq <= lastSeq), lot.stockedAt, stage.seq, lot.stageStartedAt);
  const groups = groupStages(sched);
  const stageAt = (at: Date) => {
    let cur = sched[0];
    for (const s of sched) if (s.start <= at && s.seq <= stage.seq) cur = s;
    return cur?.id ?? stage.id;
  };
  const thrFor = (stageId: number, param: string): Thr | undefined => d.thresholds.find((t) => t.stageId === stageId && t.param === param);
  const harvestStage = d.stageList.find((s) => s.seq === sp_.harvestMinStageSeq);
  const harvestStageStart = sched.find((s) => s.seq === sp_.harvestMinStageSeq)?.start;

  // Checklist điều kiện thu hoạch (R5)
  const pendingPcr = d.tests.find((t) => t.kind === "pcr" && t.status === "pending");
  const ck: { label: string; tone: Tone; state: string; detail: string }[] = [
    e.checks.pcr === "ok"
      ? { label: "PCR âm tính còn hiệu lực", tone: "ok", state: "Đạt", detail: `${e.pcr!.code} · hiệu lực đến ${fmtDate(locale, e.pcrValidUntil)}` }
      : e.checks.pcr === "pcr_missing"
        ? { label: "PCR âm tính còn hiệu lực", tone: "warn", state: "Chờ", detail: pendingPcr ? `${pendingPcr.code} chờ kết quả · hạn ${fmtDate(locale, pendingPcr.dueAt)}` : "Chưa có phiếu PCR" }
        : e.checks.pcr === "pcr_expired"
          ? { label: "PCR âm tính còn hiệu lực", tone: "bad", state: "Không đạt", detail: `${e.pcr!.code} hết hiệu lực ${fmtDate(locale, e.pcrValidUntil)}` }
          : { label: "PCR âm tính còn hiệu lực", tone: "bad", state: "Không đạt", detail: `Dương tính: ${e.pcr!.results.filter((r) => r.positive).map((r) => r.indicator).join(", ")}` },
    e.checks.stage === "ok"
      ? { label: "Đạt giai đoạn thu", tone: "ok", state: "Đạt", detail: `${stage.code} · tối thiểu ${harvestStage?.code ?? "—"}` }
      : { label: "Đạt giai đoạn thu", tone: "warn", state: "Chờ", detail: `Cần ${harvestStage?.code ?? "—"} · dự kiến ${fmtDate(locale, harvestStageStart)}` },
    e.checks.status === "ok"
      ? { label: "Trạng thái lô", tone: "ok", state: "Đạt", detail: "Đang ương" }
      : { label: "Trạng thái lô", tone: "bad", state: "Không đạt", detail: lot.status === "harvested" ? "Đã thu" : "Đã huỷ" },
    p.left != null && p.left <= 0
      ? { label: "Ngày dự kiến thu", tone: "ok", state: "Đạt", detail: fmtDate(locale, lot.expectedHarvestAt) }
      : { label: "Ngày dự kiến thu", tone: "warn", state: "Chờ", detail: lot.expectedHarvestAt ? `${fmtDate(locale, lot.expectedHarvestAt)} · còn ${p.left} ngày` : "Chưa đặt" },
  ];
  const blockers = [e.checks.status, e.checks.pcr, e.checks.stage].filter((c) => c !== "ok");
  const REASON: Record<string, string> = {
    pcr_missing: "Chưa có PCR âm tính", pcr_expired: "PCR hết hiệu lực", pcr_positive: "PCR dương tính",
    stage_too_early: "Chưa đạt giai đoạn", lot_not_rearing: "Lô không đang ương",
  };
  const survival = lot.stockedQty ? lot.estimatedQty / lot.stockedQty : null;
  const costPerM = lot.estimatedQty ? lot.costTotal / (lot.estimatedQty / 1e6) : null;

  return (
    <>
      <PageHeader
        crumb={<><Link href={`/san-xuat/trai/${farm.id}`} className="hover:underline">{farm.name}</Link> · <Link href="/san-xuat/lo" className="hover:underline">Lô ương</Link></>}
        title={<span className="flex flex-wrap items-center gap-2"><span className="font-mono">{lot.code}</span><StatusBadge status={lot.status} locale={locale} /><Badge tone="acc">{stage.code} · ngày {fmtNum(locale, p.day)}</Badge></span>}
        meta={<span className="num">Bể <span className="font-mono">{tank.code}</span> · {sp_.nameVi} · thả {fmtDate(locale, lot.stockedAt)}</span>}
        actions={
          <>
            {isLead && rearing ? <AddTaskSheet lotId={lot.id} today={today} /> : null}
            {canTest && rearing ? (
              <ActionForm action={requestTestAction}>
                <input type="hidden" name="lotId" value={lot.id} />
                <Submit variant="secondary"><FlaskConical size={16} aria-hidden />Yêu cầu xét nghiệm</Submit>
              </ActionForm>
            ) : null}
            {isLead && rearing && stage.seq < (d.stageList[d.stageList.length - 1]?.seq ?? 0) ? (
              <ActionForm action={advanceStageAction}>
                <input type="hidden" name="lotId" value={lot.id} />
                <Submit variant="secondary"><ArrowRight size={16} aria-hidden />Chuyển giai đoạn</Submit>
              </ActionForm>
            ) : null}
            {isLead && rearing ? (
              blockers.length ? (
                <div className="flex flex-col items-end gap-1">
                  <Button variant="primary" disabled aria-describedby="harvest-why">Thu hoạch</Button>
                  <span id="harvest-why" className="text-xs text-fg-2">{blockers.map((b) => REASON[b] ?? b).join(" · ")}</span>
                </div>
              ) : (
                <HarvestSheet lotId={lot.id} lotCode={lot.code} tankCode={tank.code} estimated={lot.estimatedQty}
                  summary={`Ước lượng ${fmtNum(locale, lot.estimatedQty)} con · ${e.pcr?.code ?? ""} âm tính`} />
              )
            ) : null}
          </>
        }
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader title="Giai đoạn" right={lot.expectedHarvestAt ? <span className="num">Thu dự kiến {fmtDate(locale, lot.expectedHarvestAt)}</span> : undefined} />
          <CardBody>
            <ol className="flex flex-col">
              {groups.map((g) => {
                const st = g.last.seq < stage.seq ? "done" : g.first.seq <= stage.seq ? "current" : "future";
                const end = new Date(g.last.start.getTime() + g.last.days * DAY);
                return (
                  <li key={`${g.key}-${g.first.seq}`} className="relative flex gap-3 pb-4 last:pb-0">
                    <span className="absolute left-2 top-6 h-full w-px bg-line" aria-hidden />
                    <span className={cn("relative z-10 mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                      st === "done" ? "bg-ok text-white" : st === "current" ? "bg-accent text-accent-fg" : "border border-line bg-surface")}>
                      {st === "done" ? <Check size={12} aria-hidden /> : st === "current" ? <CircleDot size={12} aria-hidden /> : null}
                    </span>
                    <div className={cn("min-w-0 flex-1", st === "current" && "rounded-ctl bg-accent-soft px-3 py-2 text-accent-ink")}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("font-medium", st === "future" && "text-fg-2")}>{g.label}</span>
                        {st === "current" ? <Badge tone="acc">Đang {stage.code}</Badge> : null}
                      </div>
                      <div className="num text-xs text-fg-2">
                        {fmtDate(locale, g.first.start).slice(0, 5)}–{fmtDate(locale, end).slice(0, 5)}{st === "future" ? " · dự kiến" : ""}
                      </div>
                    </div>
                  </li>
                );
              })}
              <li className="relative flex gap-3">
                <span className={cn("relative z-10 mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full",
                  lot.status === "harvested" ? "bg-ok text-white" : "border border-line bg-surface")}>
                  {lot.status === "harvested" ? <Check size={12} aria-hidden /> : <Circle size={8} className="text-fg-2" aria-hidden />}
                </span>
                <div>
                  <div className={cn("font-medium", lot.status !== "harvested" && "text-fg-2")}>Thu hoạch</div>
                  <div className="num text-xs text-fg-2">
                    {lot.status === "harvested" ? fmtDate(locale, lot.closedAt) : lot.expectedHarvestAt ? `${fmtDate(locale, lot.expectedHarvestAt)} · dự kiến` : "—"}
                  </div>
                </div>
              </li>
            </ol>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Điều kiện thu hoạch" />
            <CardBody>
              <ul className="flex flex-col">
                {ck.map((c) => (
                  <li key={c.label} className="flex items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{c.label}</div>
                      <div className="num text-xs text-fg-2">{c.detail}</div>
                    </div>
                    <Badge tone={c.tone}>{c.state}</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Số thả" value={fmtCompact(locale, lot.stockedQty)} />
            <Stat label="Ước lượng" value={fmtCompact(locale, lot.estimatedQty)} />
            <Stat label="Tỷ lệ sống" value={survival != null ? `${fmtNum(locale, survival * 100, 1)}%` : "—"}
              tone={survival != null && survival < sp_.standardSurvival ? "bad" : undefined} sub={`Chuẩn ${fmtNum(locale, sp_.standardSurvival * 100)}%`} />
            <Stat label="Chi phí/triệu PL" value={costPerM != null ? `${fmtCompact(locale, costPerM)} đ` : "—"} />
          </div>
        </div>
      </div>

      <Card>
        <nav aria-label="Mục chi tiết lô" className="flex gap-1 overflow-x-auto border-b border-line px-4 md:px-6">
          {TABS.map(([k, label]) => (
            <Link key={k} href={`/san-xuat/lo/${lot.id}?tab=${k}`} aria-current={tab === k ? "page" : undefined}
              className={cn("inline-flex min-h-12 shrink-0 items-center border-b-2 px-3 text-[14px] font-medium",
                tab === k ? "border-accent text-fg" : "border-transparent text-fg-2 hover:text-fg")}>
              {label}
            </Link>
          ))}
        </nav>
        <CardBody>
          {tab === "nhat-ky" && logDays ? (
            logDays.days.length ? (
              <div className="flex flex-col gap-6">
                {logDays.days.map((g) => (
                  <section key={g.day}>
                    <h3 className="num mb-2 text-[13px] font-semibold text-fg-2">{fmtDate(locale, g.day)} · {fmtNum(locale, g.rows.length)} lần ghi</h3>
                    <ul className="flex flex-col">
                      {g.rows.map(({ log, material, unit, user }) => {
                        const sid = stageAt(log.recordedAt);
                        const vals = log.kind === "water" ? PARAMS.filter(([k]) => typeof log.data[k] === "number").map(([k, l, u]) => {
                          const v = log.data[k] as number; const t = thrFor(sid, k);
                          return { k, l, u, v, bad: !!t && (v < t.min || v > t.max) };
                        }) : [];
                        return (
                          <li key={log.id} className="grid grid-cols-[48px_96px_minmax(0,1fr)_auto] items-start gap-3 border-t border-line py-2 first:border-t-0">
                            <span className="num text-[13px] text-fg-2">{fmtTime(locale, log.recordedAt)}</span>
                            <span className="text-[13px] font-medium">{KIND[log.kind] ?? log.kind}</span>
                            <span className="num min-w-0 text-[13px]">
                              {log.kind === "feed" ? `${material ?? "—"} · ${fmtVal(locale, log.qty ?? 0)} ${unit ?? ""}` : null}
                              {log.kind === "water" ? (
                                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                  {vals.map((x) => <span key={x.k} className={x.bad ? "font-semibold text-bad" : ""}>{x.l} {fmtVal(locale, x.v)}{x.u ? ` ${x.u}` : ""}</span>)}
                                  {vals.some((x) => x.bad) ? <Badge tone="bad">Ngoài ngưỡng</Badge> : null}
                                </span>
                              ) : null}
                              {log.kind === "loss" ? `${fmtVal(locale, Number(log.data.lossPct ?? 0))}%` : null}
                              {log.kind === "stage" ? "Đề xuất chuyển giai đoạn" : null}
                              {typeof log.data.note === "string" && log.data.note ? <span className="block text-fg-2">{log.data.note}</span> : null}
                              {log.suspectTime ? <Badge tone="warn" className="ml-2">Giờ máy lệch</Badge> : null}
                            </span>
                            <span className="truncate text-xs text-fg-2">{user ?? ""}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
                {logDays.totalDays > 7 ? (
                  <nav aria-label="Phân trang nhật ký" className="num flex items-center justify-end gap-2 text-[13px]">
                    <span className="text-fg-2">Trang {page}/{Math.ceil(logDays.totalDays / 7)}</span>
                    {page > 1 ? <LinkButton href={`/san-xuat/lo/${lot.id}?tab=nhat-ky&trang=${page - 1}`}>Mới hơn</LinkButton> : null}
                    {page * 7 < logDays.totalDays ? <LinkButton href={`/san-xuat/lo/${lot.id}?tab=nhat-ky&trang=${page + 1}`}>Cũ hơn</LinkButton> : null}
                  </nav>
                ) : null}
              </div>
            ) : (
              <Empty title="Chưa có nhật ký" action={rearing ? <LinkButton href={`/hien-truong/be/${tank.id}`}>Ghi nhật ký</LinkButton> : undefined} />
            )
          ) : null}

          {tab === "nuoc" && water ? (
            water.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {PARAMS.map(([k, l, u]) => {
                  const pts = water.filter((w) => typeof w.data[k] === "number").map((w) => ({ t: w.at.getTime(), v: w.data[k] as number }));
                  const t = thrFor(stage.id, k);
                  const last = pts[pts.length - 1];
                  const bad = !!last && !!t && (last.v < t.min || last.v > t.max);
                  return (
                    <div key={k} className="rounded-ctl border border-line p-3">
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="text-[13px] font-medium">{l}</span>
                        {last ? <span className={cn("num text-lg font-semibold", bad && "text-bad")}>{fmtVal(locale, last.v)}{u ? <span className="ml-1 text-xs font-normal text-fg-2">{u}</span> : null}</span> : null}
                        {bad ? <Badge tone="bad">Ngoài ngưỡng</Badge> : null}
                        <span className="num ml-auto text-xs text-fg-2">{t ? `Ngưỡng ${fmtVal(locale, t.min)}–${fmtVal(locale, t.max)}` : ""}</span>
                      </div>
                      {pts.length ? <Sparkline points={pts} thr={t} label={`${l}: ${pts.length} lần đo`} /> : <div className="grid h-16 place-items-center text-xs text-fg-2">Chưa có số đo</div>}
                    </div>
                  );
                })}
              </div>
            ) : <Empty title="Chưa có số đo nước" />
          ) : null}

          {tab === "xet-nghiem" ? (
            d.tests.length ? (
              <Table head={["Mã phiếu", "Loại", "Lấy mẫu", "Hạn", "Trạng thái", "Kết quả"]}>
                {d.tests.map((t) => {
                  const pos = t.results.filter((r) => r.positive).map((r) => r.indicator);
                  return (
                    <tr key={t.id}>
                      <td className="font-mono">{t.code}</td>
                      <td>{TEST_KIND[t.kind] ?? t.kind}</td>
                      <td>{fmtDate(locale, t.sampledAt)}</td>
                      <td>{fmtDate(locale, t.dueAt)}</td>
                      <td><StatusBadge status={t.status} locale={locale} /></td>
                      <td>{t.status !== "final" ? "—" : pos.length ? <Badge tone="bad">Dương tính: {pos.join(", ")}</Badge> : <Badge tone="ok">Âm tính</Badge>}</td>
                    </tr>
                  );
                })}
              </Table>
            ) : <Empty title="Chưa có phiếu xét nghiệm" />
          ) : null}

          {tab === "nguon-goc" ? (
            <ol className="flex flex-col gap-3">
              <li className="rounded-ctl border border-line p-3">
                <div className="text-xs text-fg-2">Lô ương</div>
                <div className="font-mono font-medium">{lot.code}</div>
                <div className="num text-[13px] text-fg-2">Bể {tank.code} · thả {fmtDate(locale, lot.stockedAt)} · {fmtNum(locale, lot.stockedQty)} con</div>
                {d.parents.length ? <div className="text-[13px]">Ghép từ: {d.parents.map((x, i) => <span key={x.id}>{i ? ", " : ""}<Link href={`/san-xuat/lo/${x.id}`} className="font-mono text-accent-ink hover:underline">{x.code}</Link></span>)}</div> : null}
              </li>
              {d.origin ? (
                <>
                  <li className="rounded-ctl border border-line p-3">
                    <div className="text-xs text-fg-2">Mẻ đẻ</div>
                    <div className="font-mono font-medium">{d.origin.batch.code}</div>
                    <div className="num text-[13px] text-fg-2">{fmtDate(locale, d.origin.batch.spawnedAt)} · {fmtNum(locale, d.origin.batch.femalesSpawned)} cái đẻ · {fmtNum(locale, d.origin.batch.nauplius)} Nauplius</div>
                  </li>
                  <li className="rounded-ctl border border-line p-3">
                    <div className="text-xs text-fg-2">Đàn bố mẹ</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href="/san-xuat/bo-me" className="font-mono font-medium text-accent-ink hover:underline">{d.origin.brood.code}</Link>
                      <StatusBadge status={d.origin.brood.status} locale={locale} />
                    </div>
                    <div className="num text-[13px] text-fg-2">
                      {d.origin.broodFarm} · {d.origin.brood.source}{d.origin.brood.origin ? ` · ${d.origin.brood.origin}` : ""}{d.origin.brood.line ? ` · dòng ${d.origin.brood.line}` : ""}
                    </div>
                    {d.broodTests.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {d.broodTests.map((t) => {
                          const pos = t.results.filter((r) => r.positive).map((r) => r.indicator);
                          return <Badge key={t.id} tone={t.status !== "final" ? "neu" : pos.length ? "bad" : "ok"}>{t.code} · {t.status !== "final" ? "chờ" : pos.length ? `dương tính ${pos.join(", ")}` : "âm tính"}</Badge>;
                        })}
                      </div>
                    ) : <div className="mt-2"><Badge tone="warn">Thiếu dữ liệu: phiếu xét nghiệm đầu vào</Badge></div>}
                  </li>
                </>
              ) : (
                <li><Badge tone="warn">Thiếu dữ liệu: mẻ đẻ</Badge></li>
              )}
            </ol>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}

