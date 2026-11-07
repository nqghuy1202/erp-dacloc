export type ErrorCode =
  | "unauthenticated" | "forbidden" | "not_found" | "invalid_input"
  | "broodstock_not_ready" | "exceeds_batch_remaining" | "tank_busy" | "tank_not_assigned"
  | "pcr_missing" | "pcr_expired" | "pcr_positive" | "stage_too_early" | "lot_not_rearing"
  | "banned_material" | "insufficient_stock" | "duplicate_code" | "test_already_final"
  | "plan_not_editable" | "request_closed" | "count_not_pending" | "value_out_of_bounds";

const STATUS: Partial<Record<ErrorCode, number>> = { unauthenticated: 401, forbidden: 403, not_found: 404 };

export class AppError extends Error {
  constructor(public code: ErrorCode, message?: string, public detail?: unknown) {
    super(message ?? code);
  }
  get status() { return STATUS[this.code] ?? 400; }
}

export const fail = (code: ErrorCode, message?: string, detail?: unknown): never => {
  throw new AppError(code, message, detail);
};
