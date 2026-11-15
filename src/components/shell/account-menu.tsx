"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { initials } from "./initials";

type Props = {
  name: string; roleLabel: string; empCode: string; locale: "vi" | "en";
  labels: { account: string; language: string; logout: string };
  setLocale: (f: FormData) => Promise<void>;
  logout: () => Promise<void>;
};

/** Nút tài khoản + popover: tên, vai trò, ngôn ngữ, đăng xuất. Đóng bằng Esc / bấm ngoài / rời focus. */
export function AccountMenu({ name, roleLabel, empCode, locale, labels, setLocale, logout }: Props) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div ref={wrap} className="relative" onBlur={(e) => { if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}>
      <button ref={btn} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId} aria-label={labels.account} title={labels.account}
        className="flex h-11 items-center gap-2 rounded-ctl px-1.5 hover:bg-surface-2">
        <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-accent-fg">{initials(name)}</span>
        <span className="hidden min-w-0 max-w-[160px] text-left leading-tight md:block">
          <span className="block truncate text-[13px] font-medium">{name}</span>
          <span className="block truncate text-xs text-fg-2">{roleLabel}</span>
        </span>
        <ChevronDown size={16} aria-hidden className={cn("hidden text-fg-2 md:block", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={panelId} className="absolute right-0 top-full z-40 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-card border border-line bg-surface p-2 shadow-lg">
          <div className="px-3 py-2">
            <div className="break-words font-semibold">{name}</div>
            <div className="text-[13px] text-fg-2">{roleLabel} · {empCode}</div>
          </div>
          <div className="border-t border-line px-3 py-2">
            <div className="mb-2 text-xs font-semibold text-fg-2">{labels.language}</div>
            <form action={setLocale} className="grid grid-cols-2 gap-2">
              {(["vi", "en"] as const).map((l) => (
                <button key={l} name="locale" value={l} aria-pressed={locale === l}
                  className={cn("min-h-11 rounded-ctl border font-semibold uppercase", locale === l ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-fg hover:bg-surface-2")}>{l}</button>
              ))}
            </form>
          </div>
          <form action={logout} className="border-t border-line pt-2">
            <button className="flex min-h-11 w-full items-center gap-2 rounded-ctl px-3 font-medium hover:bg-surface-2"><LogOut size={16} aria-hidden />{labels.logout}</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
