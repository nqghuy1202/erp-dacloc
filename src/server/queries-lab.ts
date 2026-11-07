import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { DB } from "@/lib/db/types";
import { alerts, broodstocks, farms, labTests, lots, notifications, users } from "@/lib/db/schema";
import { toString as qrToString } from "qrcode";
import type { Actor } from "./types";
import { seesAllFarms } from "./types";

const subjectFarm = sql<number | null>`coalesce(${lots.farmId}, ${broodstocks.farmId})`;

/** R1: director/admin thấy mọi trại; vai trò khác chỉ trại được phân */
function farmScope(actor: Actor) {
  if (seesAllFarms(actor)) return sql`true`;
  if (!actor.farmIds.length) return sql`false`;
  return sql`${subjectFarm} in (${sql.join(actor.farmIds.map((id) => sql`${id}`), sql`, `)})`;
}

function baseTestQuery(db: DB) {
  return db.select({
    t: labTests, lotId: lots.id, lotCode: lots.code, broodId: broodstocks.id, broodCode: broodstocks.code,
    farmId: subjectFarm, farmName: farms.name,
  }).from(labTests)
    .leftJoin(lots, and(eq(labTests.subjectType, "lot"), eq(lots.id, labTests.subjectId)))
    .leftJoin(broodstocks, and(eq(labTests.subjectType, "broodstock"), eq(broodstocks.id, labTests.subjectId)))
    .leftJoin(farms, eq(farms.id, subjectFarm));
}

/** S8: "pending" sắp theo hạn (quá hạn đứng đầu); "done" = phiếu đã chốt/huỷ gần nhất */
export async function labQueue(db: DB, actor: Actor, tab: "pending" | "done", page = 1, size = 50) {
  const q = baseTestQuery(db);
  const offset = (Math.max(1, page) - 1) * size;
  if (tab === "pending") {
    return q.where(and(eq(labTests.status, "pending"), farmScope(actor))).orderBy(labTests.dueAt).limit(size + 1).offset(offset);
  }
  return q.where(and(inArray(labTests.status, ["final", "void"]), farmScope(actor)))
    .orderBy(desc(sql`coalesce(${labTests.finalizedAt}, ${labTests.sampledAt})`)).limit(size + 1).offset(offset);
}

/** S9: một phiếu trong phạm vi trại của actor, null nếu không có / ngoài quyền */
export async function labDetail(db: DB, actor: Actor, id: number) {
  const [row] = await baseTestQuery(db).where(and(eq(labTests.id, id), farmScope(actor)));
  if (!row) return null;
  const [by] = row.t.finalizedBy ? await db.select({ name: users.name }).from(users).where(eq(users.id, row.t.finalizedBy)) : [];
  return { ...row, finalizedByName: by?.name ?? null };
}

/** S14: tên người thu + mã bể cho chuỗi truy xuất */
export async function userName(db: DB, id: number | null) {
  if (!id) return null;
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, id));
  return u?.name ?? null;
}

/** Thông báo của actor, mới nhất trước */
export async function myNotifications(db: DB, actor: Actor, limit = 100) {
  return db.select({ n: notifications, lotId: alerts.lotId, severity: alerts.severity }).from(notifications)
    .leftJoin(alerts, eq(alerts.id, notifications.alertId))
    .where(eq(notifications.userId, actor.id)).orderBy(desc(notifications.createdAt)).limit(limit);
}

export async function markNotificationsRead(db: DB, actor: Actor) {
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, actor.id), isNull(notifications.readAt)));
}

/** URL tem QR (S14): origin lấy từ header proxy; host lạ → bỏ, tránh nhúng chuỗi tuỳ ý vào QR */
export function traceUrl(h: Headers, qrToken: string) {
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  const protoRaw = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const safeHost = /^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) ? host : "localhost:3000";
  const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : safeHost.startsWith("localhost") ? "http" : "https";
  return `${proto}://${safeHost}/truy-xuat/${encodeURIComponent(qrToken)}`;
}

export async function qrSvg(url: string) {
  return qrToString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}
