import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { canFarm } from "@/server/access";
import { seesAllFarms } from "@/server/types";
import { LOT_PAGE, lotList, lotProgress, stageCodes, visibleFarms } from "@/server/queries-production";
import { Card, Empty, LinkButton, PageHeader, Select, Table } from "@/components/ui";
import { StatusBadge } from "@/components/status";

export const metadata = { title: "Lô ương" };
export const dynamic = "force-dynamic";

const STATUSES = [["rearing", "Đang ương"], ["harvested", "Đã thu"], ["cancelled", "Đã huỷ"], ["all", "Mọi trạng thái"]] as const;

export default async function LotsPage({ searchParams }: { searchParams: Promise<{ farm?: string; stage?: string; status?: string; trang?: string }> }) {
  const actor = await requireActor(["farm_lead", "director", "lab"]);
  const { locale } = await getT();
  const sp = await searchParams;
  const [farmsList, stagesList] = await Promise.all([visibleFarms(db, actor), stageCodes(db)]);

  // Mặc định lọc theo trại đầu tiên với người có phạm vi trại (ma trận S6: 2.000 lô)
  const reqFarm = sp.farm === "all" ? undefined : Number(sp.farm) || undefined;
  const farmId = sp.farm === undefined && !seesAllFarms(actor) ? farmsList[0]?.id : reqFarm && canFarm(actor, reqFarm) ? reqFarm : undefined;
  const stageCode = stagesList.some((s) => s.code === sp.stage) ? sp.stage : undefined;
  const status = sp.status === "all" ? undefined : STATUSES.some(([k]) => k === sp.status) ? sp.status : "rearing";
  const page = Math.max(1, Math.floor(Number(sp.trang) || 1));
  const { rows, total } = await lotList(db, actor, { farmId, stageCode, status, page });
  const pages = Math.max(1, Math.ceil(total / LOT_PAGE));
  const isLead = actor.role === "farm_lead" || actor.role === "admin";

  const qs = (p: number) => {
    const u = new URLSearchParams();
    u.set("farm", farmId ? String(farmId) : "all");
    if (stageCode) u.set("stage", stageCode);
    u.set("status", status ?? "all");
    if (p > 1) u.set("trang", String(p));
    return `/san-xuat/lo?${u}`;
  };

  return (
    <>
      <PageHeader title="Lô ương" meta={`${fmtNum(locale, total)} lô`}
        actions={isLead ? <LinkButton href="/san-xuat/me-de" variant="primary"><Plus size={16} aria-hidden />Mở lô ương</LinkButton> : null} />

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3 border-b border-line p-4">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-fg-2">Trại
            <Select name="farm" defaultValue={farmId ? String(farmId) : "all"} className="min-w-44">
              {farmsList.length > 1 || seesAllFarms(actor) ? <option value="all">Tất cả trại</option> : null}
              {farmsList.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-fg-2">Giai đoạn
            <Select name="stage" defaultValue={stageCode ?? ""} className="min-w-32">
              <option value="">Tất cả</option>
              {stagesList.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-fg-2">Trạng thái
            <Select name="status" defaultValue={status ?? "all"} className="min-w-36">
              {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </label>
          <button type="submit" className="inline-flex min-h-10 items-center rounded-ctl border border-line bg-surface px-4 font-medium hover:bg-surface-2">Lọc</button>
        </form>

        {rows.length ? (
          <>
            <Table head={["Mã lô", "Bể", "Giai đoạn", "Ngày tuổi", <span key="e" className="block text-right">Ước lượng</span>, "Dự kiến thu", "Trạng thái"]}>
              {rows.map(({ lot, tankCode, stage, farmName }) => {
                const p = lotProgress(lot);
                return (
                  <tr key={lot.id} className="hover:bg-surface-2">
                    <td><Link href={`/san-xuat/lo/${lot.id}`} className="font-mono font-medium text-accent-ink hover:underline">{lot.code}</Link></td>
                    <td><span className="font-mono">{tankCode}</span>{farmId ? null : <span className="ml-2 text-xs text-fg-2">{farmName}</span>}</td>
                    <td>{stage.code}</td>
                    <td>{lot.status === "rearing" ? `ngày ${fmtNum(locale, p.day)}` : "—"}</td>
                    <td className="text-right">{fmtNum(locale, lot.estimatedQty)}</td>
                    <td>{fmtDate(locale, lot.expectedHarvestAt)}</td>
                    <td><StatusBadge status={lot.status} locale={locale} /></td>
                  </tr>
                );
              })}
            </Table>
            {pages > 1 ? (
              <nav aria-label="Phân trang" className="num flex items-center justify-end gap-2 border-t border-line p-3 text-[13px]">
                <span className="text-fg-2">Trang {page}/{pages}</span>
                {page > 1 ? <Link href={qs(page - 1)} aria-label="Trang trước" className="grid h-10 w-10 place-items-center rounded-ctl border border-line hover:bg-surface-2"><ChevronLeft size={16} /></Link> : null}
                {page < pages ? <Link href={qs(page + 1)} aria-label="Trang sau" className="grid h-10 w-10 place-items-center rounded-ctl border border-line hover:bg-surface-2"><ChevronRight size={16} /></Link> : null}
              </nav>
            ) : null}
          </>
        ) : (
          <Empty title="Chưa có lô" action={isLead ? <LinkButton href="/san-xuat/me-de">Mở lô ương</LinkButton> : undefined} />
        )}
      </Card>
    </>
  );
}
