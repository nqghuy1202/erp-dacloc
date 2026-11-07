export type Role = "worker" | "farm_lead" | "lab" | "storekeeper" | "director" | "admin";

export interface Actor {
  id: number;
  empCode: string;
  name: string;
  role: Role;
  farmIds: number[]; // rỗng với director/admin = mọi trại
}

export const ALL_FARMS_ROLES: Role[] = ["director", "admin"];
export const seesAllFarms = (a: Actor) => ALL_FARMS_ROLES.includes(a.role);
