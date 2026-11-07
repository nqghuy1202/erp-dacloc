import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum, type Locale } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { traceFinishedLot } from "@/server/production";
import { qrSvg, traceUrl, userName } from "@/server/queries-lab";
import { Badge, Card, CardBody, CardHeader, Empty, LinkButton, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { TraceSearch } from "../search-form";

export const metadata = { title: "Truy xuất lô" };
export const dynamic = "force-dynamic";

type Trace = NonNullable<Awaited<ReturnType<typeof traceFinishedLot>>>;
type Branch = Trace["branches"][number];
type LabTest = Branch["lotTests"][number];

const Missing = ({ what }: { what: string }) => <Badge tone="warn">Thiếu dữ liệu: {what}</Badge>;

function Step({ title, children, last = false }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <li className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-3 pb-6 last:pb-0">
      <span className="relative z-10 mt-1 h-3 w-3 rounded-full border-2 border-accent bg-surface" aria-hidden />
      {!last ? <span className="absolute bottom-0 left-[5px] top-4 w-0.5 bg-line" aria-hidden /> : null}
      <div className="min-w-0">
        <h3 className="text-[13px] font-medium text-fg-2">{title}</h3>
        <div className="mt-1 text-[14px]">{children}</div>
      </div>
    </li>
  );
}

function Results({ test }: { test: LabTest }) {
  return (
    <div className="flex flex-wrap gap-1">
      {test.results.length ? test.results.map((r) => (
        <Badge key={r.indicator} tone={r.positive ? "bad" : "ok"}>{r.indicator} {r.positive ? "dương tính" : "âm tính"}</Badge>
      )) : <span className="text-fg-2">Không có chỉ tiêu</span>}
    </div>
  );
}

function Chain({ b, locale, canLab }: { b: Branch; locale: Locale; canLab: boolean }) {
  const survival = b.lot.stockedQty ? (b.lot.estimatedQty / b.lot.stockedQty) * 100 : null;
  const pcr = b.lotTests.filter((t) => t.kind === "pcr");
  const testLink = (t: LabTest) => canLab ? <Link href={`/xet-nghiem/${t.id}`} className="font-medium text-accent-ink hover:underline">{t.code}</Link> : <span className="font-medium">{t.code}</span>;
  return (
    <ol className="num">
      <Step title="Lô ương">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/san-xuat/lo/${b.lot.id}`} className="font-medium text-accent-ink hover:underline">{b.lot.code}</Link>
          <StatusBadge status={b.lot.status} />
        </div>
        <div className="mt-1 text-[13px] text-fg-2">
          Bể {b.tank?.code ?? "—"} · thả {fmtDate(locale, b.lot.stockedAt)} · thu {fmtDate(locale, b.lot.closedAt)} · {fmtNum(locale, b.lot.stockedQty)} con thả
          {survival != null ? ` · tỷ lệ sống ${fmtNum(locale, survival, 1)}%` : ""}
        </div>
      </Step>
      <Step title="Mẻ Nauplius">
        {b.batch ? (
          <>
            <span className="font-medium">{b.batch.code}</span>
            <div className="mt-1 text-[13px] text-fg-2">Đẻ {fmtDate(locale, b.batch.spawnedAt)} · {fmtNum(locale, b.batch.nauplius)} Nauplius · {fmtNum(locale, b.batch.femalesSpawned)} con cái</div>
          </>
        ) : <Missing what="mẻ Nauplius" />}
      </Step>
      <Step title="Đàn bố mẹ">
        {b.broodstock ? (
          <>
            <span className="font-medium">{b.broodstock.code}</span>
            <div className="mt-1 text-[13px] text-fg-2">Nguồn {b.broodstock.source}{b.broodstock.origin ? ` · ${b.broodstock.origin}` : ""}{b.broodstock.line ? ` · dòng ${b.broodstock.line}` : ""}</div>
            <div className="mt-2 flex flex-col gap-2">
              {b.broodTests.length ? b.broodTests.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center gap-2 text-[13px]">{testLink(t)}<Results test={t} /></div>
              )) : <div><Missing what="kết quả đầu vào" /></div>}
            </div>
          </>
        ) : <Missing what="đàn bố mẹ" />}
      </Step>
      <Step title="Phiếu PCR">
        {pcr.length ? (
          <div className="flex flex-col gap-2">
            {pcr.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 text-[13px]">
                {testLink(t)}<span className="text-fg-2">{fmtDate(locale, t.sampledAt)} · {t.lab}</span><Results test={t} />
              </div>
            ))}
          </div>
        ) : <Missing what="phiếu PCR" />}
      </Step>
      <Step title="Vật tư đã dùng" last>
        {b.materials.length ? (
          <Table head={["Vật tư", "Số lượng"]} className="max-w-md">
            {b.materials.map((m) => (
              <tr key={`${m.name}-${m.unit}`}><td>{m.name}</td><td className="text-right">{fmtNum(locale, Number(m.qty), 2)} {m.unit}</td></tr>
            ))}
          </Table>
        ) : <span className="text-fg-2">Chưa ghi vật tư</span>}
      </Step>
    </ol>
  );
}

export default async function TracePage({ params }: { params: Promise<{ token: string }> }) {
  const actor = await requireActor();
  const { locale } = await getT();
  let key = (await params).token;
  try { key = decodeURIComponent(key); } catch { /* giữ nguyên */ }
  const trace = key.length <= 200 ? await traceFinishedLot(db, key) : null;
  const crumb = <Link href="/truy-xuat" className="hover:underline">Truy xuất</Link>;

  if (!trace) {
    return (
      <>
        <PageHeader title="Truy xuất lô" crumb={crumb} />
        <Card><Empty title="Không tìm thấy lô" action={<TraceSearch defaultValue={key.slice(0, 200)} autoFocus />} /></Card>
      </>
    );
  }

  const fl = trace.finished;
  const [by, svg] = await Promise.all([userName(db, fl.harvestedBy), qrSvg(traceUrl(await headers(), fl.qrToken))]);
  const canLab = ["lab", "farm_lead", "director", "admin"].includes(actor.role);
  const missingLot = !trace.branches.length;

  return (
    <>
      <PageHeader crumb={crumb} title={fl.code} meta={`Lô thành phẩm · thu ${fmtDate(locale, fl.harvestedAt)}`}
        actions={<LinkButton href={`/truy-xuat/${encodeURIComponent(fl.qrToken)}/tem`} variant="primary"><Printer size={16} aria-hidden />In tem QR</LinkButton>} />

      <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <Card>
          <CardBody className="md:pt-6">
            <dl className="num grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div><dt className="text-[13px] text-fg-2">Số lượng</dt><dd className="text-[22px] font-semibold">{fmtNum(locale, fl.qty)} <span className="text-sm font-medium text-fg-2">PL</span></dd></div>
              <div><dt className="text-[13px] text-fg-2">Giai đoạn</dt><dd className="text-[22px] font-semibold">{fl.stageCode}</dd></div>
              <div><dt className="text-[13px] text-fg-2">Tỷ lệ sống</dt><dd className="text-[22px] font-semibold">{fmtNum(locale, fl.survivalRate * 100, 1)}%</dd></div>
              <div><dt className="text-[13px] text-fg-2">Ngày thu</dt><dd className="font-medium">{fmtDate(locale, fl.harvestedAt)}</dd></div>
              <div><dt className="text-[13px] text-fg-2">Người thu</dt><dd className="font-medium">{by ?? "—"}</dd></div>
              <div><dt className="text-[13px] text-fg-2">Nguồn</dt><dd className="font-medium">{fmtNum(locale, trace.branches.length)} lô ương</dd></div>
            </dl>
          </CardBody>
        </Card>
        <Card className="flex items-center justify-center p-4">
          <div role="img" aria-label={`Mã QR lô ${fl.code}`} className="h-40 w-40 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Chuỗi nguồn gốc" right={missingLot ? <Missing what="lô ương" /> : null} />
        <CardBody>
          {missingLot ? <Empty title="Thiếu dữ liệu: lô ương" /> : trace.branches.length === 1 ? (
            <Chain b={trace.branches[0]} locale={locale} canLab={canLab} />
          ) : (
            <div className="flex flex-col gap-3">
              {trace.branches.map((b) => (
                <details key={b.lot.id} open className="rounded-card border border-line">
                  <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 font-medium focus-visible:ring-2 focus-visible:ring-accent">Nhánh {b.lot.code}</summary>
                  <div className="border-t border-line p-4"><Chain b={b} locale={locale} canLab={canLab} /></div>
                </details>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
