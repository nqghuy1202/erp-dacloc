import type { ReactNode } from "react";
import { SyncBadge } from "./sync-badge";

export function FieldTop({ title, sub, left }: { title: ReactNode; sub?: ReactNode; left?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 pb-3" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
      {left}
      <div className="min-w-0"><div className="truncate text-lg font-bold">{title}</div>{sub ? <div className="truncate text-[13px] text-fg-2">{sub}</div> : null}</div>
      <SyncBadge />
    </header>
  );
}
