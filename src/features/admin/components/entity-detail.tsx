"use client";
import { Descriptions, Drawer, Skeleton, Space, Tag, Typography } from "antd";
import { useAdminDetail } from "@/lib/admin/admin-queries";
import { type Member } from "@/features/users/users-types";
import { type Permission } from "@/features/permissions/permissions-types";
import { type Resource } from "@/lib/admin/resource-types";
import { type Role } from "@/features/roles/roles-types";
import { type Service } from "@/features/services/services-types";
import { LoadError, StatusTag } from "@/components/admin/admin-ui";
export function EntityDetail({
  resource,
  id,
  trash,
  onClose,
}: {
  resource: Resource;
  id: string;
  trash: boolean;
  onClose: () => void;
}) {
  const query = useAdminDetail<Role | Permission | Member | Service>(
    resource,
    id,
    true,
    trash,
  );
  const item = query.data;
  const labels: Record<string, string> = {
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
  return (
    <Drawer open title="Thông tin chi tiết" size={620} onClose={onClose}>
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : !item ? (
        <Skeleton active />
      ) : (
        <Space orientation="vertical" size={24} style={{ width: "100%" }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {"displayName" in item
              ? item.displayName
              : "email" in item
                ? item.fullName || item.email
                : "name" in item
                  ? item.name
                  : item.slug}
          </Typography.Title>
          {"status" in item ? (
            <StatusTag status={item.status} />
          ) : (
            <Tag color={item.isActive ? "success" : "default"}>
              {item.isActive ? "Hoạt động" : "Tạm ngưng"}
            </Tag>
          )}
          <Descriptions
            column={1}
            bordered
            size="small"
            items={Object.entries(item)
              .filter(([k]) => labels[k])
              .map(([key, value]) => ({
                key,
                label: labels[key],
                children:
                  value === null
                    ? "—"
                    : key.endsWith("At") || key === "dateOfBirth"
                      ? new Date(String(value)).toLocaleString("vi-VN")
                      : String(value),
              }))}
          />
          {"permissions" in item && (
            <div>
              <Typography.Title level={5}>
                Quyền được cấp ({item.permissions.length})
              </Typography.Title>
              <Space wrap>
                {item.permissions.map((p) => (
                  <Tag key={p.id}>{p.slug}</Tag>
                ))}
              </Space>
            </div>
          )}
          {"roles" in item && (
            <div>
              <Typography.Title level={5}>Vai trò được gán</Typography.Title>
              <Space wrap>
                {item.roles.map((r) => (
                  <Tag key={r.id}>{r.displayName}</Tag>
                ))}
              </Space>
            </div>
          )}
        </Space>
      )}
    </Drawer>
  );
}
