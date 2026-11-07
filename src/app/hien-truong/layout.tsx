import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { getT, requireActor } from "@/lib/session";
import { FieldTabs } from "@/components/field/tabs";

export const metadata = { title: "Hiện trường" };

/** Vùng (field) — mobile-first, chữ 16px, nút 56dp (Ngoại lệ đã duyệt, design-spec) */
export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor(["worker", "farm_lead"]);
  const { t } = await getT();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-bg pb-24 text-base">
      {children}
      <FieldTabs alertCount={n} labels={{ today: t("field.today"), tanks: t("field.tanks"), scan: t("field.scan"), alerts: t("field.alerts"), me: t("field.me") }} />
    </div>
  );
}
