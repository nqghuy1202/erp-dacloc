CREATE TYPE "public"."farm_kind" AS ENUM('broodstock', 'hatchery');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('worker', 'farm_lead', 'lab', 'storekeeper', 'director', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tank_status" AS ENUM('empty', 'rearing', 'cleaning', 'quarantine');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'warn' NOT NULL,
	"farm_id" integer,
	"lot_id" integer,
	"tank_id" integer,
	"title" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"escalated" boolean DEFAULT false NOT NULL,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ack_at" timestamp with time zone,
	"ack_by" integer
);
--> statement-breakpoint
CREATE TABLE "broodstocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"farm_id" integer NOT NULL,
	"tank_id" integer,
	"species_id" integer NOT NULL,
	"source" text NOT NULL,
	"origin" text DEFAULT '' NOT NULL,
	"line" text DEFAULT '' NOT NULL,
	"males" integer NOT NULL,
	"females" integer NOT NULL,
	"quarantine_doc" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'quarantine' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "broodstocks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"kind" "farm_kind" DEFAULT 'hatchery' NOT NULL,
	CONSTRAINT "farms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "finished_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"qr_token" text NOT NULL,
	"source_lot_ids" integer[] NOT NULL,
	"qty" integer NOT NULL,
	"stage_code" text NOT NULL,
	"survival_rate" double precision NOT NULL,
	"harvested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"harvested_by" integer,
	"pcr_test_id" integer,
	CONSTRAINT "finished_lots_code_unique" UNIQUE("code"),
	CONSTRAINT "finished_lots_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"alert_id" integer,
	"cause" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"action" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" integer
);
--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" integer NOT NULL,
	"kind" text DEFAULT 'pcr' NOT NULL,
	"lab" text DEFAULT 'Lab nội bộ' NOT NULL,
	"sampled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"results" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"finalized_at" timestamp with time zone,
	"finalized_by" integer,
	"void_reason" text,
	CONSTRAINT "lab_tests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"tank_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"kind" text NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"suspect_time" boolean DEFAULT false NOT NULL,
	"material_id" integer,
	"qty" double precision,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"task_id" integer
);
--> statement-breakpoint
CREATE TABLE "lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"farm_id" integer NOT NULL,
	"tank_id" integer NOT NULL,
	"species_id" integer NOT NULL,
	"batch_id" integer,
	"parent_lot_ids" integer[] DEFAULT '{}'::int[] NOT NULL,
	"stage_id" integer NOT NULL,
	"stage_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stocked_qty" integer NOT NULL,
	"estimated_qty" integer NOT NULL,
	"expected_harvest_at" date,
	"status" text DEFAULT 'rearing' NOT NULL,
	"cost_total" double precision DEFAULT 0 NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "lots_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"group" text DEFAULT 'feed' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"min_stock" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"alert_id" integer,
	"title" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"tank_id" integer NOT NULL,
	"stock_date" date NOT NULL,
	"stock_qty" integer NOT NULL,
	"harvest_date" date NOT NULL,
	"harvest_qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"month" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"return_reason" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"approved_by" integer,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "receipt_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"qty" double precision NOT NULL,
	"unit_cost" double precision NOT NULL,
	"supplier_lot" text DEFAULT '' NOT NULL,
	"expiry" date
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"warehouse_id" integer NOT NULL,
	"supplier" text NOT NULL,
	"doc_no" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'final' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "request_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"qty" double precision NOT NULL,
	"issued" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"farm_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"reject_reason" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "requests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "spawn_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"broodstock_id" integer NOT NULL,
	"spawned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"females_spawned" integer NOT NULL,
	"nauplius" integer NOT NULL,
	"remaining" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"cancel_reason" text,
	CONSTRAINT "spawn_batches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_vi" text NOT NULL,
	"name_en" text NOT NULL,
	"standard_survival" double precision DEFAULT 0.6 NOT NULL,
	"harvest_min_stage_seq" integer DEFAULT 1 NOT NULL,
	"pcr_valid_days" integer DEFAULT 3 NOT NULL,
	"required_diseases" text[] DEFAULT '{}'::text[] NOT NULL,
	CONSTRAINT "species_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer NOT NULL,
	"seq" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"days" integer DEFAULT 1 NOT NULL,
	"feed_times" text[] DEFAULT '{}'::text[] NOT NULL,
	"water_times" text[] DEFAULT '{}'::text[] NOT NULL,
	"loss_limit_pct" double precision DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_count_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"count_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"book_qty" double precision NOT NULL,
	"actual_qty" double precision,
	"unit_cost" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"warehouse_id" integer NOT NULL,
	"status" text DEFAULT 'counting' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"note" text,
	CONSTRAINT "stock_counts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stock_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"supplier_lot" text DEFAULT '' NOT NULL,
	"expiry" date,
	"qty_remaining" double precision NOT NULL,
	"unit_cost" double precision DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_tx" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"stock_lot_id" integer,
	"qty" double precision NOT NULL,
	"unit_cost" double precision DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"ref_key" text,
	"lot_id" integer,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tank_workers" (
	"tank_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "tank_workers_tank_id_user_id_pk" PRIMARY KEY("tank_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tanks" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"code" text NOT NULL,
	"volume_m3" double precision DEFAULT 20 NOT NULL,
	"status" "tank_status" DEFAULT 'empty' NOT NULL,
	CONSTRAINT "tanks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer NOT NULL,
	"tank_id" integer NOT NULL,
	"day" date NOT NULL,
	"slot" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"source" text DEFAULT 'auto' NOT NULL,
	"assignee_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"done_at" timestamp with time zone,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "user_farms" (
	"user_id" integer NOT NULL,
	"farm_id" integer NOT NULL,
	CONSTRAINT "user_farms_user_id_farm_id_pk" PRIMARY KEY("user_id","farm_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"emp_code" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_emp_code_unique" UNIQUE("emp_code")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"farm_id" integer,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "water_thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" integer NOT NULL,
	"param" text NOT NULL,
	"min" double precision NOT NULL,
	"max" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ack_by_users_id_fk" FOREIGN KEY ("ack_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broodstocks" ADD CONSTRAINT "broodstocks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broodstocks" ADD CONSTRAINT "broodstocks_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broodstocks" ADD CONSTRAINT "broodstocks_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_lots" ADD CONSTRAINT "finished_lots_harvested_by_users_id_fk" FOREIGN KEY ("harvested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finished_lots" ADD CONSTRAINT "finished_lots_pcr_test_id_lab_tests_id_fk" FOREIGN KEY ("pcr_test_id") REFERENCES "public"."lab_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_batch_id_spawn_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."spawn_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lots" ADD CONSTRAINT "lots_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_lines" ADD CONSTRAINT "plan_lines_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_lines" ADD CONSTRAINT "plan_lines_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_lines" ADD CONSTRAINT "receipt_lines_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_lines" ADD CONSTRAINT "request_lines_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_lines" ADD CONSTRAINT "request_lines_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spawn_batches" ADD CONSTRAINT "spawn_batches_broodstock_id_broodstocks_id_fk" FOREIGN KEY ("broodstock_id") REFERENCES "public"."broodstocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_count_id_stock_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."stock_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_count_lines" ADD CONSTRAINT "stock_count_lines_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_counts" ADD CONSTRAINT "stock_counts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tx" ADD CONSTRAINT "stock_tx_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tx" ADD CONSTRAINT "stock_tx_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tx" ADD CONSTRAINT "stock_tx_stock_lot_id_stock_lots_id_fk" FOREIGN KEY ("stock_lot_id") REFERENCES "public"."stock_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tx" ADD CONSTRAINT "stock_tx_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_tx" ADD CONSTRAINT "stock_tx_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tank_workers" ADD CONSTRAINT "tank_workers_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tank_workers" ADD CONSTRAINT "tank_workers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tank_id_tanks_id_fk" FOREIGN KEY ("tank_id") REFERENCES "public"."tanks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_farms" ADD CONSTRAINT "user_farms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_farms" ADD CONSTRAINT "user_farms_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_thresholds" ADD CONSTRAINT "water_thresholds_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_dedupe" ON "alerts" USING btree ("dedupe_key") WHERE status <> 'closed';--> statement-breakpoint
CREATE INDEX "lab_subject_idx" ON "lab_tests" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "logs_lot_idx" ON "logs" USING btree ("lot_id","recorded_at");--> statement-breakpoint
CREATE INDEX "lots_farm_idx" ON "lots" USING btree ("farm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lots_one_rearing_per_tank" ON "lots" USING btree ("tank_id") WHERE status = 'rearing';--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_farm_month_version" ON "plans" USING btree ("farm_id","month","version");--> statement-breakpoint
CREATE UNIQUE INDEX "stages_species_seq" ON "stages" USING btree ("species_id","seq");--> statement-breakpoint
CREATE INDEX "stock_lots_wh_mat" ON "stock_lots" USING btree ("warehouse_id","material_id");--> statement-breakpoint
CREATE INDEX "stock_tx_wh_mat" ON "stock_tx" USING btree ("warehouse_id","material_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_tx_ref" ON "stock_tx" USING btree ("ref_key","material_id");--> statement-breakpoint
CREATE INDEX "tanks_farm_idx" ON "tanks" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "tasks_day_idx" ON "tasks" USING btree ("day");--> statement-breakpoint
CREATE UNIQUE INDEX "tasks_auto_unique" ON "tasks" USING btree ("lot_id","kind","day","slot") WHERE source = 'auto';--> statement-breakpoint
CREATE UNIQUE INDEX "thr_stage_param" ON "water_thresholds" USING btree ("stage_id","param");