"use client";
import { useState } from "react";
import { Alert, App, Button, Flex, Space, Table, Tag, Typography, type TableColumnsType } from "antd";
import { LoadError } from "@/components/admin/admin-ui";
import { useRevokeSession, useSessions } from "../account-queries";
import type { Session } from "../account-types";
export function SessionsView() {
  const [page, setPage] = useState(1);
  const { modal, message } = App.useApp();
  const query = useSessions(page);
  const mutation = useRevokeSession(() => { void message.success("Đã thu hồi phiên đăng nhập."); });
  function revoke(id?: string, current = false) {
    modal.confirm({
      title:
        id === "others"
          ? "Đăng xuất các thiết bị khác?"
          : !id
            ? "Đăng xuất tất cả thiết bị?"
            : "Thu hồi phiên đăng nhập này?",
      content: "Thiết bị bị thu hồi sẽ cần đăng nhập lại.",
      okText: "Thu hồi phiên",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: () => mutation.mutateAsync({ id, current }),
    });
  }
  const columns: TableColumnsType<Session> = [
    {
      title: "Thiết bị",
      key: "device",
      width: 240,
      render: (_, s) => (
        <Space orientation="vertical" size={4}>
          <Typography.Text strong>
            {s.deviceLabel || s.userAgent?.slice(0, 90) || "Thiết bị chưa xác định"}
          </Typography.Text>
          <Typography.Text type="secondary">
            {s.ipAddress || "Không có địa chỉ IP"}
          </Typography.Text>
          {s.current && <Tag color="blue">Phiên hiện tại</Tag>}
        </Space>
      ),
    },
    {
      title: "Hoạt động gần nhất",
      key: "used",
      width: 170,
      render: (_, s) => new Date(s.lastUsedAt || s.createdAt).toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      key: "active",
      width: 120,
      render: (_, s) => (
        <Tag color={s.active ? "success" : "default"}>
          {s.active ? "Hoạt động" : "Đã kết thúc"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "action",
      width: 100,
      render: (_, s) =>
        s.active && (
          <Button
            danger
            type="link"
            disabled={mutation.isPending}
            onClick={() => revoke(s.id, s.current)}
          >
            Thu hồi
          </Button>
        ),
    },
  ];
  return (
    <Flex vertical gap={16}>
      <Flex wrap gap={8}>
        <Button danger onClick={() => revoke("others")} disabled={mutation.isPending}>
          Đăng xuất thiết bị khác
        </Button>
        <Button danger onClick={() => revoke()} disabled={mutation.isPending}>
          Đăng xuất tất cả
        </Button>
        <Button onClick={() => void query.refetch()} loading={query.isFetching}>
          Tải lại
        </Button>
      </Flex>
      {mutation.isError && (
        <Alert type="error" role="alert" title={mutation.error.message} />
      )}{" "}
      {query.isError ? (
        <LoadError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <Table<Session>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.items ?? []}
          loading={query.isFetching}
          scroll={{ x: 650 }}
          pagination={{
            current: page,
            pageSize: 10,
            total: query.data?.meta.total,
            showSizeChanger: false,
            onChange: setPage,
          }}
        />
      )}
    </Flex>
  );
}
