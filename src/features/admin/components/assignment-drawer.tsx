"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  Empty,
  Flex,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { assignResource } from "@/lib/admin/admin-api";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
import { useAdminDetail, useAssignmentOptions, useRefreshAdmin } from "@/lib/admin/admin-queries";
import { type Member } from "@/features/users/users-types";
import { type Permission } from "@/features/permissions/permissions-types";
import { type Role } from "@/features/roles/roles-types";
import { LoadError, useDrawerGuard } from "@/components/admin/admin-ui";
import { DebouncedSearch } from "@/components/debounced-search";
type Target = { kind: "roles" | "users"; id: string };
export function AssignmentDrawer({
  target,
  onClose,
}: {
  target: Target;
  onClose: () => void;
}) {
  const guard = useDrawerGuard(onClose);
  const detail = useAdminDetail<Role | Member>(target.kind, target.id, true);
  const options = useAssignmentOptions<Role | Permission>(
    target.kind === "roles" ? "permissions" : "roles",
    true,
  );
  return (
    <Drawer
      open
      title={
        target.kind === "roles"
          ? "Thiết lập quyền cho vai trò"
          : "Gán vai trò cho người dùng"
      }
      onClose={guard.requestClose}
      size={720}
      destroyOnHidden
    >
      {detail.isError ? (
        <LoadError error={detail.error} retry={() => void detail.refetch()} />
      ) : options.isError ? (
        <LoadError error={options.error} retry={() => void options.refetch()} />
      ) : !detail.data || !options.data ? (
        <Skeleton active />
      ) : (
        <AssignmentEditor
          key={target.id}
          target={target}
          detail={detail.data}
          options={options.data}
          guard={guard}
          onClose={onClose}
        />
      )}
    </Drawer>
  );
}
function AssignmentEditor({
  target,
  detail,
  options,
  onClose,
  guard,
}: {
  guard: ReturnType<typeof useDrawerGuard>;
  target: Target;
  detail: Role | Member;
  options: (Role | Permission)[];
  onClose: () => void;
}) {
  const profile = useWorkspaceProfile();
  const { modal, message } = App.useApp();
  const refresh = useRefreshAdmin(target.kind);
  const initial =
    target.kind === "roles"
      ? (detail as Role).permissions.map((p) => p.id)
      : (detail as Member).roles.map((r) => r.id);
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState("");
  const mutation = useMutation({
    onMutate: () => guard.markSaving(true),
    onSettled: () => guard.markSaving(false),
    mutationFn: () => assignResource(target, selected),
    onSuccess: async () => {
      onClose();
      void message.success("Đã cập nhật phân quyền.");
      await refresh();
    },
  });
  const changed =
    initial.length !== selected.length || initial.some((id) => !selected.includes(id));
  const canAssign = allowed(
    profile.data,
    target.kind === "roles" ? "roles.permissions_assign" : "users.roles_assign",
  );
  const name =
    target.kind === "roles"
      ? (detail as Role).displayName
      : (detail as Member).fullName || (detail as Member).email;
  const hasExpiry =
    target.kind === "users" && (detail as Member).roles.some((r) => r.expiresAt);
  const originalItems =
    target.kind === "roles" ? (detail as Role).permissions : (detail as Member).roles;
  const missing = initial.filter((id) => !options.some((p) => p.id === id));
  const visible = options.filter((p) =>
    (p.slug + " " + ("displayName" in p ? p.displayName : (p.description ?? "")))
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const groups = new Map<string, (Role | Permission)[]>();
  for (const option of visible) {
    const group = "module" in option ? option.module : "Vai trò có sẵn";
    groups.set(group, [...(groups.get(group) ?? []), option]);
  }
  const locked = (p: Role | Permission) =>
    (p.status !== "ACTIVE" && !initial.includes(p.id)) ||
    (target.kind === "roles" && !allowed(profile.data, p.slug)) ||
    (target.kind === "users" &&
      p.slug === "super_admin" &&
      !profile.data?.roles.includes("super_admin"));
  function toggle(id: string, checked: boolean) {
    guard.markDirty();
    setSelected((old) =>
      checked ? [...new Set([...old, id])] : old.filter((x) => x !== id),
    );
  }
  function save() {
    modal.confirm({
      title: "Xác nhận thay đổi phân quyền?",
      content: (
        <Space orientation="vertical">
          <Typography.Text>
            {name} sẽ có {selected.length} {target.kind === "roles" ? "quyền" : "vai trò"}{" "}
            sau khi lưu.
          </Typography.Text>
          {hasExpiry && (
            <Typography.Text type="warning">
              Các vai trò có thời hạn trong danh sách được lưu sẽ trở thành không thời
              hạn.
            </Typography.Text>
          )}
          <Typography.Text type="secondary">
            Danh sách mới sẽ thay thế các gán hiện tại. Thay đổi có thể ảnh hưởng quyền
            truy cập ngay lập tức.
          </Typography.Text>
        </Space>
      ),
      okText: "Xác nhận và lưu",
      cancelText: "Quay lại",
      onOk: () => mutation.mutateAsync(),
    });
  }
  return (
    <Flex vertical gap={20}>
      <div>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {name}
        </Typography.Title>
        <Typography.Text type="secondary">
          {target.kind === "roles" ? (detail as Role).slug : (detail as Member).email}
        </Typography.Text>
      </div>
      <Alert
        showIcon
        type="info"
        title={
          target.kind === "roles"
            ? "Chọn quyền theo từng nhóm chức năng"
            : "Một người dùng có thể nhận nhiều vai trò"
        }
        description="Chỉ cấp các quyền cần thiết cho công việc. Backend kiểm tra cấp bậc và phạm vi được phép ủy quyền khi lưu."
      />
      {hasExpiry && (
        <Alert
          type="warning"
          showIcon
          title="Danh sách hiện có vai trò được gán có thời hạn"
          description="Nếu lưu lại, các vai trò được giữ trong danh sách sẽ không còn thời hạn. Chỉ tiếp tục khi bạn muốn thay đổi này."
        />
      )}
      {target.kind === "roles" && (detail as Role).slug === "super_admin" && (
        <Alert
          type="warning"
          showIcon
          title="Super admin luôn có toàn quyền truy cập"
          description="Thay đổi danh sách quyền gán không giới hạn quyền của vai trò này."
        />
      )}
      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={
            missing.length +
            " mục đã gán không có trong danh mục hiện tại. Mặc định được giữ; bỏ chọn bên dưới để gỡ gán."
          }
        />
      )}
      {missing.map((id) => (
        <Checkbox
          key={id}
          checked={selected.includes(id)}
          disabled={!canAssign || mutation.isPending}
          onChange={(e) => toggle(id, e.target.checked)}
        >
          {originalItems.find((p) => p.id === id)?.slug ?? id} · Không có trong danh mục
        </Checkbox>
      ))}
      {mutation.isError && (
        <Alert role="alert" type="error" showIcon title={mutation.error.message} />
      )}
      <Flex wrap gap={12} align="center" justify="space-between">
        <DebouncedSearch
          aria-label="Tìm trong danh sách gán"
          placeholder="Tìm mã hoặc tên…"
          allowClear
          value={search}
          onSearch={setSearch}
          style={{ maxWidth: 360 }}
        />
        <Tag color="blue">Đã chọn {selected.length}</Tag>
      </Flex>
      <Checkbox.Group
        value={selected}
        style={{ display: "block" }}
        disabled={!canAssign || mutation.isPending}
      >
        {visible.length === 0 ? (
          <Empty description="Không có mục phù hợp" />
        ) : (
          <Collapse
            defaultActiveKey={[...groups.keys()]}
            items={[...groups].map(([group, items]) => ({
              key: group,
              label: (
                <Space>
                  {group}
                  <Tag>
                    {items.filter((p) => selected.includes(p.id)).length}/{items.length}
                  </Tag>
                </Space>
              ),
              children: (
                <Flex vertical gap={14}>
                  {target.kind === "roles" && (
                    <Checkbox
                      skipGroup
                      disabled={!canAssign || mutation.isPending || items.every(locked)}
                      checked={
                        items.filter((p) => !locked(p)).length > 0 &&
                        items
                          .filter((p) => !locked(p))
                          .every((p) => selected.includes(p.id))
                      }
                      onChange={(e) => {
                        guard.markDirty();
                        const ids = items.filter((p) => !locked(p)).map((p) => p.id);
                        setSelected((old) =>
                          e.target.checked
                            ? [...new Set([...old, ...ids])]
                            : old.filter((id) => !ids.includes(id)),
                        );
                      }}
                    >
                      Chọn tất cả có thể gán trong nhóm
                    </Checkbox>
                  )}
                  {items.map((p) => (
                    <Checkbox
                      key={p.id}
                      value={p.id}
                      disabled={locked(p)}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                    >
                      <Space orientation="vertical" size={0}>
                        <Typography.Text strong>
                          {"displayName" in p ? p.displayName : p.slug}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {"description" in p && p.description ? p.description : p.slug}
                          {p.status !== "ACTIVE" ? " · Tạm ngưng" : ""}
                        </Typography.Text>
                      </Space>
                    </Checkbox>
                  ))}
                </Flex>
              ),
            }))}
          />
        )}
      </Checkbox.Group>
      <Flex justify="end" gap={8} className="access-drawer-footer">
        <Button disabled={mutation.isPending} onClick={guard.requestClose}>
          Đóng
        </Button>
        <Button
          type="primary"
          loading={mutation.isPending}
          disabled={
            !changed ||
            !canAssign ||
            selected.length > (target.kind === "roles" ? 500 : 100)
          }
          onClick={save}
        >
          Lưu thay đổi
        </Button>
      </Flex>
    </Flex>
  );
}
