"use client";
import type { ReactNode } from "react";
import { Descriptions, Drawer, Skeleton, Space, Tag, Typography } from "antd";
import { useAdminDetail } from "@/lib/admin/admin-queries";
import { type Resource } from "@/lib/admin/resource-types";
import { LoadError, StatusTag } from "@/components/admin/admin-ui";

export type EntityDetailSection<T = Record<string, unknown>> = {
  title: string | ((item: T) => string);
  render: (item: T) => ReactNode;
};

export type EntityDetailProps<T extends Record<string, unknown> = Record<string, unknown>> = {
  resource: Resource;
  id: string;
  trash: boolean;
  onClose: () => void;
  labels?: Record<string, string>;
  getTitle?: (item: T) => string;
  renderStatus?: (item: T) => ReactNode;
  sections?: EntityDetailSection<T>[];
};

const defaultLabels: Record<string, string> = {
  slug: "Mã định danh",
  displayName: "Tên vai trò",
  priority: "Mức ưu tiên",
  userCount: "Người dùng",
  email: "Email",
  fullName: "Họ và tên",
  username: "Tên đăng nhập",
  phone: "Số điện thoại",
  authProvider: "Đăng nhập bằng",
  dateOfBirth: "Ngày sinh",
  gender: "Giới tính",
  code: "Mã dịch vụ",
  name: "Tên dịch vụ",
  category: "Danh mục",
  defaultPrice: "Giá mặc định (VND)",
  module: "Module",
  action: "Hành động",
  group: "Nhóm",
  description: "Mô tả",
  createdAt: "Ngày tạo",
  updatedAt: "Cập nhật lần cuối",
  deletedAt: "Ngày xóa",
};

function resolveDefaultTitle(item: Record<string, unknown>): string {
  for (const key of ["displayName", "fullName", "name", "email", "slug", "code", "id"]) {
    const val = item[key];
    if (typeof val === "string" && val.trim()) return val;
  }
  return "Chi tiết";
}

function resolveDefaultStatus(item: Record<string, unknown>): ReactNode {
  if (typeof item.status === "string") {
    return <StatusTag status={item.status} />;
  }
  if (typeof item.isActive === "boolean") {
    return (
      <Tag color={item.isActive ? "success" : "default"}>
        {item.isActive ? "Hoạt động" : "Tạm ngưng"}
      </Tag>
    );
  }
  return null;
}

export function formatEntityDetailItems<T extends Record<string, unknown>>(
  item: T,
  fieldLabels: Record<string, string> = defaultLabels,
) {
  return Object.entries(item)
    .filter(([k]) => Object.hasOwn(fieldLabels, k))
    .map(([key, value]) => ({
      key,
      label: fieldLabels[key],
      children:
        value === null || value === undefined
          ? "—"
          : key.endsWith("At") || key === "dateOfBirth"
            ? new Date(String(value)).toLocaleString("vi-VN")
            : String(value),
    }));
}

export function EntityDetail<T extends Record<string, unknown> = Record<string, unknown>>({
  resource,
  id,
  trash,
  onClose,
  labels = defaultLabels,
  getTitle,
  renderStatus,
  sections,
}: EntityDetailProps<T>) {
  const query = useAdminDetail<T>(resource, id, true, trash);
  const item = query.data;
  const permissions =
    item && Array.isArray(item.permissions)
      ? (item.permissions as { id: string; slug: string }[])
      : undefined;
  const roles =
    item && Array.isArray(item.roles)
      ? (item.roles as { id: string; displayName: string }[])
      : undefined;

  return (
    <Drawer open title="Thông tin chi tiết" size={620} onClose={onClose}>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : !item ? (
        <Skeleton active />
      ) : (
        <Space orientation="vertical" size={24} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {getTitle ? getTitle(item) : resolveDefaultTitle(item)}
          </Typography.Title>
          {renderStatus ? renderStatus(item) : resolveDefaultStatus(item)}
          <Descriptions
            column={1}
            bordered
            size="small"
            items={formatEntityDetailItems(item, labels)}
          />
          {sections
            ? sections.map((section, idx) => {
                const heading =
                  typeof section.title === "function" ? section.title(item) : section.title;
                return (
                  <div key={heading || idx}>
                    <Typography.Title level={5}>{heading}</Typography.Title>
                    {section.render(item)}
                  </div>
                );
              })
            : (
              <>
                {permissions && (
                  <div>
                    <Typography.Title level={5}>
                      Quyền được cấp ({permissions.length})
                    </Typography.Title>
                    <Space wrap>
                      {permissions.map((p) => (
                        <Tag key={p.id}>{p.slug}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
                {roles && (
                  <div>
                    <Typography.Title level={5}>Vai trò được gán</Typography.Title>
                    <Space wrap>
                      {roles.map((r) => (
                        <Tag key={r.id}>{r.displayName}</Tag>
                      ))}
                    </Space>
                  </div>
                )}
              </>
            )}
        </Space>
      )}
    </Drawer>
  );
}
