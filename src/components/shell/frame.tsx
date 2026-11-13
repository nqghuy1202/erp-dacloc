"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar, type NavItemView } from "./sidebar";
import { Topbar, type TopbarLabels } from "./topbar";

const KEY = "sidebar";

/** Khung văn phòng: giữ trạng thái mở/ẩn menu cho nút trên Topbar và Sidebar. */
export function Shell({ items, traceLabel, labels, right, children }: {
  items: NavItemView[]; traceLabel: string; labels: TopbarLabels; right: ReactNode; children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // nợ: đọc localStorage sau khi mount nên lần tải đầu có thể chớp sidebar 1 khung, nâng cấp bằng cookie đọc ở server khi cần.
  useEffect(() => { try { if (localStorage.getItem(KEY) === "hidden") setHidden(true); } catch { /* chặn lưu trữ: mặc định hiện */ } }, []);
  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    try { localStorage.setItem(KEY, next ? "hidden" : "shown"); } catch { /* bỏ qua */ }
  };
  return (
    <div className="lg:flex">
      <Sidebar items={items} traceLabel={traceLabel} open={menuOpen} hidden={hidden} onClose={() => setMenuOpen(false)} closeLabel={labels.closeMenu} />
      <div className="min-w-0 flex-1">
        <Topbar sidebarHidden={hidden} menuOpen={menuOpen} onToggleSidebar={toggle} onOpenMenu={() => setMenuOpen(true)} labels={labels}>{right}</Topbar>
        <main className="px-4 py-6 md:px-6 lg:px-8" style={{ paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
