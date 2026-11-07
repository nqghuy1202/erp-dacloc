/** Cột thực tế + đường kế hoạch, triệu PL (S1) — SVG thuần, màu từ token */
export function WeeklyChart({ data, label }: { data: { week: string; actual: number; plan: number }[]; label: string }) {
  const W = 640, H = 220, L = 40, B = 28, T = 16;
  const max = Math.max(10, ...data.map((d) => Math.max(d.actual, d.plan) / 1e6)) * 1.15;
  const step = max > 200 ? 100 : max > 80 ? 25 : max > 30 ? 10 : 5;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const bw = (W - L - 8) / data.length;
  const cx = (i: number) => L + i * bw + bw / 2;
  const pts = data.map((d, i) => `${cx(i)},${y(d.plan / 1e6)}`).join(" ");
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} className="min-w-[480px]">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--fg-2))">{v}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const v = d.actual / 1e6;
          return (
            <g key={d.week}>
              <rect x={L + i * bw + bw * 0.2} y={y(v)} width={bw * 0.6} height={Math.max(0, y(0) - y(v))} rx={3}
                fill={d.plan && d.actual < d.plan ? "rgb(var(--accent-soft))" : "rgb(var(--accent))"} />
              <text x={cx(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--fg-2))">{d.week.slice(8, 10)}/{d.week.slice(5, 7)}</text>
            </g>
          );
        })}
        {data.some((d) => d.plan) ? <polyline points={pts} fill="none" stroke="rgb(var(--fg-2))" strokeWidth={2} strokeDasharray="4 4" /> : null}
      </svg>
    </div>
  );
}
