"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/components/ui/cn";
import { FIELD_BTN } from "./ui";

// Điều khiển nhẹ cho PWA hiện trường (không import component Astryx — xem field/ui.tsx).

export function FieldSubmit({ children, variant = "primary", className }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={cn(FIELD_BTN[variant], "disabled:opacity-60", className)}>
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Sự kiện đổi sáng/tối — Providers lắng nghe (src/components/providers.tsx). Không import ngữ cảnh để màn hiện trường
 *  không kéo theo chunk Theme/i18n của Astryx (đo: /hien-truong/toi +64% khi import). */
export const THEME_EVENT = "dacloc:theme";

/** Nhóm chọn sáng/tối ở màn Tôi. */
export function FieldThemeToggle({ labels }: { labels: [string, string] }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const set = document.documentElement.dataset.theme;
    setDark(set ? set === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);
  const pick = (t: "light" | "dark") => { setDark(t === "dark"); window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: t })); };
  return (
    <div className="inline-flex gap-1 rounded-ctl bg-surface-2 p-1 text-[13px]" role="group" aria-label="Giao diện">
      {(["light", "dark"] as const).map((t, i) => {
        const on = (t === "dark") === dark;
        return (
          <button key={t} type="button" aria-pressed={on} onClick={() => pick(t)}
            className={cn("min-h-11 rounded-ctl px-4 font-medium", on ? "bg-surface text-fg shadow-sm" : "text-fg-2")}>{labels[i]}</button>
        );
      })}
    </div>
  );
}
