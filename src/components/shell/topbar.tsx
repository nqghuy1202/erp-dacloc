"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { BrandLogo } from "@/components/brand";

export type TopbarLabels = { openMenu: string; closeMenu: string; hideSidebar: string; showSidebar: string };

const BTN = "h-11 w-11 shrink-0 place-items-center rounded-ctl text-fg hover:bg-surface-2";

/** Thanh header văn phòng (design-spec 12 §1b). Phần bên phải (chuông, sáng/tối, tài khoản) truyền qua children. */
export function Topbar({ sidebarHidden, menuOpen, onToggleSidebar, onOpenMenu, labels, children }: {
  sidebarHidden: boolean; menuOpen: boolean; onToggleSidebar: () => void; onOpenMenu: () => void; labels: TopbarLabels; children: ReactNode;
}) {
  const side = sidebarHidden ? labels.showSidebar : labels.hideSidebar;
  const SideIcon = sidebarHidden ? PanelLeftOpen : PanelLeftClose;
  return (
    <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-surface"
      style={{ height: "calc(56px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)", paddingLeft: "max(12px, env(safe-area-inset-left))", paddingRight: "max(12px, env(safe-area-inset-right))" }}>
      <button type="button" onClick={onOpenMenu} aria-expanded={menuOpen} aria-controls="drawer-menu" aria-label={labels.openMenu} title={labels.openMenu} className={cn(BTN, "grid lg:hidden")}>
        <Menu size={20} aria-hidden />
      </button>
      <button type="button" onClick={onToggleSidebar} aria-expanded={!sidebarHidden} aria-controls="sidebar" aria-label={side} title={side} className={cn(BTN, "hidden lg:grid")}>
        <SideIcon size={20} aria-hidden />
      </button>
      <Link href="/" className={cn("ml-1 h-11 items-center rounded-ctl px-1", sidebarHidden ? "flex" : "flex lg:hidden")}>
        <BrandLogo className="h-8 w-auto" />
      </Link>
      <div className="ml-auto flex items-center gap-1">{children}</div>
    </header>
  );
}
