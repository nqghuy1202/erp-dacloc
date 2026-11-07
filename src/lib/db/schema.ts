import { sql } from "drizzle-orm";
import {
  boolean, date, doublePrecision, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial,
  text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const created = () => ts("created_at").notNull().defaultNow();

export const roleEnum = pgEnum("role", ["worker", "farm_lead", "lab", "storekeeper", "director", "admin"]);
export const farmKindEnum = pgEnum("farm_kind", ["broodstock", "hatchery"]);
export const tankStatusEnum = pgEnum("tank_status", ["empty", "rearing", "cleaning", "quarantine"]);

// ───────── Danh mục (NV0)
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  kind: farmKindEnum("kind").notNull().default("hatchery"),
});

export const tanks = pgTable("tanks", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  code: text("code").notNull().unique(),
  volumeM3: doublePrecision("volume_m3").notNull().default(20),
  status: tankStatusEnum("status").notNull().default("empty"),
}, (t) => [index("tanks_farm_idx").on(t.farmId)]);

export const species = pgTable("species", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameVi: text("name_vi").notNull(),
  nameEn: text("name_en").notNull(),
  standardSurvival: doublePrecision("standard_survival").notNull().default(0.6),
  harvestMinStageSeq: integer("harvest_min_stage_seq").notNull().default(1),
  pcrValidDays: integer("pcr_valid_days").notNull().default(3),
  requiredDiseases: text("required_diseases").array().notNull().default(sql`'{}'::text[]`),
});

/** Chuỗi giai đoạn theo loài; feedTimes/waterTimes = lịch mẫu "HH:MM" cho NV15 */
export const stages = pgTable("stages", {
  id: serial("id").primaryKey(),
  speciesId: integer("species_id").notNull().references(() => species.id),
  seq: integer("seq").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  days: integer("days").notNull().default(1),
  feedTimes: text("feed_times").array().notNull().default(sql`'{}'::text[]`),
  waterTimes: text("water_times").array().notNull().default(sql`'{}'::text[]`),
  lossLimitPct: doublePrecision("loss_limit_pct").notNull().default(10),
}, (t) => [uniqueIndex("stages_species_seq").on(t.speciesId, t.seq)]);

export const waterThresholds = pgTable("water_thresholds", {
  id: serial("id").primaryKey(),
  stageId: integer("stage_id").notNull().references(() => stages.id),
  param: text("param").notNull(), // ph | temp | salinity | do
  min: doublePrecision("min").notNull(),
  max: doublePrecision("max").notNull(),
}, (t) => [uniqueIndex("thr_stage_param").on(t.stageId, t.param)]);

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  group: text("group").notNull().default("feed"), // feed | chemical | drug | probiotic | other
  banned: boolean("banned").notNull().default(false),
  minStock: doublePrecision("min_stock").notNull().default(0),
});

export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  farmId: integer("farm_id").references(() => farms.id), // null = kho tổng
});

// ───────── Người dùng & quyền (R1)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  empCode: text("emp_code").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: created(),
});

export const userFarms = pgTable("user_farms", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  farmId: integer("farm_id").notNull().references(() => farms.id),
}, (t) => [primaryKey({ columns: [t.userId, t.farmId] })]);

export const tankWorkers = pgTable("tank_workers", {
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.tankId, t.userId] })]);

// ───────── Sản xuất
export const broodstocks = pgTable("broodstocks", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  tankId: integer("tank_id").references(() => tanks.id),
  speciesId: integer("species_id").notNull().references(() => species.id),
  source: text("source").notNull(),
  origin: text("origin").notNull().default(""),
  line: text("line").notNull().default(""),
  males: integer("males").notNull(),
  females: integer("females").notNull(),
  quarantineDoc: text("quarantine_doc").notNull().default(""),
  status: text("status").notNull().default("quarantine"), // quarantine | ready | culled
  receivedAt: ts("received_at").notNull().defaultNow(),
});

export const spawnBatches = pgTable("spawn_batches", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  broodstockId: integer("broodstock_id").notNull().references(() => broodstocks.id),
  spawnedAt: ts("spawned_at").notNull().defaultNow(),
  femalesSpawned: integer("females_spawned").notNull(),
  nauplius: integer("nauplius").notNull(),
  remaining: integer("remaining").notNull(),
  status: text("status").notNull().default("open"), // open | used | cancelled
  cancelReason: text("cancel_reason"),
});

export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  speciesId: integer("species_id").notNull().references(() => species.id),
  batchId: integer("batch_id").references(() => spawnBatches.id),
  parentLotIds: integer("parent_lot_ids").array().notNull().default(sql`'{}'::int[]`),
  stageId: integer("stage_id").notNull().references(() => stages.id),
  stageStartedAt: ts("stage_started_at").notNull().defaultNow(),
  stockedAt: ts("stocked_at").notNull().defaultNow(),
  stockedQty: integer("stocked_qty").notNull(),
  estimatedQty: integer("estimated_qty").notNull(),
  expectedHarvestAt: date("expected_harvest_at", { mode: "string" }),
  status: text("status").notNull().default("rearing"), // rearing | harvested | cancelled
  costTotal: doublePrecision("cost_total").notNull().default(0),
  closedAt: ts("closed_at"),
}, (t) => [
  index("lots_farm_idx").on(t.farmId),
  // R4: tối đa 1 lô đang ương mỗi bể
  uniqueIndex("lots_one_rearing_per_tank").on(t.tankId).where(sql`status = 'rearing'`),
]);

/** Nhật ký bể (NV4). id do máy khách sinh → đồng bộ idempotent (R8) */
export const logs = pgTable("logs", {
  id: uuid("id").primaryKey(),
  lotId: integer("lot_id").notNull().references(() => lots.id),
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(), // feed | water | loss | stage | note
  recordedAt: ts("recorded_at").notNull(),
  syncedAt: ts("synced_at").notNull().defaultNow(),
  suspectTime: boolean("suspect_time").notNull().default(false),
  materialId: integer("material_id").references(() => materials.id),
  qty: doublePrecision("qty"),
  data: jsonb("data").$type<Record<string, number | string | null>>().notNull().default({}),
  taskId: integer("task_id"),
}, (t) => [index("logs_lot_idx").on(t.lotId, t.recordedAt)]);

export const labTests = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  subjectType: text("subject_type").notNull(), // lot | broodstock
  subjectId: integer("subject_id").notNull(),
  kind: text("kind").notNull().default("pcr"), // pcr | micro | quality
  lab: text("lab").notNull().default("Lab nội bộ"),
  sampledAt: ts("sampled_at").notNull().defaultNow(),
  dueAt: ts("due_at").notNull(),
  status: text("status").notNull().default("pending"), // pending | final | void
  results: jsonb("results").$type<{ indicator: string; positive: boolean }[]>().notNull().default([]),
  finalizedAt: ts("finalized_at"),
  finalizedBy: integer("finalized_by").references(() => users.id),
  voidReason: text("void_reason"),
}, (t) => [index("lab_subject_idx").on(t.subjectType, t.subjectId)]);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // water_out_of_range | test_positive | pcr_positive | loss_high | negative_stock | sample_overdue | request_overdue | plan_pending | count_pending
  severity: text("severity").notNull().default("warn"), // warn | bad
  farmId: integer("farm_id").references(() => farms.id),
  lotId: integer("lot_id").references(() => lots.id),
  tankId: integer("tank_id").references(() => tanks.id),
  title: text("title").notNull(),
  detail: text("detail").notNull().default(""),
  status: text("status").notNull().default("open"), // open | ack | closed
  escalated: boolean("escalated").notNull().default(false),
  dedupeKey: text("dedupe_key"),
  createdAt: created(),
  ackAt: ts("ack_at"),
  ackBy: integer("ack_by").references(() => users.id),
}, (t) => [uniqueIndex("alerts_dedupe").on(t.dedupeKey).where(sql`status <> 'closed'`)]);

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  alertId: integer("alert_id").references(() => alerts.id),
  title: text("title").notNull(),
  readAt: ts("read_at"),
  createdAt: created(),
}, (t) => [index("notif_user_idx").on(t.userId)]);

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull().references(() => lots.id),
  alertId: integer("alert_id").references(() => alerts.id),
  cause: text("cause").notNull(), // water | pcr_positive | loss
  status: text("status").notNull().default("open"), // open | resolved
  action: text("action"), // monitor | treat | cull
  note: text("note"),
  createdAt: created(),
  resolvedAt: ts("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
});

export const finishedLots = pgTable("finished_lots", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  qrToken: text("qr_token").notNull().unique(),
  sourceLotIds: integer("source_lot_ids").array().notNull(),
  qty: integer("qty").notNull(),
  stageCode: text("stage_code").notNull(),
  survivalRate: doublePrecision("survival_rate").notNull(),
  harvestedAt: ts("harvested_at").notNull().defaultNow(),
  harvestedBy: integer("harvested_by").references(() => users.id),
  pcrTestId: integer("pcr_test_id").references(() => labTests.id),
});

// ───────── Kho
export const stockLots = pgTable("stock_lots", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  supplierLot: text("supplier_lot").notNull().default(""),
  expiry: date("expiry", { mode: "string" }),
  qtyRemaining: doublePrecision("qty_remaining").notNull(),
  unitCost: doublePrecision("unit_cost").notNull().default(0),
}, (t) => [index("stock_lots_wh_mat").on(t.warehouseId, t.materialId)]);

/** Mọi biến động kho (R8). ref_key duy nhất cho tiêu hao theo nhật ký → idempotent */
export const stockTx = pgTable("stock_tx", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  materialId: integer("material_id").notNull().references(() => materials.id),
  stockLotId: integer("stock_lot_id").references(() => stockLots.id),
  qty: doublePrecision("qty").notNull(),
  unitCost: doublePrecision("unit_cost").notNull().default(0),
  type: text("type").notNull(), // receipt | issue_out | issue_in | consume | adjust
  refKey: text("ref_key"),
  lotId: integer("lot_id").references(() => lots.id),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: created(),
}, (t) => [
  index("stock_tx_wh_mat").on(t.warehouseId, t.materialId),
  uniqueIndex("stock_tx_ref").on(t.refKey, t.materialId),
]);

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  supplier: text("supplier").notNull(),
  docNo: text("doc_no").notNull().default(""),
  status: text("status").notNull().default("final"), // final | void
  createdBy: integer("created_by").references(() => users.id),
  createdAt: created(),
});

export const receiptLines = pgTable("receipt_lines", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => receipts.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  qty: doublePrecision("qty").notNull(),
  unitCost: doublePrecision("unit_cost").notNull(),
  supplierLot: text("supplier_lot").notNull().default(""),
  expiry: date("expiry", { mode: "string" }),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  status: text("status").notNull().default("pending"), // pending | partial | fulfilled | rejected | cancelled
  note: text("note").notNull().default(""),
  rejectReason: text("reject_reason"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: created(),
  closedAt: ts("closed_at"),
});

export const requestLines = pgTable("request_lines", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  qty: doublePrecision("qty").notNull(),
  issued: doublePrecision("issued").notNull().default(0),
});

export const stockCounts = pgTable("stock_counts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  warehouseId: integer("warehouse_id").notNull().references(() => warehouses.id),
  status: text("status").notNull().default("counting"), // counting | pending_approval | approved
  createdBy: integer("created_by").references(() => users.id),
  createdAt: created(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: ts("approved_at"),
  note: text("note"),
});

export const stockCountLines = pgTable("stock_count_lines", {
  id: serial("id").primaryKey(),
  countId: integer("count_id").notNull().references(() => stockCounts.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materials.id),
  bookQty: doublePrecision("book_qty").notNull(),
  actualQty: doublePrecision("actual_qty"),
  unitCost: doublePrecision("unit_cost").notNull().default(0),
});

// ───────── Kế hoạch & việc (NV14, NV15)
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farms.id),
  month: text("month").notNull(), // YYYY-MM
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"), // draft | pending | approved | returned | superseded
  returnReason: text("return_reason"),
  submittedAt: ts("submitted_at"),
  approvedAt: ts("approved_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
}, (t) => [uniqueIndex("plans_farm_month_version").on(t.farmId, t.month, t.version)]);

export const planLines = pgTable("plan_lines", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  stockDate: date("stock_date", { mode: "string" }).notNull(),
  stockQty: integer("stock_qty").notNull(),
  harvestDate: date("harvest_date", { mode: "string" }).notNull(),
  harvestQty: integer("harvest_qty").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").notNull().references(() => lots.id),
  tankId: integer("tank_id").notNull().references(() => tanks.id),
  day: date("day", { mode: "string" }).notNull(),
  slot: text("slot").notNull(), // HH:MM
  kind: text("kind").notNull(), // feed | water | custom
  title: text("title").notNull(),
  source: text("source").notNull().default("auto"), // auto | manual
  assigneeId: integer("assignee_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending | done | cancelled
  doneAt: ts("done_at"),
  createdBy: integer("created_by").references(() => users.id),
}, (t) => [
  index("tasks_day_idx").on(t.day),
  // R12: việc tự sinh không trùng
  uniqueIndex("tasks_auto_unique").on(t.lotId, t.kind, t.day, t.slot).where(sql`source = 'auto'`),
]);

export const RLS_TABLES = [
  "farms", "tanks", "species", "stages", "water_thresholds", "materials", "warehouses", "users", "user_farms",
  "tank_workers", "broodstocks", "spawn_batches", "lots", "logs", "lab_tests", "alerts", "notifications",
  "incidents", "finished_lots", "stock_lots", "stock_tx", "receipts", "receipt_lines", "requests",
  "request_lines", "stock_counts", "stock_count_lines", "plans", "plan_lines", "tasks",
] as const;
