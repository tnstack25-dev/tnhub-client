"use client";
import "./admin.css";
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Flex,
  Result,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { useRef, type ReactNode } from "react";
import { ApiError } from "@/lib/axios/error";
import { useWorkspaceProfile } from "@/lib/auth/profile-query";
import { allowed } from "@/lib/auth/permissions";
export function AdminFrame({
  permission,
  title,
  description,
  children,
}: {
  permission: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const profile = useWorkspaceProfile();
  return (
    <Flex vertical gap={24} className="admin-page">
      <header className="admin-page-heading">
        <div>
          <Typography.Text className="admin-eyebrow">KHÔNG GIAN QUẢN TRỊ</Typography.Text>
          <Typography.Title level={1}>{title}</Typography.Title>
          <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
        </div>
        <Tag color="blue">TNHub Workspace</Tag>
      </header>
      {profile.isPending ? (
        <Skeleton active />
      ) : profile.isError ? (
        <LoadError error={profile.error} retry={() => void profile.refetch()} />
      ) : !allowed(profile.data, permission) ? (
        <Result
          status="403"
          title="Bạn chưa có quyền truy cập"
          subTitle="Liên hệ quản trị viên để được cấp quyền phù hợp."
        />
      ) : (
        children
      )}
    </Flex>
  );
}
export function LoadError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Alert
      showIcon
      type="error"
      role="alert"
      title={
        error instanceof ApiError && error.status === 403
          ? "Bạn không có quyền thực hiện thao tác này."
          : error.message
      }
      action={<Button onClick={retry}>Thử lại</Button>}
    />
  );
}
export function StatusTag({ status }: { status: string }) {
  const text: Record<string, string> = {
    ACTIVE: "Hoạt động",
    INACTIVE: "Tạm ngưng",
    BLOCKED: "Bị chặn",
    SUSPENDED: "Đình chỉ",
    PENDING_VERIFICATION: "Chờ xác minh",
  };
  return (
    <Tag
      color={
        status === "ACTIVE" ? "success" : status === "INACTIVE" ? "default" : "warning"
      }
    >
      {text[status] ?? status}
    </Tag>
  );
}
export const emptyAdmin = (
  <Empty
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    description="Không tìm thấy kết quả. Hãy thay đổi tìm kiếm hoặc bộ lọc."
  />
);
export function AdminHint() {
  return (
    <Card size="small">
      <Typography.Text type="secondary">
        Người dùng nhận quyền qua vai trò. Quyền hệ thống được bảo vệ; mọi thay đổi vẫn
        được backend kiểm tra theo quyền và cấp bậc của bạn.
      </Typography.Text>
    </Card>
  );
}

export function useDrawerGuard(onClose: () => void) {
  const dirty = useRef(false);
  const saving = useRef(false);
  const { modal } = App.useApp();
  return {
    markDirty: () => {
      dirty.current = true;
    },
    markSaving: (value: boolean) => {
      saving.current = value;
    },
    requestClose: () => {
      if (saving.current) return;
      if (!dirty.current) {
        onClose();
        return;
      }
      modal.confirm({
        title: "Bỏ thay đổi chưa lưu?",
        content: "Những thay đổi trong biểu mẫu sẽ không được lưu.",
        okText: "Bỏ thay đổi",
        cancelText: "Tiếp tục chỉnh sửa",
        okButtonProps: { danger: true },
        onOk: onClose,
      });
    },
  };
}
