import type { MsgKey } from "@/lib/i18n";
import type { Role } from "@/server/types";

export type NavItem = { href: string; key: MsgKey; roles?: Role[]; children?: NavItem[]; icon: "home" | "fish" | "flask" | "box" | "cog" | "phone" };

const PROD: Role[] = ["farm_lead", "director", "lab"];
export const NAV: NavItem[] = [
  { href: "/", key: "nav.overview", icon: "home", roles: ["director", "farm_lead"] },
  { href: "/san-xuat/trai", key: "nav.production", icon: "fish", roles: PROD, children: [
    { href: "/san-xuat/ke-hoach", key: "nav.plan", icon: "fish", roles: ["farm_lead", "director"] },
    { href: "/san-xuat/trai", key: "nav.farms", icon: "fish", roles: PROD },
    { href: "/san-xuat/bo-me", key: "nav.broodstock", icon: "fish", roles: PROD },
    { href: "/san-xuat/me-de", key: "nav.spawn", icon: "fish", roles: ["farm_lead", "director"] },
    { href: "/san-xuat/lo", key: "nav.lots", icon: "fish", roles: PROD },
    { href: "/san-xuat/su-co", key: "nav.incidents", icon: "fish", roles: ["farm_lead", "director"] },
  ] },
  { href: "/xet-nghiem", key: "nav.lab", icon: "flask", roles: ["lab", "farm_lead", "director"] },
  { href: "/kho", key: "nav.inventory", icon: "box", roles: ["storekeeper", "farm_lead", "director"], children: [
    { href: "/kho", key: "nav.stock", icon: "box", roles: ["storekeeper", "farm_lead", "director"] },
    { href: "/kho/nhap", key: "nav.receipts", icon: "box", roles: ["storekeeper", "director"] },
    { href: "/kho/yeu-cau", key: "nav.requests", icon: "box", roles: ["storekeeper", "farm_lead", "director"] },
    { href: "/kho/kiem-ke", key: "nav.counts", icon: "box", roles: ["storekeeper", "farm_lead", "director"] },
  ] },
  { href: "/cai-dat/danh-muc", key: "nav.settings", icon: "cog", roles: ["admin"], children: [
    { href: "/cai-dat/danh-muc", key: "nav.catalog", icon: "cog", roles: ["admin"] },
    { href: "/cai-dat/nguoi-dung", key: "nav.users", icon: "cog", roles: ["admin"] },
  ] },
  { href: "/hien-truong", key: "nav.field", icon: "phone", roles: ["farm_lead", "worker"] },
];

export const allowed = (item: NavItem, role: Role) => role === "admin" || !item.roles || item.roles.includes(role);
