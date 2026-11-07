import Link from "next/link";
import { db } from "@/lib/db/client";
import { fmtAgo, fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { incidentList } from "@/server/queries-production";
import { Badge, Card, CardBody, CardHeader, Empty, PageHeader, type Tone } from "@/components/ui";
import { ResolveSheet } from "./forms";

export const metadata = { title: "Sự cố" };
export const dynamic = "force-dynamic";

const CAUSE: Record<string, [string, Tone]> = {
  water: ["Nước ngoài ngưỡng", "warn"], pcr_positive: ["PCR dương tính", "bad"], loss: ["Hao hụt cao", "warn"],
};
const ACTION: Record<string, string> = { monitor: "Theo dõi thêm", treat: "Xử lý nước / thuốc", cull: "Huỷ lô" };

export default async function IncidentsPage() {
  const actor = await requireActor(["farm_lead", "director"]);
  const { locale } = await getT();
  const { open, resolved } = await incidentList(db, actor);
  const isLead = actor.role === "farm_lead" || actor.role === "admin";

  return (
    <>
      <PageHeader title="Sự cố" meta={`${fmtNum(locale, open.length)} đang mở`} />
      <Card className="mb-4">
        <CardHeader title="Đang mở" />
        <CardBody>
          {open.length ? (
            <ul className="flex flex-col">
              {open.map(({ inc, lot, tankCode, farmName, alertTitle }) => {
                const [cause, tone] = CAUSE[inc.cause] ?? [inc.cause, "warn" as Tone];
                return (
                  <li key={inc.id} className="flex flex-wrap items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                    <Badge tone={tone}>{cause}</Badge>
                    <div className="min-w-0 flex-1">
                      <Link href={`/san-xuat/lo/${lot.id}`} className="font-mono font-medium text-accent-ink hover:underline">{lot.code}</Link>
                      <span className="ml-2 text-[13px] text-fg-2">Bể <span className="font-mono">{tankCode}</span> · {farmName}</span>
                      {alertTitle ? <p className="line-clamp-3 text-[13px]" title={alertTitle}>{alertTitle}</p> : null}
                      <div className="num text-xs text-fg-2">Mở {fmtAgo(locale, inc.createdAt)} trước · ước lượng {fmtNum(locale, lot.estimatedQty)} con</div>
                    </div>
                    {isLead ? <ResolveSheet incidentId={inc.id} lotCode={lot.code} estimated={lot.estimatedQty} /> : null}
                  </li>
                );
              })}
            </ul>
          ) : <Empty title="Không có sự cố mở" />}
        </CardBody>
      </Card>

      {resolved.length ? (
        <Card>
          <CardHeader title="Đã xử lý gần đây" />
          <CardBody>
            <ul className="flex flex-col">
              {resolved.map(({ inc, lot, tankCode, alertTitle }) => (
                <li key={inc.id} className="flex flex-wrap items-start gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                  <Badge tone="ok">Đã xử lý</Badge>
                  <div className="min-w-0 flex-1">
                    <Link href={`/san-xuat/lo/${lot.id}`} className="font-mono font-medium text-accent-ink hover:underline">{lot.code}</Link>
                    <span className="ml-2 text-[13px] text-fg-2">Bể <span className="font-mono">{tankCode}</span> · {CAUSE[inc.cause]?.[0] ?? inc.cause}{alertTitle ? ` · ${alertTitle}` : ""}</span>
                    <p className="line-clamp-3 text-[13px]" title={inc.note ?? undefined}>{ACTION[inc.action ?? ""] ?? "—"}{inc.note ? ` · ${inc.note}` : ""}</p>
                  </div>
                  <span className="num text-xs text-fg-2">{fmtDate(locale, inc.resolvedAt)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
