import { db } from "@/lib/db/client";
import { fmtDate } from "@/lib/i18n";
import { getT, requireActor } from "@/lib/session";
import { farmsInScope, usersWithFarms } from "@/server/queries-admin";
import { Badge, Card, CardBody, Empty, PageHeader, Table } from "@/components/ui";
import { ROLE_LABEL } from "@/components/status";
import { ActiveToggle, FarmsSheet, NewUserSheet } from "./forms";
import { createUserAction, setActiveAction, setFarmsAction } from "./actions";

export const metadata = { title: "Người dùng & quyền" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requireActor(["admin"]);
  const { locale } = await getT();
  const [users, farms] = await Promise.all([usersWithFarms(db), farmsInScope(db, actor)]);
  const farmList = farms.map((f) => ({ id: f.id, name: f.name, code: f.code }));
  const farmCode = new Map(farms.map((f) => [f.id, f.code]));
  const roles = Object.entries(ROLE_LABEL) as [string, string][];
  const add = <NewUserSheet action={createUserAction} farms={farmList} roles={roles} />;

  return (
    <>
      <PageHeader title="Người dùng & quyền" crumb="Cài đặt" meta={`${users.length} người · ${users.filter((u) => !u.active).length} đã khoá`} actions={add} />
      <Card>
        <CardBody>
          {users.length > 1 ? (
            <Table head={["Mã NV", "Họ tên", "Vai trò", "Trại", "Tạo ngày", "Trạng thái", ""]}>
              {users.map((u) => {
                const all = u.role === "director" || u.role === "admin";
                return (
                  <tr key={u.id}>
                    <td className="font-medium">{u.empCode}</td>
                    <td className="max-w-48 truncate" title={u.name}>{u.name}</td>
                    <td>{ROLE_LABEL[u.role] ?? u.role}</td>
                    <td className="max-w-56 truncate" title={u.farmIds.map((id) => farmCode.get(id)).join(", ")}>
                      {all ? "Mọi trại" : u.farmIds.length ? u.farmIds.map((id) => farmCode.get(id) ?? id).join(", ") : <span className="text-fg-2">Chưa gán</span>}
                    </td>
                    <td>{fmtDate(locale, u.createdAt)}</td>
                    <td>{u.active ? <Badge tone="ok">Hoạt động</Badge> : <Badge tone="neu">Đã khoá</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {!all ? <FarmsSheet action={setFarmsAction} userId={u.id} name={u.name} farms={farmList} selected={u.farmIds} /> : null}
                        {u.id !== actor.id ? <ActiveToggle action={setActiveAction} userId={u.id} active={u.active} name={u.name} /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
          ) : <Empty title="Mới có bạn" />}
        </CardBody>
      </Card>
    </>
  );
}
