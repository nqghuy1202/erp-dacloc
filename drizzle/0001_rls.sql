-- Bật RLS, không policy: API anon/authenticated của Supabase không đọc/ghi được (ADR 0001). Server dùng role chủ bảng.
ALTER TABLE "farms" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tanks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "species" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stages" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "water_thresholds" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "warehouses" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_farms" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tank_workers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "broodstocks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "spawn_batches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "lab_tests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "alerts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "incidents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "finished_lots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stock_lots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stock_tx" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "receipts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "receipt_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "requests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "request_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stock_counts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "stock_count_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "plan_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
