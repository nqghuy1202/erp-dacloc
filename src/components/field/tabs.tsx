"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid2x2, ListChecks, QrCode, User } from "lucide-react";
import { cn } from "@/components/ui/cn";

const TABS = [
  { href: "/hien-truong", icon: ListChecks, key: "today" },
  { href: "/hien-truong/be", icon: Grid2x2, key: "tanks" },
  { href: "/hien-truong/quet", icon: QrCode, key: "scan" },
  { href: "/hien-truong/canh-bao", icon: Bell, key: "alerts" },
  { href: "/hien-truong/toi", icon: User, key: "me" },
] as const;

export function FieldTabs({ labels, alertCount }: { labels: Record<(typeof TABS)[number]["key"], string>; alertCount: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Tab hiện trường" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map((t) => {
        const active = t.href === "/hien-truong" ? path === t.href : path.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active ? "text-accent-ink" : "text-fg-2")}>
            <Icon size={22} aria-hidden />{labels[t.key]}
            {t.key === "alerts" && alertCount > 0 ? <span className="num absolute right-[22%] top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">{alertCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
