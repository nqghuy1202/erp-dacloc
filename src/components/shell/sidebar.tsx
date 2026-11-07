"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Cog, FlaskConical, Fish, Home, Menu, QrCode, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/cn";

type Item = { href: string; label: string; icon: string; children?: { href: string; label: string }[] };
const ICONS = { home: Home, fish: Fish, flask: FlaskConical, box: Box, cog: Cog, phone: Smartphone } as Record<string, typeof Home>;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

function Links({ items, path, onNav }: { items: Item[]; path: string; onNav?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
      {items.map((it) => {
        const Icon = ICONS[it.icon] ?? Home;
        const groupActive = it.children ? it.children.some((c) => isActive(path, c.href)) : isActive(path, it.href);
        return (
          <div key={it.href + it.label}>
            <Link href={it.href} onClick={onNav} aria-current={!it.children && groupActive ? "page" : undefined}
              className={cn("flex min-h-10 items-center gap-3 rounded-ctl px-3", groupActive ? "text-white" : "", !it.children && groupActive && "bg-sidebar-active")}>
              <Icon size={18} aria-hidden />{it.label}
            </Link>
            {it.children ? (
              <div className="flex flex-col">
                {it.children.map((c) => (
                  <Link key={c.href} href={c.href} onClick={onNav} aria-current={isActive(path, c.href) ? "page" : undefined}
                    className={cn("flex min-h-9 items-center rounded-ctl pl-11 pr-3 text-[13px]", isActive(path, c.href) && "bg-sidebar-active text-white")}>{c.label}</Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ items, footer, traceLabel }: { items: Item[]; footer: React.ReactNode; traceLabel: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const brand = (
    <Link href="/" className="flex items-center gap-2 px-2 py-1 font-semibold text-white">
      <span className="grid h-7 w-7 place-items-center rounded-ctl bg-brand"><Fish size={16} /></span>Đắc Lộc
    </Link>
  );
  const trace = (
    <Link href="/truy-xuat" className="flex min-h-10 items-center gap-2 rounded-ctl bg-sidebar-active px-3 text-[13px]"><QrCode size={16} />{traceLabel}</Link>
  );
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-fg lg:flex">
        {brand}
        <Links items={items} path={path} />
        <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-active pt-4">{trace}{footer}</div>
      </aside>
      <div className="sticky top-0 z-30 flex items-center gap-2 bg-sidebar px-4 py-2 text-sidebar-fg lg:hidden" style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
        {brand}
        <button type="button" onClick={() => setOpen(true)} aria-label="Mở menu" className="ml-auto grid h-11 w-11 place-items-center rounded-ctl"><Menu /></button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-fg">
            <div className="flex items-center">{brand}<button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="ml-auto grid h-11 w-11 place-items-center"><X /></button></div>
            <Links items={items} path={path} onNav={() => setOpen(false)} />
            <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-active pt-4">{trace}{footer}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
