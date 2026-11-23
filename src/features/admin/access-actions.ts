import type { MenuProps } from "antd";
import type { ResourceContext } from "@/components/admin/resource-config";

export function accessRowActions(id: string, context: ResourceContext, options: {
  blocked: boolean;
  editDisabled?: boolean;
  assignment?: { label: string; disabled: boolean; permitted: boolean };
}): MenuProps["items"] {
  const { can, trash, confirm } = context;
  const items: NonNullable<MenuProps["items"]> = [{ key: "detail", label: "Xem chi tiết", onClick: () => context.openDetail(id) }];
  if (!trash) {
    if (can("update")) items.push({ key: "edit", label: "Chỉnh sửa", disabled: options.editDisabled, onClick: () => context.openEditor(id) });
    if (options.assignment?.permitted) items.push({ key: "assign", label: options.assignment.label, disabled: options.assignment.disabled, onClick: () => context.openAssignment(id) });
    if (can("delete")) items.push({ key: "delete", label: "Chuyển vào thùng rác", danger: true, disabled: options.blocked, onClick: () => confirm([id], "delete") });
  } else {
    if (can("restore")) items.push({ key: "restore", label: "Khôi phục", onClick: () => confirm([id], "restore") });
    if (can("hard_delete")) items.push({ key: "permanent", label: "Xóa vĩnh viễn", danger: true, disabled: options.blocked, onClick: () => confirm([id], "permanent") });
  }
  return items;
}

export function accessBulkActions(ids: string[], context: ResourceContext): MenuProps["items"] {
  const items: NonNullable<MenuProps["items"]> = [];
  if (context.trash && context.can("restore")) items.push({ key: "restore", label: "Khôi phục", onClick: () => context.confirm(ids, "restore") });
  if (context.can(context.trash ? "hard_delete" : "delete")) items.push({ key: "delete", label: context.trash ? "Xóa vĩnh viễn" : "Chuyển vào thùng rác", danger: true, onClick: () => context.confirm(ids, context.trash ? "permanent" : "delete") });
  return items;
}

export const accessStates = [{ value: "ACTIVE", label: "Hoạt động" }, { value: "INACTIVE", label: "Tạm ngưng" }];
