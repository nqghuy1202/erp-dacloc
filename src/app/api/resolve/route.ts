import { NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { finishedLots, tanks } from "@/lib/db/schema";
import { getActor } from "@/lib/session";

/** Mã quét → đường dẫn: mã bể → ghi nhật ký; mã lô thành phẩm/QR → truy xuất */
export async function GET(req: Request) {
  if (!(await getActor())) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!code) return NextResponse.json({});
  const [t] = await db.select({ id: tanks.id }).from(tanks).where(eq(tanks.code, code));
  if (t) return NextResponse.json({ href: `/hien-truong/be/${t.id}` });
  const raw = new URL(req.url).searchParams.get("code")!.trim();
  const [f] = await db.select({ token: finishedLots.qrToken }).from(finishedLots).where(or(eq(finishedLots.code, code), eq(finishedLots.qrToken, raw)));
  if (f) return NextResponse.json({ href: `/truy-xuat/${f.token}` });
  return NextResponse.json({});
}
