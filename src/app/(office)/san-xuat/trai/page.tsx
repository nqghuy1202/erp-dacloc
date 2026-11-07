import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { farmSummaries } from "@/server/queries-production";
import { Card, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Trại & bể" };
export const dynamic = "force-dynamic";

export default async function FarmsIndexPage() {
  const actor = await requireActor(["farm_lead", "director", "lab"]);
  const { locale } = await getT();
  const list = await farmSummaries(db, actor);
  if (list.length === 1) redirect(`/san-xuat/trai/${list[0].farm.id}`);

  return (
    <>
      <PageHeader title="Trại & bể" meta={list.length ? `${fmtNum(locale, list.length)} trại` : undefined} />
      {list.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(({ farm, tanks, rearing }) => (
            <Link key={farm.id} href={`/san-xuat/trai/${farm.id}`} className="block rounded-card">
              <Card className="flex min-h-12 items-center gap-3 p-4 hover:bg-surface-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{farm.name}</div>
                  <div className="num text-[13px] text-fg-2">
                    {farm.code} · {farm.kind === "broodstock" ? "Bố mẹ" : "Ương"} · {fmtNum(locale, rearing)}/{fmtNum(locale, tanks)} bể đang ương
                  </div>
                </div>
                <ChevronRight size={18} className="ml-auto shrink-0 text-fg-2" aria-hidden />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card><Empty title="Chưa được phân trại" /></Card>
      )}
    </>
  );
}
