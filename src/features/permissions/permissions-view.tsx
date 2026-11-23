"use client";
import dynamic from "next/dynamic";
import { KeyOutlined } from "@ant-design/icons";
import { Button, Space, Tag, Typography } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { accessBulkActions, accessRowActions, accessStates } from "@/features/admin/access-actions";
import type { Permission } from "./permissions-types";
const EntityDetail = dynamic(() => import("@/features/admin/components/entity-detail").then(m => m.EntityDetail));
const CatalogEditor = dynamic(() => import("@/features/admin/components/catalog-editor").then(m => m.CatalogEditor));

const config: ResourceConfig<Permission> = {
  resource: "permissions", title: "Danh mục quyền", description: "Quản lý danh mục quyền truy cập trên từng chức năng.", icon: <KeyOutlined />,
  supportsTrash: true, searchMaxLength: 150,
  states: accessStates,
  blocked: (item) => item.isSystem,
  columns: context => [
    {
      title: "Danh mục quyền", key: "name", width: 260, render: (_, item) => <div className="admin-identity">
        <Button type="link" className="admin-name" onClick={() => context.openDetail(item.id)}>
          {item.slug}
        </Button>
        <Typography.Text type="secondary" className="admin-code">
          {item.module + "." + item.action}
        </Typography.Text>
      </div>
    },
    {
      title: "Thông tin", key: "info", width: 260, render: (_, item) => <Space orientation="vertical" size={4}>
        <Tag>{item.module}</Tag>
        <Typography.Text type="secondary">{item.group || item.action}</Typography.Text>
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
  actions: (item, context) => accessRowActions(item.id, context, { blocked: item.isSystem }),
  bulkActions: (ids, _items, context) => accessBulkActions(ids, context),
  renderEditor: (id, close) => <CatalogEditor resource="permissions" id={id} onClose={close} />,
  renderDetail: (id, trash, close) => <EntityDetail resource="permissions" id={id} trash={trash} onClose={close} />,

};
export function PermissionsView() { return <ResourceView config={config} />; }
