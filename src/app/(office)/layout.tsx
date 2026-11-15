import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { getT, requireActor } from "@/lib/session";
import { NAV, allowed } from "@/components/shell/nav";
import { Shell } from "@/components/shell/frame";
import { AccountMenu } from "@/components/shell/account-menu";
import { Bell } from "@/components/shell/bell";
import { ThemeIconButton } from "@/components/ui/client";
import { ROLE_LABEL } from "@/components/status";
import { logout, setLocale } from "../actions";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const { t, locale } = await getT();
  const items = NAV.filter((n) => allowed(n, actor.role)).map((n) => ({
    href: n.href, label: t(n.key), icon: n.icon,
    children: n.children?.filter((c) => allowed(c, actor.role)).map((c) => ({ href: c.href, label: t(c.key) })),
  }));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
  const right = (
    <>
      <Bell count={n} label={n > 0 ? t("top.notifications", { n }) : t("top.noNotifications")} />
      <ThemeIconButton toDark={t("top.toDark")} toLight={t("top.toLight")} />
      <AccountMenu name={actor.name} roleLabel={ROLE_LABEL[actor.role]} empCode={actor.empCode} locale={locale}
        labels={{ account: t("top.account"), language: t("common.language"), logout: t("common.logout") }} setLocale={setLocale} logout={logout} />
    </>
  );
  return (
    <Shell items={items} traceLabel={t("nav.trace")} right={right}
      labels={{ nav: t("top.mainNav"), top: t("top.topNav") }}>
      {children}
    </Shell>
  );
}
