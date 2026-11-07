"use client";
import { RotateCcw } from "lucide-react";

/** Ma trận trạng thái: lỗi tải → Thử lại */
export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface py-12 text-center">
      <div className="text-[15px] font-medium text-fg-2">Không tải được dữ liệu</div>
      <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-ctl border border-line bg-surface px-4 font-medium hover:bg-surface-2">
        <RotateCcw size={16} aria-hidden />Thử lại
      </button>
    </div>
  );
}
