"use client";
import dynamic from "next/dynamic";
import { TagsOutlined } from "@ant-design/icons";
import { Button, Select, Space, Tag, Typography, type MenuProps } from "antd";
import { ResourceView } from "@/components/admin/resource-view";
import type { ResourceConfig } from "@/components/admin/resource-config";
import { EntityDetail } from "@/features/admin/components/entity-detail";
import type { ProjectTag } from "./tags-types";

const TagEditor = dynamic(() =>
  import("./components/tag-editor").then((m) => m.TagEditor),
);
const TagBatch = dynamic(() =>
  import("./components/tag-editor").then((m) => m.TagBatch),
);

const config: ResourceConfig<ProjectTag> = {
  resource: "tags",
  title: "Nhãn dự án",
  description:
    "Quản lý danh mục nhãn màu sắc dùng để phân loại dự án và công việc.",
  icon: <TagsOutlined />,
  supportsTrash: false,
  searchMaxLength: 100,
  states: [],
  blocked: () => false,
  formatSkipReason: (reason) =>
    ({
      NOT_FOUND: "Không tìm thấy nhãn",
      TAG_IN_USE: "Nhãn đang được gắn vào dự án hoặc công việc",
    } as Record<string, string>)[reason] ?? reason,
  params: ({ sort }) => {
    const [rawSortBy, sortOrder] = sort.split(":");
    const sortBy = ["name", "createdAt"].includes(rawSortBy) ? rawSortBy : "name";
    return { sortBy, sortOrder: sortOrder || "asc" };
  },
  renderFilters: ({ sort }, update) => (
    <Select
      aria-label="Sắp xếp nhãn"
      value={["name:asc", "name:desc", "createdAt:desc", "createdAt:asc"].includes(sort) ? sort : "name:asc"}
      style={{ minWidth: 180 }}
      options={[
        { value: "name:asc", label: "Tên A–Z" },
        { value: "name:desc", label: "Tên Z–A" },
        { value: "createdAt:desc", label: "Mới tạo nhất" },
        { value: "createdAt:asc", label: "Cũ nhất" },
      ]}
      onChange={(value) => update({ sort: value })}
    />
  ),
  columns: (context) => [
    {
      title: "Nhãn",
      key: "name",
      width: 260,
      render: (_, item) => (
        <Space size={10}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 4,
              background: item.color || "var(--tn-muted)",
              border: "1px solid var(--tn-line)",
            }}
          />
          <Button
            type="link"
            className="admin-name"
            onClick={() => context.openDetail(item.id)}
          >
            {item.name}
          </Button>
        </Space>
      ),
    },
    {
      title: "Màu hiển thị",
      key: "color",
      width: 180,
      render: (_, item) =>
        item.color ? (
          <Tag color={item.color}>{item.color}</Tag>
        ) : (
          <Typography.Text type="secondary">Mặc định</Typography.Text>
        ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 180,
      render: (value) => new Date(value).toLocaleString("vi-VN"),
    },
  ],
  actions: (item, context) => {
    const items: NonNullable<MenuProps["items"]> = [
      { key: "detail", label: "Xem chi tiết", onClick: () => context.openDetail(item.id) },
    ];
    if (context.can("update")) {
      items.push({
        key: "edit",
        label: "Chỉnh sửa",
        onClick: () => context.openEditor(item.id),
      });
    }
    if (context.can("hard_delete")) {
      items.push({
        key: "delete",
        label: "Xóa vĩnh viễn",
        danger: true,
        onClick: () => context.confirm([item.id], "permanent"),
      });
    }
    return items;
  },
  bulkActions: (ids, _items, context) => {
    const items: NonNullable<MenuProps["items"]> = [];
    if (context.can("update")) {
      items.push({
        key: "edit",
        label: "Chỉnh sửa các nhãn đã chọn",
        onClick: () => context.openBatch(ids),
      });
    }
    if (context.can("hard_delete")) {
      items.push({
        key: "delete",
        label: "Xóa vĩnh viễn",
        danger: true,
        onClick: () => context.confirm(ids, "permanent"),
      });
    }
    return items;
  },
  renderCreateActions: (context) =>
    context.can("create") ? (
      <Button onClick={() => context.openBatch()}>Tạo nhiều nhãn</Button>
    ) : null,
  renderEditor: (id, close) => <TagEditor id={id} onClose={close} />,
  renderDetail: (id, trash, close) => (
    <EntityDetail<ProjectTag>
      resource="tags"
      id={id}
      trash={trash}
      onClose={close}
      labels={{
        name: "Tên nhãn",
        color: "Mã màu Hex",
        createdAt: "Ngày tạo",
      }}
      getTitle={(item) => item.name}
      renderStatus={(item) =>
        item.color ? <Tag color={item.color}>{item.color}</Tag> : <Tag>Mặc định</Tag>
      }
    />
  ),
  renderBatch: (items, close) => <TagBatch items={items} onClose={close} />,
};

export function TagsView() {
  return <ResourceView config={config} />;
}
