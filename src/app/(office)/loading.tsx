export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-4">
      <div className="h-8 w-64 animate-pulse rounded-ctl bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-card bg-surface-2" />)}</div>
      <div className="h-72 animate-pulse rounded-card bg-surface-2" />
    </div>
  );
}
