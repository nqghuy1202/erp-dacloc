import Link from "next/link";
import { db } from "@/lib/db/client";
import { fmtDate, fmtTime } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { labDetail } from "@/server/queries-lab";
import { Badge, Card, CardBody, CardHeader, Empty, LinkButton, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { finalizeTestAction, voidTestAction } from "../actions";
import { FinalizeForm, VoidForm } from "./forms";

export const metadata = { title: "Phiếu xét nghiệm" };
export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { pcr: "PCR", micro: "Vi sinh", quality: "Chất lượng PL" };

export default async function LabTestPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor(["lab", "farm_lead", "director"]);
  const { locale } = await getT();
  const id = Number.parseInt((await params).id, 10);
  const row = Number.isSafeInteger(id) && id > 0 ? await labDetail(db, actor, id) : null;
  const crumb = <Link href="/xet-nghiem" className="hover:underline">Xét nghiệm</Link>;

  if (!row) {
    return (
      <>
        <PageHeader title="Phiếu xét nghiệm" crumb={crumb} />
        <Card><Empty title="Không tìm thấy phiếu" action={<LinkButton href="/xet-nghiem">Về hàng đợi mẫu</LinkButton>} /></Card>
      </>
    );
  }

  const { t, lotId, lotCode, broodCode, farmName, finalizedByName } = row;
  const canWrite = actor.role === "lab" || actor.role === "admin";
  const subjectText = lotCode ?? (broodCode ? `đàn ${broodCode}` : "đối tượng");
  const subject = lotCode
    ? <Link href={`/san-xuat/lo/${lotId}`} className="font-medium text-accent-ink hover:underline">{lotCode}</Link>
    : broodCode ? <Link href={`/san-xuat/bo-me?q=${encodeURIComponent(broodCode)}`} className="font-medium text-accent-ink hover:underline">Đàn {broodCode}</Link>
      : <Badge tone="warn">Thiếu dữ liệu: đối tượng</Badge>;
  const overdue = t.status === "pending" && t.dueAt.getTime() < Date.now();

  return (
    <>
      <PageHeader
        crumb={crumb}
        title={<span className="inline-flex flex-wrap items-center gap-3">{t.code} <StatusBadge status={t.status} /></span>}
        meta={<>{KIND[t.kind] ?? t.kind} · {subject}{farmName ? ` · ${farmName}` : ""}</>}
        actions={t.status === "final" && canWrite ? <VoidForm action={voidTestAction.bind(null, t.id)} code={t.code} /> : null}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Kết quả" />
          <CardBody>
            {t.status === "pending" && canWrite ? (
              <FinalizeForm action={finalizeTestAction.bind(null, t.id)} code={t.code} subject={subjectText}
                indicators={t.results.map((r) => r.indicator)} lab={t.lab} />
            ) : t.status === "pending" ? (
              <Empty title="Chờ kỹ thuật lab nhập kết quả" />
            ) : t.results.length ? (
              <ul className="flex flex-col">
                {t.results.map((r) => (
                  <li key={r.indicator} className="flex min-h-12 items-center gap-3 border-t border-line first:border-t-0">
                    <span className="font-medium">{r.indicator}</span>
                    <Badge tone={r.positive ? "bad" : "ok"} className="ml-auto">{r.positive ? "Dương tính" : "Âm tính"}</Badge>
                  </li>
                ))}
              </ul>
            ) : <Empty title="Phiếu không có chỉ tiêu" />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Thông tin phiếu" />
          <CardBody>
            <dl className="num grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-3 text-[13px]">
              <dt className="text-fg-2">Nơi xét nghiệm</dt><dd>{t.lab}</dd>
              <dt className="text-fg-2">Ngày lấy mẫu</dt><dd>{fmtDate(locale, t.sampledAt)} {fmtTime(locale, t.sampledAt)}</dd>
              <dt className="text-fg-2">Hạn trả kết quả</dt>
              <dd>{fmtDate(locale, t.dueAt)} {fmtTime(locale, t.dueAt)}{overdue ? <Badge tone="bad" className="ml-2">Quá hạn</Badge> : null}</dd>
              {t.finalizedAt ? <><dt className="text-fg-2">Chốt lúc</dt><dd>{fmtDate(locale, t.finalizedAt)} {fmtTime(locale, t.finalizedAt)}{finalizedByName ? ` · ${finalizedByName}` : ""}</dd></> : null}
              {t.status === "void" ? <><dt className="text-fg-2">Lý do huỷ</dt><dd className="whitespace-pre-wrap">{t.voidReason ?? "—"}</dd></> : null}
            </dl>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
