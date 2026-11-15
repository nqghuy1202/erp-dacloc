import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

// Bản nhẹ cho PWA hiện trường: chỉ dùng token Astryx (màu/bo góc) qua Tailwind, KHÔNG import component Astryx.
// Lý do: dùng component Astryx làm JS màn hiện trường tăng > 30% (đo 2026-11-15: /hien-truong/be/[tankId] 115 → 289 kB) — design-spec 12 §Platform.

export type FieldTone = "ok" | "warn" | "bad" | "acc" | "neu";
const TONE: Record<FieldTone, string> = {
  ok: "bg-ok-soft text-ok-ink", warn: "bg-warn-soft text-warn-ink", bad: "bg-bad-soft text-bad-ink",
  acc: "bg-accent-soft text-accent-ink", neu: "bg-surface-2 text-fg-2",
};
export function FieldBadge({ tone = "neu", children }: { tone?: FieldTone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONE[tone])}>{children}</span>;
}

export function FieldEmpty({ title, icon }: { title: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-fg-2">
      {icon}
      <div className="text-[15px] font-medium">{title}</div>
    </div>
  );
}

const BTN = "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-ctl px-4 text-base font-semibold";
export const FIELD_BTN = { primary: `${BTN} bg-accent text-accent-fg active:brightness-95`, secondary: `${BTN} border border-line-strong bg-surface text-fg active:bg-surface-2`, danger: `${BTN} bg-bad-fill text-[var(--color-on-error)]` };

/** Nút chính 56dp dạng liên kết (Ngoại lệ đã duyệt: nút chính hiện trường 56dp). */
export function FieldLinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return <Link href={href} className={FIELD_BTN[variant]}>{children}</Link>;
}
