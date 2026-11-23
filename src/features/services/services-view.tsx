"use client";
import "./services.css";
import dynamic from "next/dynamic";
import { AppstoreOutlined } from "@ant-design/icons";
import { Button, Select, Space, Tag, Typography, type MenuProps } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { StatusTag } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/admin/format";
import type { Service } from "./services-types";
const EntityDetail = dynamic(() => import("@/features/admin/components/entity-detail").then(m => m.EntityDetail));
const ServiceEditor = dynamic(() => import("./components/service-editor").then(m => m.ServiceEditor));
const ServiceBatch = dynamic(() => import("./components/service-batch").then(m => m.ServiceBatch));

const config: ResourceConfig<Service> = {
  resource: "services", title: "Dịch vụ", description: "Quản lý danh mục, giá và trạng thái các dịch vụ của bạn.", icon: <AppstoreOutlined />,
  supportsTrash: false, searchMaxLength: 150,
  states: [{ value: "ACTIVE", label: "Hoạt động" }, { value: "INACTIVE", label: "Tạm ngưng" }],
  blocked: () => false,
  formatSkipReason: reason => ({ SERVICE_ACTIVE: "Dịch vụ đang hoạt động", SERVICE_IN_USE: "Dịch vụ đang được sử dụng", NOT_FOUND: "Không tìm thấy", ALREADY_IN_STATE: "Đã ở trạng thái yêu cầu" } as Record<string, string>)[reason] ?? reason,
  params: ({ category, sort, status }) => { const [sortBy, sortOrder] = sort.split(":"); return { category: category ?? undefined, sortBy, sortOrder, status: undefined, isActive: status ? String(status === "ACTIVE") : undefined }; },
  renderFilters: ({ category, sort }, update) => <>
    <Select
      aria-label="Lọc danh mục"
      allowClear
      placeholder="Tất cả danh mục"
      value={category ?? undefined}
      style={{ minWidth: 160 }}
      options={["WEB", "SEO", "OTHER"].map(value => ({ value, label: value }))}
      onChange={value => update({ category: value ?? null })} />
    <Select
      aria-label="Sắp xếp dịch vụ"
      value={sort}
      style={{ minWidth: 180 }}
      options={[
        { value: "createdAt:desc", label: "Mới nhất" }, { value: "name:asc", label: "Tên A–Z" },
        { value: "defaultPrice:asc", label: "Giá tăng dần" }, { value: "defaultPrice:desc", label: "Giá giảm dần" },
      ]}
      onChange={value => update({ sort: value })} />
  </>,
  columns: context => [
    {
      title: "Dịch vụ", key: "name", width: 260, render: (_, item) => <div className="admin-identity">
        <Button type="link" className="admin-name" onClick={() => context.openDetail(item.id)}>
          {item.name}
        </Button>
        <Typography.Text type="secondary" className="admin-code">{item.code}</Typography.Text>
      </div>
    },
    {
      title: "Danh mục / Giá", key: "price", width: 220, render: (_, item) => <Space orientation="vertical" size={4}>
        <Tag>{item.category}</Tag>
        <Typography.Text strong>{formatPrice(item.defaultPrice)} ₫</Typography.Text>
      </Space>
    },
    {
      title: "Mô tả", dataIndex: "description", responsive: ["xxl"], width: 240, render: value => <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: true }} style={{ margin: 0 }}>
        {value || "Chưa có mô tả"}
      </Typography.Paragraph>
    },
    { title: "Trạng thái", key: "status", width: 140, render: (_, item) => <StatusTag status={item.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ],
  actions: (item, context) => {
    const items: NonNullable<MenuProps["items"]> = [{ key: "detail", label: "Xem chi tiết", onClick: () => context.openDetail(item.id) }];
    if (context.can("update")) items.push(
      { key: "edit", label: "Chỉnh sửa", onClick: () => context.openEditor(item.id) },
      { key: "status", label: item.isActive ? "Tạm ngưng dịch vụ" : "Bật dịch vụ", onClick: () => context.confirm([item.id], item.isActive ? "deactivate" : "activate") },
    );
    if (context.can("hard_delete")) items.push({ key: "delete", label: "Xóa vĩnh viễn", danger: true, disabled: item.isActive, onClick: () => context.confirm([item.id], "permanent") });
    return items;
  },
  bulkActions: (ids, _items, context) => {
    const items: NonNullable<MenuProps["items"]> = [];
    if (context.can("update")) items.push(
      { key: "edit", label: "Chỉnh sửa các dòng đã chọn", onClick: () => context.openBatch(ids) },
      { key: "activate", label: "Bật hoạt động", onClick: () => context.confirm(ids, "activate") },
      { key: "deactivate", label: "Tạm ngưng", onClick: () => context.confirm(ids, "deactivate") },
    );
    if (context.can("hard_delete")) items.push({ key: "delete", label: "Xóa vĩnh viễn", danger: true, onClick: () => context.confirm(ids, "permanent") });
    return items;
  },
  renderCreateActions: context => !context.trash && context.can("create") ? <Button onClick={() => context.openBatch()}>Tạo nhiều dịch vụ</Button> : null,
  renderEditor: (id, close) => <ServiceEditor id={id} onClose={close} />,
  renderDetail: (id, trash, close) => <EntityDetail resource="services" id={id} trash={trash} onClose={close} />,
  renderBatch: (items, close) => <ServiceBatch items={items} onClose={close} />,
};
export function ServicesView() { return <ResourceView config={config} />; }
