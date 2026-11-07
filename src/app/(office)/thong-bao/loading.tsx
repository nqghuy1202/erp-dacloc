/** Skeleton (ma trận trạng thái: đang tải) */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-4">
      <div className="h-8 w-48 animate-pulse rounded-ctl bg-surface-2" />
      <div className="h-10 w-64 animate-pulse rounded-ctl bg-surface-2" />
      <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-ctl bg-surface-2" />)}
      </div>
    </div>
  );
}
