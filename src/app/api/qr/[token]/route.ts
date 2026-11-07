import { NextResponse } from "next/server";
import { getActor } from "@/lib/session";
import { qrSvg, traceUrl } from "@/server/queries-lab";

export const dynamic = "force-dynamic";

/** Ảnh QR (SVG) trỏ về trang truy xuất nội bộ; cần đăng nhập (QR công khai: phase 2) */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { token } = await params;
  if (!token || token.length > 200 || !/^[A-Za-z0-9_-]+$/.test(token)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  try {
    const svg = await qrSvg(traceUrl(req.headers, token));
    return new NextResponse(svg, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "private, max-age=3600" } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "qr_failed" }, { status: 500 });
  }
}
