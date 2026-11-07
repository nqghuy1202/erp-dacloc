export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="flex flex-col gap-3 p-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-[72px] animate-pulse rounded-[14px] bg-surface-2" />)}
    </div>
  );
}
