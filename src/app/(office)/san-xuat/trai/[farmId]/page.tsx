import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtCompact, fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { canFarm } from "@/server/access";
import { alertShort, farmBoard, lotProgress, visibleFarms } from "@/server/queries-production";
import { Badge, Card, Empty, LinkButton, PageHeader, Progress, Stat } from "@/components/ui";
import { ActionForm, Submit } from "@/components/ui/client";
import { StatusBadge } from "@/components/status";
import { cn } from "@/components/ui/cn";
import { markCleanAction } from "./actions";

export const metadata = { title: "Trại" };
export const dynamic = "force-dynamic";

const FILTERS = [
  ["all", "Tất cả"], ["rearing", "Đang ương"], ["soon", "Sắp thu"], ["alert", "Bể lệch"], ["empty", "Trống"], ["cleaning", "Chờ vệ sinh"],
] as const;
type Filter = (typeof FILTERS)[number][0];

export default async function FarmPage({ params, searchParams }: {
  params: Promise<{ farmId: string }>; searchParams: Promise<{ loc?: string; moi?: string }>;
}) {
  const actor = await requireActor(["farm_lead", "director", "lab"]);
  const { locale } = await getT();
  const { farmId: raw } = await params;
  const sp = await searchParams;
  const farmId = Number(raw);
  if (!Number.isInteger(farmId) || farmId <= 0) notFound();

  if (!canFarm(actor, farmId)) {
    return (
      <>
        <PageHeader title="Trại" />
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

  const [board, farmsList] = await Promise.all([farmBoard(db, farmId), visibleFarms(db, actor)]);
  if (!board) notFound();
  const isLead = actor.role === "farm_lead" || actor.role === "admin";
  const filter: Filter = FILTERS.some(([k]) => k === sp.loc) ? (sp.loc as Filter) : "all";
  const fresh = Number(sp.moi) || null;

  const cards = board.tanks.map((c) => {
    const p = c.lot ? lotProgress(c.lot) : null;
    const soon = p?.left != null && p.left <= 3;
    return { ...c, p, soon };
  });
  const stats = {
    rearing: cards.filter((c) => c.lot).length,
    soon: cards.filter((c) => c.lot && c.soon).length,
    alert: cards.filter((c) => c.alert).length,
    empty: cards.filter((c) => c.tank.status === "empty").length,
  };
  const shown = cards.filter((c) =>
    filter === "all" ? true
      : filter === "rearing" ? !!c.lot
        : filter === "soon" ? !!c.lot && c.soon
          : filter === "alert" ? !!c.alert
            : c.tank.status === filter);

  return (
    <>
      <PageHeader
        title={board.farm.name}
        meta={`${board.farm.code} · ${fmtNum(locale, board.tanks.length)} bể`}
        crumb={farmsList.length > 1 ? <Link href="/san-xuat/trai" className="hover:underline">Trại & bể</Link> : undefined}
        actions={isLead ? <LinkButton href="/san-xuat/me-de" variant="primary"><Plus size={16} aria-hidden />Mở lô ương</LinkButton> : null}
      />

      {farmsList.length > 1 ? (
        <nav aria-label="Chọn trại" className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {farmsList.map((f) => (
            <Link key={f.id} href={`/san-xuat/trai/${f.id}`} aria-current={f.id === farmId ? "page" : undefined}
              className={cn("inline-flex min-h-10 shrink-0 items-center rounded-ctl border px-3 text-[13px] font-medium",
                f.id === farmId ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface hover:bg-surface-2")}>
              {f.name}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Đang ương" value={fmtNum(locale, stats.rearing)} />
        <Stat label="Sắp thu 3 ngày" value={fmtNum(locale, stats.soon)} />
        <Stat label="Bể lệch" value={fmtNum(locale, stats.alert)} tone={stats.alert ? "bad" : undefined} />
        <Stat label="Bể trống" value={fmtNum(locale, stats.empty)} />
      </div>

      {board.tanks.length ? (
        <>
          <nav aria-label="Lọc bể" className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map(([k, label]) => (
              <Link key={k} href={k === "all" ? `/san-xuat/trai/${farmId}` : `/san-xuat/trai/${farmId}?loc=${k}`} aria-current={filter === k ? "true" : undefined}
                className={cn("inline-flex min-h-10 items-center rounded-full border px-3 text-[13px] font-medium",
                  filter === k ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg-2 hover:bg-surface-2")}>
                {label}
              </Link>
            ))}
          </nav>
          {shown.length ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              {shown.map(({ tank, lot, stage, alert, p, soon }) => {
                const head = (
                  <div className="flex flex-col items-start gap-1.5">
                    <span className="font-mono text-[18px] font-semibold leading-tight">{tank.code}</span>
                    <span>
                      {alert ? <Badge tone="bad"><AlertTriangle size={12} className="mr-1" aria-hidden />{alertShort(alert.title)}</Badge>
                        : lot ? (soon ? <Badge tone="warn">Sắp thu</Badge> : <Badge tone="acc">Đang ương</Badge>)
                          : <StatusBadge status={tank.status} locale={locale} />}
                    </span>
                  </div>
                );
                const ring = fresh === tank.id ? "ring-2 ring-accent" : "";
                if (lot && p) {
                  return (
                    <li key={tank.id}>
                      <Link href={`/san-xuat/lo/${lot.id}`}
                        className={cn("flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-3 hover:bg-surface-2", alert && "border-l-4 border-l-bad", ring)}>
                        {head}
                        <div className="text-[13px] font-medium">{stage?.code ?? "—"}</div>
                        <Progress value={p.pct} tone={soon ? "warn" : "acc"} height={6} label={`Ngày ${p.day}/${p.total ?? "—"}`} />
                        <div className="num text-xs text-fg-2">
                          ngày {p.day}{p.total ? `/${p.total}` : ""}{lot.expectedHarvestAt ? ` · thu ${fmtDate(locale, lot.expectedHarvestAt).slice(0, 5)}` : ""}
                        </div>
                        <div className="num mt-auto flex items-center justify-between gap-2 text-xs">
                          <span className="text-fg-2">{p.left == null ? "" : p.left > 0 ? `Thu sau ${p.left} ngày` : p.left === 0 ? "Thu hôm nay" : `Quá ${-p.left} ngày`}</span>
                          <span className="font-medium">{fmtCompact(locale, lot.estimatedQty)}</span>
                        </div>
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={tank.id}
                    className={cn("flex min-h-32 flex-col gap-2 rounded-card border p-3",
                      tank.status === "empty" ? "border-dashed border-line bg-transparent text-fg-2" : "border-line bg-surface", ring)}>
                    {head}
                    {tank.status === "cleaning" && isLead ? (
                      <ActionForm action={markCleanAction} className="mt-auto">
                        <input type="hidden" name="tankId" value={tank.id} />
                        <Submit variant="secondary" className="w-full">Đã vệ sinh</Submit>
                      </ActionForm>
                    ) : null}
                    {tank.status === "empty" && isLead ? (
                      <Link href={`/san-xuat/me-de?be=${tank.id}`} className="mt-auto inline-flex min-h-10 items-center gap-1 text-[13px] font-medium text-accent-ink hover:underline">
                        <Plus size={14} aria-hidden />Mở lô
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Card><Empty title="Không có bể khớp bộ lọc" action={<LinkButton href={`/san-xuat/trai/${farmId}`}>Xem tất cả</LinkButton>} /></Card>
          )}
        </>
      ) : (
        <Card>
          <Empty title="Chưa có bể" action={actor.role === "admin" ? <LinkButton href="/cai-dat/danh-muc">Thêm bể</LinkButton> : <span className="text-[13px] text-fg-2">Liên hệ quản trị</span>} />
        </Card>
      )}
    </>
  );
}
