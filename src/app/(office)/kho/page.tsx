import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { stockList } from "@/server/inventory";
import { Badge, Card, CardBody, Empty, LinkButton, PageHeader, Table } from "@/components/ui";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Tồn kho" };
export const dynamic = "force-dynamic";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ wh?: string; hl?: string }> }) {
  const actor = await requireActor(["storekeeper", "farm_lead", "director"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const whId = Number(sp.wh) > 0 ? Number(sp.wh) : undefined;
  const highlight = new Set((sp.hl ?? "").split(",").map(Number).filter((n) => n > 0));
  const { warehouses, rows } = await stockList(db, actor, whId);
  const canReceive = actor.role === "storekeeper" || actor.role === "admin";
  const whName = new Map(warehouses.map((w) => [w.id, w.name]));
  const sorted = [...rows].sort((a, b) =>
    Number(b.negative) - Number(a.negative) || Number(b.belowMin) - Number(a.belowMin) || a.material.name.localeCompare(b.material.name, "vi"));
  const neg = rows.filter((r) => r.negative).length;
  const low = rows.filter((r) => r.belowMin && !r.negative).length;
  const createBtn = canReceive ? <LinkButton href="/kho/nhap" variant="primary"><Plus size={16} />Tạo phiếu nhập</LinkButton> : null;

  return (
    <>
      <PageHeader title="Tồn kho" meta={`${rows.length} dòng · ${neg} âm kho · ${low} dưới mức`} actions={createBtn} />

      <nav aria-label="Lọc theo kho" className="mb-4 flex flex-wrap gap-2">
        {[{ id: 0, name: "Tất cả kho" }, ...warehouses].map((w) => {
          const active = (whId ?? 0) === w.id;
          return (
            <Link key={w.id} href={w.id ? `/kho?wh=${w.id}` : "/kho"} aria-current={active ? "page" : undefined}
              className={cn("inline-flex min-h-10 items-center rounded-ctl border px-3 text-[13px] font-medium",
                active ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-fg-2 hover:bg-surface-2")}>
              {w.name}
            </Link>
          );
        })}
      </nav>

      <Card>
        <CardBody>
          {sorted.length ? (
            <Table head={["Vật tư", "Kho", "Tồn", "Tối thiểu", "Hạn gần nhất", "Trạng thái"]}>
              {sorted.map((r) => (
                <tr key={`${r.warehouseId}-${r.materialId}`} className={highlight.has(r.materialId) ? "bg-accent-soft" : undefined}>
                  <td><div className="font-medium">{r.material.name}</div><div className="text-xs text-fg-2">{r.material.code}</div></td>
                  <td>{whName.get(r.warehouseId) ?? "—"}</td>
                  <td className={cn("text-right font-medium", r.negative && "text-bad")}>{fmtNum(locale, r.qty, 1)} {r.material.unit}</td>
                  <td className="text-right">{fmtNum(locale, r.material.minStock)} {r.material.unit}</td>
                  <td>{fmtDate(locale, r.nextExpiry)}</td>
                  <td>
                    <span className="inline-flex flex-wrap gap-1">
                      {r.negative ? <Badge tone="bad">Âm kho</Badge> : r.belowMin ? <Badge tone="warn">Dưới mức</Badge> : <Badge tone="ok">Đủ</Badge>}
                      {r.material.banned ? <Badge tone="bad">Cấm dùng</Badge> : null}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          ) : <Empty title="Chưa có vật tư" action={canReceive ? <LinkButton href="/kho/nhap">Thêm phiếu nhập đầu tiên</LinkButton> : undefined} />}
        </CardBody>
      </Card>
    </>
  );
}
