"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Cog, FlaskConical, Fish, Home, QrCode, Smartphone, X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { BrandLogo } from "@/components/brand";

export type NavItemView = { href: string; label: string; icon: string; children?: { href: string; label: string }[] };
const ICONS = { home: Home, fish: Fish, flask: FlaskConical, box: Box, cog: Cog, phone: Smartphone } as Record<string, typeof Home>;

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

function Links({ items, path, onNav }: { items: NavItemView[]; path: string; onNav?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Điều hướng chính">
      {items.map((it) => {
        const Icon = ICONS[it.icon] ?? Home;
        const groupActive = it.children ? it.children.some((c) => isActive(path, c.href)) : isActive(path, it.href);
        return (
          <div key={it.href + it.label}>
            <Link href={it.href} onClick={onNav} aria-current={!it.children && groupActive ? "page" : undefined}
              className={cn("flex min-h-10 items-center gap-3 rounded-ctl px-3", groupActive ? "text-white" : "", !it.children && groupActive && "bg-accent text-accent-fg")}>
              <Icon size={18} aria-hidden />{it.label}
            </Link>
            {it.children ? (
              <div className="flex flex-col">
                {it.children.map((c) => (
                  <Link key={c.href} href={c.href} onClick={onNav} aria-current={isActive(path, c.href) ? "page" : undefined}
                    className={cn("flex min-h-9 items-center rounded-ctl pl-11 pr-3 text-[13px]", isActive(path, c.href) && "bg-accent font-medium text-accent-fg")}>{c.label}</Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar({ items, traceLabel, open, hidden, onClose, closeLabel }: {
  items: NavItemView[]; traceLabel: string; open: boolean; hidden: boolean; onClose: () => void; closeLabel: string;
}) {
  const path = usePathname();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);
  const brand = (
    <Link href="/" className="flex items-center gap-3 px-2 py-1 font-semibold text-white">
      <BrandLogo className="h-10 w-auto" />Đắc Lộc
    </Link>
  );
  const trace = (
    <Link href="/truy-xuat" onClick={onClose} className="flex min-h-10 items-center gap-2 rounded-ctl bg-sidebar-active px-3 text-[13px]"><QrCode size={16} />{traceLabel}</Link>
  );
  return (
    <>
      <aside id="sidebar" className={cn("sticky top-0 h-dvh w-60 shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-fg", hidden ? "hidden" : "hidden lg:flex")}>
        {brand}
        <Links items={items} path={path} />
        <div className="mt-auto border-t border-sidebar-active pt-4">{trace}</div>
      </aside>
      {open ? (
        <div id="drawer-menu" className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-4 text-sidebar-fg">
            <div className="flex items-center">{brand}<button type="button" autoFocus onClick={onClose} aria-label={closeLabel} className="ml-auto grid h-11 w-11 place-items-center rounded-ctl"><X /></button></div>
            <Links items={items} path={path} onNav={onClose} />
            <div className="mt-auto border-t border-sidebar-active pt-4">{trace}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
