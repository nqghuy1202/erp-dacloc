import { cn } from "./cn";

/** Thanh tiến độ có vạch mốc (design-spec §3 Tiến độ) — Astryx ProgressBar chưa có vạch mốc nên giữ bản riêng theo token. */
export function Progress({ value, mark, tone = "acc", height = 10, label }: { value: number; mark?: number; tone?: "acc" | "warn" | "ok"; height?: number; label: string }) {
  const fill = tone === "warn" ? "bg-warn-fill" : tone === "ok" ? "bg-ok-fill" : "bg-accent";
  return (
    <div role="img" aria-label={label} className="relative w-full rounded-full bg-[var(--color-track)]" style={{ height }}>
      <span className={cn("absolute inset-y-0 left-0 rounded-full", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      {mark != null ? <span className="absolute -inset-y-1.5 w-0.5 bg-fg" style={{ left: `${Math.max(0, Math.min(100, mark))}%` }} /> : null}
    </div>
  );
}
