"use client";
import dynamic from "next/dynamic";
import { TeamOutlined } from "@ant-design/icons";
import { Avatar, Flex, Button, Space, Tag, Typography } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { allowed } from "@/lib/auth/permissions";
import { accessBulkActions, accessRowActions, accessStates } from "@/features/admin/access-actions";
import type { Member } from "./users-types";
const EntityDetail = dynamic(() => import("@/features/admin/components/entity-detail").then(m => m.EntityDetail));
const UserEditor = dynamic(() => import("./components/user-editor").then(m => m.UserEditor));
const AssignmentDrawer = dynamic(() => import("@/features/admin/components/assignment-drawer").then(m => m.AssignmentDrawer));

const config: ResourceConfig<Member> = {
  resource: "users", title: "Người dùng", description: "Quản lý tài khoản, trạng thái và vai trò của thành viên.", icon: <TeamOutlined />,
  supportsTrash: true, searchMaxLength: 255,
  states: [...accessStates, { value: "BLOCKED", label: "Bị chặn" }, { value: "SUSPENDED", label: "Đình chỉ" }, { value: "PENDING_VERIFICATION", label: "Chờ xác minh" }],
  blocked: (item, profile) => item.id === profile?.id,
  columns: context => [
    {
      title: "Người dùng", key: "name", width: 260, render: (_, item) => <Flex align="center" gap={12}>
        <Avatar style={{ background: "var(--tn-brand-soft)", color: "var(--tn-brand-ink)" }}>
          {(item.fullName || item.email).slice(0, 1).toUpperCase()}
        </Avatar>
        <div className="admin-identity">
          <Button type="link" className="admin-name" onClick={() => context.openDetail(item.id)}>
            {item.fullName || item.email}
          </Button>
          <Typography.Text type="secondary" className="admin-code">{item.email}</Typography.Text>
        </div>
      </Flex>
    },
    {
      title: "Vai trò", key: "info", width: 260, render: (_, item) => <Space wrap size={[4, 6]}>
        {item.roles.length ? item.roles.map(role => <Tag key={role.id}>{role.displayName}</Tag>) : <Typography.Text type="secondary">Chưa có vai trò</Typography.Text>}
      </Space>
    },

    {
      title: "Trạng thái", key: "status", width: 140, render: (_, item) => <Space orientation="vertical" size={6}>
        <StatusTag status={item.status} />
        {!item.isVerified && <Tag color="warning">Chưa xác minh</Tag>}
      </Space>
    },
  ],
  actions: (item, context) => accessRowActions(item.id, context, { blocked: item.id === context.profile?.id, assignment: { label: "Gán vai trò", permitted: context.can("roles_assign"), disabled: !allowed(context.profile, "roles.read") } }),
  bulkActions: (ids, _items, context) => accessBulkActions(ids, context),
  renderEditor: (id, close) => <UserEditor id={id} onClose={close} />,
  renderDetail: (id, trash, close) => <EntityDetail resource="users" id={id} trash={trash} onClose={close} />,
  renderAssignment: (id, close) => <AssignmentDrawer target={{ kind: "users", id }} onClose={close} />,
};
export function UsersView() { return <ResourceView config={config} />; }
