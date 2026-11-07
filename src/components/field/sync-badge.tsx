"use client";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { flush, subscribe } from "@/lib/outbox";
import { cn } from "@/components/ui/cn";

/** Trạng thái đồng bộ luôn hiện (design-spec M1–M4) */
export function SyncBadge() {
  const [s, setS] = useState({ pending: 0, online: true, syncing: false } as { pending: number; online: boolean; syncing: boolean; lastError?: string });
  useEffect(() => subscribe(setS), []);
  const ok = s.online && s.pending === 0 && !s.lastError;
  const label = s.syncing ? "Đang đồng bộ" : ok ? "Đã đồng bộ" : !s.online ? `Ngoại tuyến · ${s.pending} chờ` : s.lastError ? `${s.lastError} · ${s.pending} chờ` : `${s.pending} dòng chờ`;
  return (
    <button type="button" onClick={() => void flush()} aria-label={`${label}. Bấm để đồng bộ lại`}
      className={cn("ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold", ok ? "bg-ok-soft text-ok-ink" : "bg-warn-soft text-warn-ink")}>
      {s.syncing ? <RefreshCw size={14} className="animate-spin" /> : ok ? <Cloud size={14} /> : <CloudOff size={14} />}{label}
    </button>
  );
}
