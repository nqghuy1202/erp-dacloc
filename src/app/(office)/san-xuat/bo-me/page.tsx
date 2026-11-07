import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { BROOD_PAGE, broodstockList, speciesList, visibleFarms } from "@/server/queries-production";
import { Badge, Card, Empty, PageHeader, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { ReceiveSheet } from "./forms";

export const metadata = { title: "Đàn bố mẹ" };
export const dynamic = "force-dynamic";

export default async function BroodstockPage({ searchParams }: { searchParams: Promise<{ trang?: string }> }) {
  const actor = await requireActor(["farm_lead", "director", "lab"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.trang) || 1));
  const isLead = actor.role === "farm_lead" || actor.role === "admin";
  const [{ rows, total }, broodFarms, sps] = await Promise.all([
    broodstockList(db, actor, page),
    isLead ? visibleFarms(db, actor, "broodstock") : Promise.resolve([]),
    isLead ? speciesList(db) : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / BROOD_PAGE));
  const farmOpts = broodFarms.map((f) => ({ id: f.id, name: f.name }));
  const canReceive = isLead && farmOpts.length > 0 && sps.length > 0;
  const now = Date.now();

  return (
    <>
      <PageHeader title="Đàn bố mẹ" meta={`${fmtNum(locale, total)} đàn`}
        actions={canReceive && total ? <ReceiveSheet farms={farmOpts} species={sps} /> : null} />
      <Card>
        {rows.length ? (
          <>
            <Table head={["Mã đàn", "Trại", "Nguồn", <span key="m" className="block text-right">Đực / cái</span>, "Trạng thái", "Ngày nhận", "Kết quả đầu vào"]}>
              {rows.map(({ b, farmName, speciesName, test }) => {
                const pos = test?.results.filter((r) => r.positive).map((r) => r.indicator) ?? [];
                const overdue = test?.status === "pending" && test.dueAt.getTime() < now;
                return (
                  <tr key={b.id}>
                    <td><div className="font-mono font-medium">{b.code}</div><div className="text-xs text-fg-2">{speciesName}</div></td>
                    <td>{farmName}</td>
                    <td className="max-w-56">
                      <div className="truncate" title={b.source}>{b.source}</div>
                      {b.origin || b.line ? <div className="truncate text-xs text-fg-2">{[b.origin, b.line && `dòng ${b.line}`].filter(Boolean).join(" · ")}</div> : null}
                    </td>
                    <td className="text-right">{fmtNum(locale, b.males)} / {fmtNum(locale, b.females)}</td>
                    <td><StatusBadge status={b.status} locale={locale} /></td>
                    <td>{fmtDate(locale, b.receivedAt)}</td>
                    <td>
                      {!test ? <Badge tone="warn">Chưa có phiếu</Badge>
                        : test.status === "pending" ? <Badge tone={overdue ? "bad" : "warn"}>{overdue ? "Quá hạn" : "Chờ kết quả"} · {fmtDate(locale, test.dueAt).slice(0, 5)}</Badge>
                          : test.status === "void" ? <Badge>Đã huỷ</Badge>
                            : pos.length ? <Badge tone="bad">Dương tính: {pos.join(", ")}</Badge> : <Badge tone="ok">Âm tính</Badge>}
                    </td>
                  </tr>
                );
              })}
            </Table>
            {pages > 1 ? (
              <nav aria-label="Phân trang" className="num flex items-center justify-end gap-2 border-t border-line p-3 text-[13px]">
                <span className="text-fg-2">Trang {page}/{pages}</span>
                {page > 1 ? <Link href={`/san-xuat/bo-me?trang=${page - 1}`} aria-label="Trang trước" className="grid h-10 w-10 place-items-center rounded-ctl border border-line hover:bg-surface-2"><ChevronLeft size={16} /></Link> : null}
                {page < pages ? <Link href={`/san-xuat/bo-me?trang=${page + 1}`} aria-label="Trang sau" className="grid h-10 w-10 place-items-center rounded-ctl border border-line hover:bg-surface-2"><ChevronRight size={16} /></Link> : null}
              </nav>
            ) : null}
          </>
        ) : (
          <Empty title="Chưa có đàn bố mẹ" action={canReceive ? <ReceiveSheet farms={farmOpts} species={sps} /> : undefined} />
        )}
      </Card>
    </>
  );
}
