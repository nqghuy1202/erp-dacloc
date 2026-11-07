import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-lg font-semibold">Không tìm thấy trang</div>
        <Link href="/" className="min-h-10 rounded-ctl border border-line px-4 py-2 font-medium">Về trang chính</Link>
      </div>
    </main>
  );
}
