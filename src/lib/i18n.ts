/** Từ điển song ngữ (ADR 0001). Khoá thiếu ở `en` rơi về `vi`. */
export type Locale = "vi" | "en";
export const LOCALES: Locale[] = ["vi", "en"];

const vi = {
  appName: "Đắc Lộc ERP",
  "nav.overview": "Tổng quan", "nav.production": "Sản xuất", "nav.plan": "Kế hoạch", "nav.farms": "Trại & bể",
  "nav.broodstock": "Đàn bố mẹ", "nav.spawn": "Mẻ đẻ", "nav.lots": "Lô ương", "nav.incidents": "Sự cố",
  "nav.lab": "Xét nghiệm", "nav.samples": "Hàng đợi mẫu", "nav.inventory": "Kho", "nav.stock": "Tồn kho",
  "nav.receipts": "Phiếu nhập", "nav.requests": "Yêu cầu cấp", "nav.counts": "Kiểm kê", "nav.settings": "Cài đặt",
  "nav.catalog": "Danh mục", "nav.users": "Người dùng", "nav.trace": "Tra mã lô / QR", "nav.field": "Hiện trường",
  "field.today": "Hôm nay", "field.tanks": "Bể", "field.scan": "Quét", "field.alerts": "Cảnh báo", "field.me": "Tôi",
  "common.save": "Lưu", "common.cancel": "Huỷ", "common.retry": "Thử lại", "common.all": "Tất cả", "common.search": "Tìm",
  "common.logout": "Đăng xuất", "common.loading": "Đang tải", "common.sampleData": "Số liệu mẫu", "common.close": "Đóng",
  "common.light": "Sáng", "common.dark": "Tối", "common.language": "Ngôn ngữ", "common.noData": "Chưa có dữ liệu",
  "login.title": "Đăng nhập", "login.empCode": "Mã nhân viên", "login.password": "Mật khẩu", "login.submit": "Đăng nhập",
  "login.error": "Mã nhân viên hoặc mật khẩu không đúng",
  "ov.title": "Tổng quan khu sản xuất", "ov.harvestVsPlan": "Sản lượng PL thu hoạch · thực / kế hoạch tháng",
  "ov.planToDate": "Kế hoạch tới hôm nay", "ov.pctToDate": "Đạt so với mốc", "ov.behind": "Chậm", "ov.ahead": "Vượt",
  "ov.noPlan": "Chưa có kế hoạch tháng", "ov.activeLots": "Lô đang ương", "ov.estimated": "PL ước lượng trong bể",
  "ov.survival": "Tỷ lệ sống TB 30 ngày", "ov.byFarm": "Tiến độ theo trại", "ov.openAlerts": "Cảnh báo mở",
  "ov.weekly": "Sản lượng theo tuần", "ov.lowStock": "Vật tư dưới mức tối thiểu", "ov.actual": "Thực tế", "ov.plan": "Kế hoạch",
  "ov.million": "triệu", "ov.markLegend": "Vạch đen: mốc kế hoạch hôm nay", "ov.daysLeft": "Còn {n} ngày",
} as const;

const en: Partial<Record<keyof typeof vi, string>> = {
  appName: "Dac Loc ERP",
  "nav.overview": "Overview", "nav.production": "Production", "nav.plan": "Plan", "nav.farms": "Farms & tanks",
  "nav.broodstock": "Broodstock", "nav.spawn": "Spawning", "nav.lots": "Rearing lots", "nav.incidents": "Incidents",
  "nav.lab": "Lab", "nav.samples": "Sample queue", "nav.inventory": "Inventory", "nav.stock": "Stock",
  "nav.receipts": "Receipts", "nav.requests": "Requests", "nav.counts": "Stock counts", "nav.settings": "Settings",
  "nav.catalog": "Catalog", "nav.users": "Users", "nav.trace": "Find lot / QR", "nav.field": "Field",
  "field.today": "Today", "field.tanks": "Tanks", "field.scan": "Scan", "field.alerts": "Alerts", "field.me": "Me",
  "common.save": "Save", "common.cancel": "Cancel", "common.retry": "Retry", "common.all": "All", "common.search": "Search",
  "common.logout": "Sign out", "common.loading": "Loading", "common.sampleData": "Sample data", "common.close": "Close",
  "common.light": "Light", "common.dark": "Dark", "common.language": "Language", "common.noData": "No data yet",
  "login.title": "Sign in", "login.empCode": "Employee ID", "login.password": "Password", "login.submit": "Sign in",
  "login.error": "Wrong employee ID or password",
  "ov.title": "Hatchery overview", "ov.harvestVsPlan": "PL harvested · actual / monthly plan",
  "ov.planToDate": "Plan to date", "ov.pctToDate": "Vs. plan to date", "ov.behind": "Behind", "ov.ahead": "Ahead",
  "ov.noPlan": "No plan for this month", "ov.activeLots": "Active lots", "ov.estimated": "Estimated PL in tanks",
  "ov.survival": "Avg survival 30 days", "ov.byFarm": "Progress by farm", "ov.openAlerts": "Open alerts",
  "ov.weekly": "Weekly harvest", "ov.lowStock": "Below minimum stock", "ov.actual": "Actual", "ov.plan": "Plan",
  "ov.million": "million", "ov.markLegend": "Black mark: plan to date", "ov.daysLeft": "{n} days left",
};

export type MsgKey = keyof typeof vi;
const dict: Record<Locale, Partial<Record<MsgKey, string>>> = { vi, en };

export function translator(locale: Locale) {
  return (key: MsgKey, vars?: Record<string, string | number>) => {
    let s = dict[locale][key] ?? vi[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

const NF: Record<Locale, string> = { vi: "vi-VN", en: "en-US" };
export const fmtNum = (locale: Locale, n: number, digits = 0) =>
  new Intl.NumberFormat(NF[locale], { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
export const fmtMillion = (locale: Locale, n: number, digits = 1) => fmtNum(locale, n / 1e6, digits);
export const fmtCompact = (locale: Locale, n: number) => {
  if (Math.abs(n) >= 1e9) return `${fmtNum(locale, n / 1e9, 1)} ${locale === "vi" ? "tỷ" : "B"}`;
  if (Math.abs(n) >= 1e6) return `${fmtNum(locale, n / 1e6, 1)} ${locale === "vi" ? "tr" : "M"}`;
  return fmtNum(locale, n);
};
export const fmtDate = (locale: Locale, d: Date | string | null | undefined) => {
  if (!d) return "—";
  const x = typeof d === "string" ? new Date(d.length === 10 ? `${d}T00:00:00+07:00` : d) : d;
  return new Intl.DateTimeFormat(NF[locale], { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(x);
};
export const fmtTime = (locale: Locale, d: Date) =>
  new Intl.DateTimeFormat(NF[locale], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh", hour12: false }).format(d);
export const fmtAgo = (locale: Locale, d: Date, now = new Date()) => {
  const m = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000));
  if (m < 60) return locale === "vi" ? `${m} phút` : `${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return locale === "vi" ? `${h} giờ` : `${h} h`;
  return locale === "vi" ? `${Math.round(h / 24)} ngày` : `${Math.round(h / 24)} d`;
};
