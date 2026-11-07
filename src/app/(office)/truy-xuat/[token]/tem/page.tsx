import Link from "next/link";
import { headers } from "next/headers";
import { db } from "@/lib/db/client";
import { fmtDate, fmtNum } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { traceFinishedLot } from "@/server/production";
import { qrSvg, traceUrl } from "@/server/queries-lab";
import { Card, Empty, LinkButton, PageHeader } from "@/components/ui";
import { PrintButton } from "./print-button";

export const metadata = { title: "Tem QR" };
export const dynamic = "force-dynamic";

// Khi in: ẩn toàn bộ khung app, chỉ còn tem (layout chung không thuộc phạm vi màn này)
const PRINT_CSS = "@media print{body *{visibility:hidden}#tem-qr,#tem-qr *{visibility:visible}#tem-qr{position:absolute;left:0;top:0;border:0}}";

export default async function LabelPage({ params }: { params: Promise<{ token: string }> }) {
  await requireActor();
  const { locale } = await getT();
  let key = (await params).token;
  try { key = decodeURIComponent(key); } catch { /* giữ nguyên */ }
  const trace = key.length <= 200 ? await traceFinishedLot(db, key) : null;

  if (!trace) {
    return (
      <>
        <PageHeader title="Tem QR" crumb={<Link href="/truy-xuat" className="hover:underline">Truy xuất</Link>} />
        <Card><Empty title="Không tìm thấy lô" action={<LinkButton href="/truy-xuat">Nhập lại mã</LinkButton>} /></Card>
      </>
    );
  }

  const fl = trace.finished;
  const svg = await qrSvg(traceUrl(await headers(), fl.qrToken));
  return (
    <>
      <style>{PRINT_CSS}</style>
      <PageHeader title="Tem QR" crumb={<Link href={`/truy-xuat/${encodeURIComponent(fl.qrToken)}`} className="hover:underline">{fl.code}</Link>} actions={<PrintButton />} />
      {/* Tem luôn nền trắng chữ đen (giấy in), không theo theme tối */}
      <div id="tem-qr" className="num mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-card border border-line bg-white p-6 text-center text-black">
        <div role="img" aria-label={`Mã QR lô ${fl.code}`} className="aspect-square w-full max-w-[280px] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="text-[22px] font-semibold">{fl.code}</div>
        <div className="text-[15px]">{fmtNum(locale, fl.qty)} PL · {fl.stageCode}</div>
        <div className="text-[13px]">Thu hoạch {fmtDate(locale, fl.harvestedAt)}</div>
      </div>
    </>
  );
}
