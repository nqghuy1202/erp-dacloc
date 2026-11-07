import { and, eq, isNull, sql } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { getT, requireActor } from "@/lib/session";
import { NAV, allowed } from "@/components/shell/nav";
import { Sidebar } from "@/components/shell/sidebar";
import { ThemeToggle } from "@/components/ui/client";
import { ROLE_LABEL } from "@/components/status";
import { logout, setLocale } from "../actions";
import { Bell } from "@/components/shell/bell";

export default async function OfficeLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const { t, locale } = await getT();
  const items = NAV.filter((n) => allowed(n, actor.role)).map((n) => ({
    href: n.href, label: t(n.key), icon: n.icon,
    children: n.children?.filter((c) => allowed(c, actor.role)).map((c) => ({ href: c.href, label: t(c.key) })),
  }));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
  const footer = (
    <>
      <div className="flex items-center gap-2 px-1 text-[13px]">
        <div className="min-w-0"><div className="truncate text-white">{actor.name}</div><div className="text-xs">{ROLE_LABEL[actor.role]} · {actor.empCode}</div></div>
        <Bell count={n} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form action={setLocale} className="flex gap-1">
          {(["vi", "en"] as const).map((l) => (
            <button key={l} name="locale" value={l} aria-pressed={locale === l} className={`min-h-8 rounded-md px-2 text-xs font-semibold uppercase ${locale === l ? "bg-sidebar-active text-white" : ""}`}>{l}</button>
          ))}
        </form>
        <ThemeToggle labels={[t("common.light"), t("common.dark")]} />
      </div>
      <form action={logout}><button className="flex min-h-10 items-center gap-2 px-1 text-[13px]"><LogOut size={16} />{t("common.logout")}</button></form>
    </>
  );
  return (
    <div className="lg:flex">
      <Sidebar items={items} footer={footer} traceLabel={t("nav.trace")} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}
