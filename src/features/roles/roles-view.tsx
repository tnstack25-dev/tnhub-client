"use client";
import dynamic from "next/dynamic";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Space, Tag, Typography } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { allowed } from "@/lib/auth/permissions";
import { accessBulkActions, accessRowActions, accessStates } from "@/features/admin/access-actions";
import type { Role } from "./roles-types";
const EntityDetail = dynamic(() => import("@/features/admin/components/entity-detail").then(m => m.EntityDetail));
const CatalogEditor = dynamic(() => import("@/features/admin/components/catalog-editor").then(m => m.CatalogEditor));
const AssignmentDrawer = dynamic(() => import("@/features/admin/components/assignment-drawer").then(m => m.AssignmentDrawer));

const config: ResourceConfig<Role> = {
  resource: "roles", title: "Vai trò", description: "Xây dựng vai trò rõ ràng, cấp đúng quyền cho đúng người.", icon: <SafetyCertificateOutlined />,
  supportsTrash: true, searchMaxLength: 150,
  states: accessStates,
  blocked: (item) => item.isSystem,
  columns: context => [
    {
      title: "Vai trò", key: "name", width: 260, render: (_, item) => <div className="admin-identity">
        <Button type="link" className="admin-name" onClick={() => context.openDetail(item.id)}>
          {item.displayName}
        </Button>
        <Typography.Text type="secondary" className="admin-code">{item.slug}</Typography.Text>
      </div>
    },
    {
      title: "Thông tin", key: "info", width: 260, render: (_, item) => <Space orientation="vertical" size={4}>
        <Typography.Text>{item.permissions.length} quyền · {item.userCount} thành viên</Typography.Text>
        <Typography.Text type="secondary">Ưu tiên {item.priority}</Typography.Text>
      </Space>
    },
    {
      title: "Mô tả", dataIndex: "description", responsive: ["xxl"], width: 240, render: value => <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: true }} style={{ margin: 0 }}>
        {value || "Chưa có mô tả"}
      </Typography.Paragraph>
    },
    {
      title: "Trạng thái", key: "status", width: 140, render: (_, item) => <Space orientation="vertical" size={6}>
        <StatusTag status={item.status} />
        {item.isSystem && <Tag>Hệ thống</Tag>}
      </Space>
    },
  ],
  actions: (item, context) => accessRowActions(item.id, context, { blocked: item.isSystem, editDisabled: item.isSystem && !context.profile?.roles.includes("super_admin"), assignment: { label: "Thiết lập quyền", permitted: context.can("permissions_assign"), disabled: !allowed(context.profile, "permissions.read") || (item.isSystem && !context.profile?.roles.includes("super_admin")) } }),
  bulkActions: (ids, _items, context) => accessBulkActions(ids, context),
  renderEditor: (id, close) => <CatalogEditor resource="roles" id={id} onClose={close} />,
  renderDetail: (id, trash, close) => <EntityDetail resource="roles" id={id} trash={trash} onClose={close} />,
  renderAssignment: (id, close) => <AssignmentDrawer target={{ kind: "roles", id }} onClose={close} />,
};
export function RolesView() { return <ResourceView config={config} />; }
