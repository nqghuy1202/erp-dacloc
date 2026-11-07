"use client";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "./cn";

export type ActionState = { ok?: boolean; message?: string; error?: string; at?: number };
type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

export function Submit({ children, variant = "primary", className, disabled }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  const v = variant === "primary" ? "bg-accent text-accent-fg border-accent" : variant === "danger" ? "bg-bad text-white border-bad" : "bg-surface text-fg border-line";
  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending}
      className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-ctl border px-4 font-medium disabled:opacity-60", v, className)}>
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Form gọi server action; hiện lỗi tại chỗ, toast khi thành công (action → expectation) */
export function ActionForm({ action, children, className, onDone, resetOnSuccess = true }: {
  action: Act; children: ReactNode; className?: string; onDone?: (s: ActionState) => void; resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);
  const ref = useRef<HTMLFormElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const seen = useRef<number | undefined>(undefined);
  useEffect(() => {
    // chỉ phản ứng 1 lần mỗi kết quả (at) — tránh toast lặp khi onDone đổi tham chiếu
    if (!state.at || seen.current === state.at) return;
    seen.current = state.at;
    if (state.ok) { toast(state.message ?? "Đã lưu"); if (resetOnSuccess) ref.current?.reset(); done.current?.(state); }
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error ? <p role="alert" className="mt-3 rounded-ctl bg-bad-soft px-3 py-2 text-[13px] font-medium text-bad-ink">{state.error}</p> : null}
    </form>
  );
}

/** Sheet bên phải (desktop) / toàn màn (mobile) bằng <dialog> native */
export function Sheet({ trigger, title, children, variant = "primary", triggerClass }: { trigger: ReactNode; title: string; children: (close: () => void) => ReactNode; variant?: "primary" | "secondary"; triggerClass?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => { ref.current?.close(); setOpen(false); };
  const v = variant === "primary" ? "bg-accent text-accent-fg border-accent" : "bg-surface text-fg border-line";
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); ref.current?.showModal(); }} className={cn("inline-flex min-h-10 items-center gap-2 rounded-ctl border px-4 font-medium", v, triggerClass)}>{trigger}</button>
      <dialog ref={ref} onClose={() => setOpen(false)} className="m-0 ml-auto h-full max-h-none w-full max-w-[520px] bg-surface p-0 text-fg sm:rounded-l-card">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-line px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={close} aria-label="Đóng" className="ml-auto grid h-10 w-10 place-items-center rounded-ctl hover:bg-surface-2"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{open ? children(close) : null}</div>
        </div>
      </dialog>
    </>
  );
}

// ───────── Toast (sonner-like, không phụ thuộc)
type T = { id: number; text: string; tone: "ok" | "bad" };
let push: ((t: T) => void) | null = null;
export function toast(text: string, tone: "ok" | "bad" = "ok") { push?.({ id: Date.now() + Math.random(), text, tone }); }

export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    push = (t) => { setItems((x) => [...x, t]); setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 3500); };
    return () => { push = null; };
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {items.map((i) => (
        <div key={i.id} className="pointer-events-auto flex max-w-md items-center gap-2 rounded-card bg-fg px-4 py-3 text-[14px] text-bg shadow-lg">
          {i.tone === "ok" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}<span>{i.text}</span>
        </div>
      ))}
    </div>
  );
}

export function ThemeToggle({ labels }: { labels: [string, string] }) {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => { setTheme(document.documentElement.dataset.theme ?? null); }, []);
  const set = (t: "light" | "dark") => {
    document.documentElement.dataset.theme = t; setTheme(t);
    try { localStorage.setItem("theme", t); } catch { /* bỏ qua */ }
  };
  return (
    <div className="inline-flex gap-1 rounded-ctl bg-surface-2 p-1 text-[13px]" role="group" aria-label="Giao diện">
      {(["light", "dark"] as const).map((t, i) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => set(t)}
          className={cn("min-h-8 rounded-md px-3 font-medium", theme === t ? "bg-surface text-fg shadow-sm" : "text-fg-2")}>{labels[i]}</button>
      ))}
    </div>
  );
}
