import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { canFarm } from "@/server/access";
import { seesAllFarms } from "@/server/types";
import { LOT_PAGE, lotList, lotProgress, stageCodes, visibleFarms } from "@/server/queries-production";
import { Button, Card, Empty, LinkButton, PageHeader } from "@/components/ui";
import { Field, Select } from "@/components/ui/fields";
import { DataTable, type DataRow } from "@/components/ui/data-table";
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
          <div className="min-w-44"><Field label="Trại">
            <Select name="farm" defaultValue={farmId ? String(farmId) : "all"}>
              {farmsList.length > 1 || seesAllFarms(actor) ? <option value="all">Tất cả trại</option> : null}
              {farmsList.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          </Field></div>
          <div className="min-w-32"><Field label="Giai đoạn">
            <Select name="stage" defaultValue={stageCode ?? ""}>
              <option value="">Tất cả</option>
              {stagesList.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </Select>
          </Field></div>
          <div className="min-w-36"><Field label="Trạng thái">
            <Select name="status" defaultValue={status ?? "all"}>
              {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </Field></div>
          <Button type="submit">Lọc</Button>
        </form>

        {rows.length ? (
          <>
            <DataTable searchLabel="Tìm mã lô, bể, trại" emptyTitle="Chưa có lô" noMatchTitle="Không có lô khớp từ khoá"
              columns={[
                { key: "code", header: "Mã lô", sortable: true },
                { key: "tank", header: "Bể", sortable: true },
                { key: "stage", header: "Giai đoạn", sortable: true, width: 110 },
                { key: "day", header: "Ngày tuổi", align: "end", sortable: true, width: 110 },
                { key: "est", header: "Ước lượng", align: "end", sortable: true },
                { key: "harvest", header: "Dự kiến thu", sortable: true },
                { key: "status", header: "Trạng thái", width: 130 },
              ]}
              rows={rows.map(({ lot, tankCode, stage, farmName }): DataRow => {
                const p = lotProgress(lot);
                const rearing = lot.status === "rearing";
                return {
                  id: String(lot.id),
                  search: `${lot.code} ${tankCode} ${farmName} ${stage.code}`,
                  sort: { code: lot.code, tank: tankCode, stage: stage.code, day: rearing ? p.day : null, est: lot.estimatedQty, harvest: lot.expectedHarvestAt ? new Date(lot.expectedHarvestAt).getTime() : null },
                  cells: {
                    code: <Link href={`/san-xuat/lo/${lot.id}`} className="font-mono font-semibold text-accent-ink hover:underline">{lot.code}</Link>,
                    tank: <><span className="font-mono">{tankCode}</span>{farmId ? null : <span className="ml-2 text-xs text-fg-2">{farmName}</span>}</>,
                    stage: stage.code,
                    day: <span className="num">{rearing ? `ngày ${fmtNum(locale, p.day)}` : "—"}</span>,
                    est: <span className="num">{fmtNum(locale, lot.estimatedQty)}</span>,
                    harvest: <span className="num">{fmtDate(locale, lot.expectedHarvestAt)}</span>,
                    status: <StatusBadge status={lot.status} locale={locale} />,
                  },
                };
              })} />
            {pages > 1 ? (
              <nav aria-label="Phân trang" className="num flex items-center justify-end gap-2 border-t border-line p-3 text-[13px]">
                <span className="text-fg-2">Trang {page}/{pages}</span>
                {page > 1 ? <LinkButton href={qs(page - 1)} aria-label="Trang trước"><ChevronLeft size={16} aria-hidden /></LinkButton> : null}
                {page < pages ? <LinkButton href={qs(page + 1)} aria-label="Trang sau"><ChevronRight size={16} aria-hidden /></LinkButton> : null}
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
