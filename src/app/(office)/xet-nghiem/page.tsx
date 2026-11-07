import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtTime } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { labQueue } from "@/server/queries-lab";
import { Badge, Card, CardBody, Empty, LinkButton, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Xét nghiệm" };
export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { pcr: "PCR", micro: "Vi sinh", quality: "Chất lượng PL" };
const PAGE = 50;

/** "Còn 2 giờ" / "Quá hạn 3 giờ" (ma trận S8: mẫu quá hạn đỏ + chữ) */
function dueText(due: Date, now: Date) {
  const ms = due.getTime() - now.getTime();
  const m = Math.round(Math.abs(ms) / 60000);
  const span = m < 60 ? `${m} phút` : m < 48 * 60 ? `${Math.round(m / 60)} giờ` : `${Math.round(m / 1440)} ngày`;
  return { overdue: ms < 0, text: ms < 0 ? `Quá hạn ${span}` : `Còn ${span}` };
}

export default async function LabQueuePage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; done?: string; inc?: string }> }) {
  const actor = await requireActor(["lab", "farm_lead", "director"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const tab = sp.tab === "done" ? "done" : "pending";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const rows = await labQueue(db, actor, tab, page, PAGE);
  const more = rows.length > PAGE;
  const list = rows.slice(0, PAGE);
  const canEnter = actor.role === "lab" || actor.role === "admin";
  const now = new Date();
  const href = (p: Record<string, string | number>) => `/xet-nghiem?${new URLSearchParams(Object.entries({ tab, ...p }).map(([k, v]) => [k, String(v)]))}`;

  return (
    <>
      <PageHeader title="Xét nghiệm" meta={tab === "pending" ? `${list.length}${more ? "+" : ""} mẫu chờ kết quả` : "Phiếu đã chốt gần đây"} />

      {sp.inc ? (
        <div role="status" className="mb-4 flex flex-wrap items-center gap-2 rounded-card border border-line bg-bad-soft px-4 py-3 text-[14px] text-bad-ink">
          <AlertTriangle size={18} aria-hidden />
          <span className="font-medium">Đã mở sự cố cho {sp.inc}</span>
          <Link href="/san-xuat/su-co" className="ml-auto font-medium underline">Xem sự cố</Link>
        </div>
      ) : null}

      <nav aria-label="Trạng thái phiếu" className="mb-4 inline-flex gap-1 rounded-ctl bg-surface-2 p-1 text-[13px]">
        {([["pending", "Chờ kết quả"], ["done", "Đã chốt"]] as const).map(([k, label]) => (
          <Link key={k} href={`/xet-nghiem?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={cn("inline-flex min-h-10 items-center rounded-md px-4 font-medium", tab === k ? "bg-surface text-fg shadow-sm" : "text-fg-2")}>{label}</Link>
        ))}
      </nav>

      <Card>
        <CardBody>
          {list.length ? (
            <Table head={["Mã phiếu", "Đối tượng", "Loại", "Lab", "Ngày mẫu", tab === "pending" ? "Hạn" : "Ngày chốt", "Trạng thái", ""]}>
              {list.map(({ t, lotId, lotCode, broodCode, farmName }) => {
                const due = dueText(t.dueAt, now);
                const subject = lotCode
                  ? <Link href={`/san-xuat/lo/${lotId}`} className="font-medium text-accent-ink hover:underline">{lotCode}</Link>
                  : broodCode
                    ? <Link href={`/san-xuat/bo-me?q=${encodeURIComponent(broodCode)}`} className="font-medium text-accent-ink hover:underline">Đàn {broodCode}</Link>
                    : <Badge tone="warn">Thiếu đối tượng</Badge>;
                return (
                  <tr key={t.id} className={cn(tab === "pending" && due.overdue && "bg-bad-soft")}>
                    <td className="font-medium">{t.code}</td>
                    <td><div>{subject}</div>{farmName ? <div className="text-xs text-fg-2">{farmName}</div> : null}</td>
                    <td>{KIND[t.kind] ?? t.kind}</td>
                    <td className="max-w-[160px] truncate" title={t.lab}>{t.lab}</td>
                    <td>{fmtDate(locale, t.sampledAt)} {fmtTime(locale, t.sampledAt)}</td>
                    <td>
                      {tab === "pending"
                        ? due.overdue ? <Badge tone="bad">{due.text}</Badge> : <span>{due.text}</span>
                        : t.finalizedAt ? `${fmtDate(locale, t.finalizedAt)} ${fmtTime(locale, t.finalizedAt)}` : "—"}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                      {t.status === "final" && t.results.some((r) => r.positive) ? <Badge tone="bad" className="ml-1">Dương tính</Badge> : null}
                    </td>
                    <td className="text-right">
                      <LinkButton href={`/xet-nghiem/${t.id}`} variant="secondary" className="min-h-10 px-3 text-[13px]">
                        {tab === "pending" && canEnter ? "Nhập kết quả" : "Xem"}
                      </LinkButton>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : <Empty title={tab === "pending" ? "Không có mẫu chờ" : "Chưa có phiếu đã chốt"} />}
          {page > 1 || more ? (
            <div className="mt-4 flex items-center justify-end gap-2 text-[13px]">
              {page > 1 ? <LinkButton href={href({ page: page - 1 })}>Trang trước</LinkButton> : null}
              <span className="num text-fg-2">Trang {page}</span>
              {more ? <LinkButton href={href({ page: page + 1 })}>Trang sau</LinkButton> : null}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
