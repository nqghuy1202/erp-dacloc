"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Box, Cog, FlaskConical, Fish, Home, QrCode, Smartphone } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { BrandLogo } from "@/components/brand";

export type NavItemView = { href: string; label: string; icon: string; children?: { href: string; label: string }[] };
export type ShellLabels = { nav: string; top: string };
const ICONS = { home: Home, fish: Fish, flask: FlaskConical, box: Box, cog: Cog, phone: Smartphone } as Record<string, typeof Home>;
const KEY = "sidebar";

export function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
}

/** Khung văn phòng (design-spec 12 §1, §1b): AppShell Astryx — TopNav (logo + chuông/sáng-tối/tài khoản), SideNav theo vai trò
 *  thu gọn thành rail (nhớ lựa chọn), ngăn menu trên mobile do AppShell tự dựng. */
export function Shell({ items, traceLabel, labels, right, children }: {
  items: NavItemView[]; traceLabel: string; labels: ShellLabels; right: ReactNode; children: ReactNode;
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // nợ: đọc localStorage sau khi mount nên lần tải đầu có thể chớp rail 1 khung, nâng cấp bằng cookie đọc ở server khi cần.
  useEffect(() => { try { if (localStorage.getItem(KEY) === "hidden") setCollapsed(true); } catch { /* chặn lưu trữ: mặc định mở */ } }, []);
  const onCollapsedChange = (c: boolean) => {
    setCollapsed(c);
    try { localStorage.setItem(KEY, c ? "hidden" : "shown"); } catch { /* bỏ qua */ }
  };
  const groupOpen = (it: NavItemView) => !!it.children?.some((c) => isActive(path, c.href));

  return (
    <AppShell height="auto" variant="elevated"
      topNav={
        <TopNav label={labels.top}
          heading={<TopNavHeading heading="Đắc Lộc" headingHref="/" logo={<BrandLogo className="h-8 w-auto" />} />}
          endContent={<div className="flex items-center gap-1">{right}</div>} />
      }
      sideNav={
        <SideNav aria-label={labels.nav}
          collapsible={{ isCollapsed: collapsed, onCollapsedChange }}
          footer={<SideNavItem label={traceLabel} icon={QrCode} href="/truy-xuat" isSelected={isActive(path, "/truy-xuat")} />}>
          <SideNavSection title={labels.nav} isHeaderHidden>
            {items.map((it) => {
              const Icon = ICONS[it.icon] ?? Home;
              if (!it.children) return <SideNavItem key={it.href} label={it.label} icon={Icon} href={it.href} isSelected={isActive(path, it.href)} />;
              return (
                <SideNavItem key={it.href + it.label} label={it.label} icon={Icon} href={it.href} isSelected={false}
                  collapsible={{ defaultIsCollapsed: !groupOpen(it) }}>
                  {it.children.map((c) => <SideNavItem key={c.href} label={c.label} href={c.href} isSelected={isActive(path, c.href)} />)}
                </SideNavItem>
              );
            })}
          </SideNavSection>
        </SideNav>
      }>
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        {children}
      </div>
    </AppShell>
  );
}
