"use client";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// Phần form/toast KHÔNG phụ thuộc Astryx — dùng chung văn phòng + PWA hiện trường (giữ bundle hiện trường nhẹ, design-spec 12 §Platform).

export type ActionState = { ok?: boolean; message?: string; error?: string; at?: number };
type Act = (prev: ActionState, f: FormData) => Promise<ActionState>;

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

